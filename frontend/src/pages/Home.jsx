import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, CalendarDays, Clock } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { api, errMsg, todayISO, nextHour, getPosition } from "@/lib/api";
import { WeatherCard } from "@/components/WeatherCard";
import { ActivityCard } from "@/components/ActivityCard";
import { ProposeDialog } from "@/components/ProposeDialog";

export const useFavorites = () => {
  const { t } = useI18n();
  const [favs, setFavs] = useState([]);
  const load = useCallback(() => api.get("/favorites").then((r) => setFavs(r.data)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const favOf = (a) => favs.find((f) => f.activity.title === a.title);
  const toggleFav = async (a) => {
    const f = favOf(a);
    try {
      if (f) {
        await api.delete(`/favorites/${f.favorite_id}`);
        toast(t("fav_removed"));
      } else {
        await api.post("/favorites", a);
        toast.success(t("fav_added"));
      }
      load();
    } catch (e) { toast.error(errMsg(e, t)); }
  };
  return { favs, favOf, toggleFav, reload: load };
};

export const useMarkDone = () => {
  const { t } = useI18n();
  return async (a, date) => {
    try {
      await api.post("/history", { activity: a, date });
      toast.success(t("done_saved"));
    } catch (e) { toast.error(errMsg(e, t)); }
  };
};

const Skeleton = () => (
  <div className="grid sm:grid-cols-2 gap-4" data-testid="suggestions-loading">
    {[0, 1, 2, 3].map((i) => <div key={i} className="card-soft h-56 animate-pulse bg-gradient-to-br from-white to-[var(--pink-light)]" />)}
  </div>
);

export default function Home() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState(nextHour());
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [proposing, setProposing] = useState(null);
  const { favOf, toggleFav } = useFavorites();
  const markDone = useMarkDone();

  useEffect(() => {
    api.get("/suggestions/latest").then((r) => r.data?.activities && setResult(r.data)).catch(() => {});
  }, []);

  const generate = async () => {
    setBusy(true);
    try {
      const pos = user.location_consent ? await getPosition() : null;
      const { data } = await api.post("/suggestions", { date, time, ...(pos || {}) });
      setResult(data);
    } catch (e) {
      toast.error(errMsg(e, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="fade-up">
        <p className="text-[var(--pink)] font-semibold">{t("home_greeting")}, {user.name?.split(" ")[0]}</p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mt-1" data-testid="home-title">{t("home_title")}</h1>
      </section>

      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="card-soft p-5 sm:p-6 space-y-4" data-testid="date-time-picker">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{t("date")}</span>
              <input type="date" className="field" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} data-testid="date-input" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{t("time")}</span>
              <input type="time" className="field" value={time} onChange={(e) => setTime(e.target.value)} data-testid="time-input" />
            </label>
          </div>
          <button onClick={generate} disabled={busy} className="btn-pink w-full py-3.5 inline-flex items-center justify-center gap-2" data-testid="generate-suggestions-btn">
            <Sparkles className={`h-5 w-5 ${busy ? "animate-spin" : ""}`} />{busy ? t("generating") : t("generate")}
          </button>
        </div>
        {result ? <WeatherCard weather={result.weather} place={result.place} /> : (
          <div className="card-soft p-5 text-sm text-slate-500 grid place-items-center text-center">{t("no_suggestions")}</div>
        )}
      </section>

      <section className="space-y-4">
        {result && !busy && (
          <h2 className="font-display text-lg font-bold" data-testid="suggestions-heading">
            {t("suggestions_for")} {new Date(result.date).toLocaleDateString(lang)} · {result.time}
          </h2>
        )}
        {busy ? <Skeleton /> : (
          <div className="grid sm:grid-cols-2 gap-4" data-testid="suggestions-list">
            {result?.activities?.map((a, i) => (
              <ActivityCard key={a.activity_id || i} a={a} index={i} isFav={!!favOf(a)} onFav={toggleFav}
                onDone={(x) => markDone(x, result.date)} onPropose={setProposing} />
            ))}
          </div>
        )}
      </section>
      <ProposeDialog activity={proposing} date={result?.date} time={result?.time} onClose={() => setProposing(null)} />
    </div>
  );
}
