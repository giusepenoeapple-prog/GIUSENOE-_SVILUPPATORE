import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bot, Send, RotateCcw } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { api, API_BASE, TOKEN_KEY } from "@/lib/api";

const Bubble = ({ m, i }) => (
  <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`ai-message-${i}`}>
    <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-[var(--pink)] text-white rounded-ee-md" : "bg-white border border-[var(--line)] rounded-es-md"}`}>
      {m.content || <span className="inline-flex gap-1"><span className="h-2 w-2 rounded-full bg-[var(--pink)] animate-bounce" /><span className="h-2 w-2 rounded-full bg-[var(--pink)] animate-bounce [animation-delay:120ms]" /><span className="h-2 w-2 rounded-full bg-[var(--pink)] animate-bounce [animation-delay:240ms]" /></span>}
    </div>
  </div>
);

export default function Assistant() {
  const { t } = useI18n();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { api.get("/assistant/messages").then((r) => setMsgs(r.data)).catch(() => {}); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const appendDelta = (d) => setMsgs((m) => {
    const copy = [...m];
    copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + d };
    return copy;
  });

  const send = async (e) => {
    e.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    setText("");
    setBusy(true);
    setMsgs((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "" }]);
    try {
      const res = await fetch(`${API_BASE}/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
        body: JSON.stringify({ message }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop();
        for (const p of parts) {
          if (!p.startsWith("data: ")) continue;
          const ev = JSON.parse(p.slice(6));
          if (ev.delta) appendDelta(ev.delta);
          if (ev.error) toast.error(t("ai_unavailable"));
        }
      }
    } catch {
      toast.error(t("ai_unavailable"));
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => { await api.delete("/assistant/messages"); setMsgs([]); };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between gap-3 pb-4">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">{t("assistant_title")}</h1>
        {msgs.length > 0 && <button onClick={clear} className="chip inline-flex items-center gap-1.5 text-sm shrink-0" data-testid="ai-clear-btn"><RotateCcw className="h-4 w-4" />{t("clear_chat")}</button>}
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pb-3" data-testid="ai-messages">
        {msgs.length === 0 && (
          <div className="card-soft p-8 text-center space-y-3 bg-gradient-to-br from-white to-[var(--pink-light)]" data-testid="ai-empty">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-[var(--pink)] grid place-items-center"><Bot className="h-7 w-7 text-white" /></div>
            <p className="text-slate-600 max-w-md mx-auto">{t("assistant_hint")}</p>
          </div>
        )}
        {msgs.map((m, i) => <Bubble key={i} m={m} i={i} />)}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 pt-2">
        <input className="field !rounded-full" placeholder={t("ask_placeholder")} value={text} onChange={(e) => setText(e.target.value)} data-testid="ai-chat-input" />
        <button disabled={busy} className="btn-pink h-12 w-12 shrink-0 grid place-items-center" data-testid="ai-chat-send-btn"><Send className="h-5 w-5 rtl:rotate-180" /></button>
      </form>
    </div>
  );
}
