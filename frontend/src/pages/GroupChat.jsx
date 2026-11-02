import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Send, CalendarPlus, Copy, LogOut, MapPin, CalendarDays } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { api, errMsg, todayISO, nextHour } from "@/lib/api";

const ProposalCard = ({ m, me, onVote, idx }) => {
  const { t } = useI18n();
  const votes = Object.values(m.votes || {});
  const mine = m.votes?.[me];
  return (
    <div className="rounded-2xl bg-white border-2 border-[var(--pink-subtle)] p-4 space-y-2 min-w-[240px]" data-testid={`proposal-card-${idx}`}>
      <p className="text-[11px] uppercase tracking-widest font-bold text-[var(--pink)]">{t("proposal")}</p>
      <p className="font-display font-bold">{m.proposal.title}</p>
      {(m.proposal.date || m.proposal.time) && <p className="text-xs text-slate-500 inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{m.proposal.date} {m.proposal.time}</p>}
      {m.proposal.place && <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{m.proposal.place}</p>}
      {m.text && <p className="text-sm text-slate-600">{m.text}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={() => onVote(m, "yes")} className={`chip text-xs ${mine === "yes" ? "chip-on" : ""}`} data-testid={`vote-yes-btn-${idx}`}>{t("vote_yes")} · {votes.filter((v) => v === "yes").length}</button>
        <button onClick={() => onVote(m, "no")} className={`chip text-xs ${mine === "no" ? "!bg-slate-800 !border-slate-800 text-white" : ""}`} data-testid={`vote-no-btn-${idx}`}>{t("vote_no")} · {votes.filter((v) => v === "no").length}</button>
      </div>
    </div>
  );
};

const ProposeForm = ({ open, onClose, onSend }) => {
  const { t } = useI18n();
  const [p, setP] = useState({ title: "", date: todayISO(), time: nextHour(), place: "" });
  const submit = (e) => { e.preventDefault(); if (p.title.trim()) { onSend(p); setP({ ...p, title: "", place: "" }); } };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl" data-testid="proposal-form-dialog">
        <DialogHeader><DialogTitle className="font-display">{t("propose")}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <input className="field" placeholder={t("title")} value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} data-testid="proposal-title-input" />
          <div className="grid grid-cols-2 gap-2">
            <input className="field" type="date" value={p.date} onChange={(e) => setP({ ...p, date: e.target.value })} data-testid="proposal-date-input" />
            <input className="field" type="time" value={p.time} onChange={(e) => setP({ ...p, time: e.target.value })} data-testid="proposal-time-input" />
          </div>
          <input className="field" placeholder={t("place")} value={p.place} onChange={(e) => setP({ ...p, place: e.target.value })} data-testid="proposal-place-input" />
          <button className="btn-pink w-full py-3" data-testid="proposal-submit-btn">{t("send")}</button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function GroupChat() {
  const { groupId } = useParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [proposeOpen, setProposeOpen] = useState(false);
  const endRef = useRef(null);
  const count = useRef(0);

  useEffect(() => {
    api.get(`/groups/${groupId}`).then((r) => setGroup(r.data)).catch(() => navigate("/groups"));
    const load = () => api.get(`/groups/${groupId}/messages`).then((r) => setMsgs(r.data)).catch(() => {});
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [groupId, navigate]);

  useEffect(() => {
    if (msgs.length !== count.current) endRef.current?.scrollIntoView({ behavior: "smooth" });
    count.current = msgs.length;
  }, [msgs]);

  const post = async (body) => {
    try {
      const { data } = await api.post(`/groups/${groupId}/messages`, body);
      setMsgs((m) => [...m, data]);
    } catch (e) { toast.error(errMsg(e, t)); }
  };
  const sendText = (e) => { e.preventDefault(); if (text.trim()) { post({ text }); setText(""); } };
  const vote = async (m, v) => {
    await api.post(`/groups/${groupId}/messages/${m.message_id}/vote`, { vote: v });
    setMsgs((all) => all.map((x) => (x.message_id === m.message_id ? { ...x, votes: { ...x.votes, [user.user_id]: v } } : x)));
  };
  const leave = async () => { await api.post(`/groups/${groupId}/leave`); navigate("/groups"); };
  const copy = () => { navigator.clipboard?.writeText(group.invite_code); toast.success(t("copied")); };

  if (!group) return null;
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-7rem)]">
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--line)]">
        <Link to="/groups" className="p-2 -ms-2" data-testid="group-back-btn"><ArrowLeft className="h-5 w-5 rtl:rotate-180" /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-bold truncate" data-testid="group-name">{group.name}</h1>
          <p className="text-xs text-slate-500 truncate">{group.member_list.map((m) => m.name).join(", ")}</p>
        </div>
        <button onClick={copy} className="chip text-xs inline-flex items-center gap-1" data-testid="copy-invite-code-btn"><Copy className="h-3.5 w-3.5" />{group.invite_code}</button>
        <button onClick={leave} className="p-2 text-slate-400 hover:text-rose-500" title={t("leave_group")} data-testid="leave-group-btn"><LogOut className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto py-4 space-y-3" data-testid="chat-messages">
        {msgs.map((m, i) => {
          const mine = m.user_id === user.user_id;
          return (
            <div key={m.message_id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`} data-testid={`chat-message-${i}`}>
              {!mine && <span className="text-xs text-slate-500 mb-1 px-1">{m.user_name}</span>}
              {m.type === "proposal" ? <ProposalCard m={m} me={user.user_id} onVote={vote} idx={i} /> : (
                <div className={`max-w-[80%] rounded-3xl px-4 py-2.5 text-sm ${mine ? "bg-[var(--pink)] text-white rounded-ee-md" : "bg-white border border-[var(--line)] rounded-es-md"}`}>{m.text}</div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={sendText} className="flex gap-2 pt-3">
        <button type="button" onClick={() => setProposeOpen(true)} className="h-12 w-12 shrink-0 rounded-full bg-[var(--pink-subtle)] text-[var(--pink)] grid place-items-center" title={t("propose")} data-testid="open-proposal-btn"><CalendarPlus className="h-5 w-5" /></button>
        <input className="field !rounded-full" placeholder={t("type_message")} value={text} onChange={(e) => setText(e.target.value)} data-testid="chat-input" />
        <button className="btn-pink h-12 w-12 shrink-0 grid place-items-center" data-testid="chat-send-btn"><Send className="h-5 w-5 rtl:rotate-180" /></button>
      </form>
      <ProposeForm open={proposeOpen} onClose={() => setProposeOpen(false)} onSend={(p) => { post({ text: "", proposal: p }); setProposeOpen(false); }} />
    </div>
  );
}
