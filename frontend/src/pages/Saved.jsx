import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ThumbsUp, ThumbsDown, Trash2, MapPin, Heart } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { api, errMsg } from "@/lib/api";
import { ActivityMeta } from "@/components/ActivityCard";
import { useFavorites } from "./Home";

const Empty = ({ text, testId }) => <div className="card-soft p-10 text-center text-slate-500" data-testid={testId}>{text}</div>;

const FavoritesList = () => {
  const { t } = useI18n();
  const { favs, toggleFav } = useFavorites();
  if (!favs.length) return <Empty text={t("empty_favorites")} testId="favorites-empty" />;
  return (
    <div className="grid sm:grid-cols-2 gap-4" data-testid="favorites-list">
      {favs.map((f, i) => (
        <div key={f.favorite_id} className="card-soft p-5 space-y-3 fade-up" data-testid={`favorite-item-${i}`}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-bold">{f.activity.title}</h3>
            <button onClick={() => toggleFav(f.activity)} className="text-[var(--pink)]" data-testid={`favorite-remove-btn-${i}`}><Heart className="h-5 w-5 fill-[var(--pink)]" /></button>
          </div>
          <p className="text-sm text-slate-600">{f.activity.description}</p>
          <ActivityMeta a={f.activity} />
          {f.activity.place && <p className="text-sm text-slate-500 inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[var(--pink)]" />{f.activity.place}</p>}
        </div>
      ))}
    </div>
  );
};

const HistoryList = () => {
  const { t, lang } = useI18n();
  const [items, setItems] = useState(null);
  useEffect(() => { api.get("/history").then((r) => setItems(r.data)).catch(() => setItems([])); }, []);

  const rate = async (h, r) => {
    const rating = h.rating === r ? null : r;
    try {
      await api.patch(`/history/${h.history_id}`, { rating });
      setItems(items.map((x) => (x.history_id === h.history_id ? { ...x, rating } : x)));
    } catch (e) { toast.error(errMsg(e, t)); }
  };
  const remove = async (h) => {
    await api.delete(`/history/${h.history_id}`);
    setItems(items.filter((x) => x.history_id !== h.history_id));
  };

  if (items === null) return null;
  if (!items.length) return <Empty text={t("empty_history")} testId="history-empty" />;
  return (
    <div className="space-y-3" data-testid="history-list">
      <p className="text-sm text-slate-500">{t("rate_hint")}</p>
      {items.map((h, i) => (
        <div key={h.history_id} className="card-soft p-4 sm:p-5 flex items-center gap-4 fade-up" data-testid={`history-item-${i}`}>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400">{new Date(h.date).toLocaleDateString(lang)}</p>
            <h3 className="font-display font-bold truncate">{h.activity.title}</h3>
            <p className="text-sm text-slate-500 truncate">{h.activity.place}</p>
          </div>
          <button onClick={() => rate(h, "up")} data-testid={`history-thumb-up-${i}`}
            className={`h-10 w-10 rounded-full grid place-items-center border transition-colors ${h.rating === "up" ? "bg-emerald-500 border-emerald-500 text-white" : "border-[var(--line)] text-slate-500 hover:border-emerald-400"}`}>
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button onClick={() => rate(h, "down")} data-testid={`history-thumb-down-${i}`}
            className={`h-10 w-10 rounded-full grid place-items-center border transition-colors ${h.rating === "down" ? "bg-rose-500 border-rose-500 text-white" : "border-[var(--line)] text-slate-500 hover:border-rose-400"}`}>
            <ThumbsDown className="h-4 w-4" />
          </button>
          <button onClick={() => remove(h)} className="text-slate-300 hover:text-rose-500" data-testid={`history-delete-${i}`}><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
};

export default function Saved() {
  const { t } = useI18n();
  const [tab, setTab] = useState("favorites");
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">{t("saved")}</h1>
      <div className="inline-flex rounded-full bg-white border border-[var(--line)] p-1">
        {["favorites", "history"].map((k) => (
          <button key={k} onClick={() => setTab(k)} data-testid={`saved-tab-${k}`}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${tab === k ? "bg-[var(--pink)] text-white" : "text-slate-600"}`}>{t(k)}</button>
        ))}
      </div>
      {tab === "favorites" ? <FavoritesList /> : <HistoryList />}
    </div>
  );
}
