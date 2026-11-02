import { Heart, Check, Clock, MapPin, Home as HomeIcon, Trees, Send } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { hobbyLabel } from "@/i18n/translations";

export const ActivityMeta = ({ a }) => {
  const { t, lang } = useI18n();
  return (
    <div className="flex flex-wrap gap-1.5 text-xs">
      {a.category && <span className="rounded-full bg-[var(--pink-subtle)] text-[var(--pink-hover)] px-2.5 py-1 font-medium">{hobbyLabel(a.category, lang)}</span>}
      {a.duration_minutes ? <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><Clock className="h-3 w-3" />{a.duration_minutes} {t("minutes")}</span> : null}
      {a.indoor !== null && a.indoor !== undefined && (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
          {a.indoor ? <HomeIcon className="h-3 w-3" /> : <Trees className="h-3 w-3" />}{a.indoor ? t("indoor") : t("outdoor")}
        </span>
      )}
      {a.cost && <span className="rounded-full bg-slate-100 px-2.5 py-1">{t(`cost_${a.cost}`)}</span>}
    </div>
  );
};

export const ActivityCard = ({ a, index, isFav, onFav, onDone, onPropose }) => {
  const { t } = useI18n();
  return (
    <article className="card-soft p-5 sm:p-6 flex flex-col gap-3 fade-up" style={{ animationDelay: `${index * 70}ms` }} data-testid={`activity-card-${index}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-bold leading-snug" data-testid={`activity-title-${index}`}>{a.title}</h3>
        {a.match_score ? (
          <span className="shrink-0 rounded-full bg-[var(--ink)] text-white text-xs font-semibold px-2.5 py-1" data-testid={`activity-match-${index}`}>
            {a.match_score}% {t("match")}
          </span>
        ) : null}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{a.description}</p>
      <ActivityMeta a={a} />
      {a.place && <p className="text-sm text-slate-500 inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[var(--pink)]" />{a.place}</p>}
      {a.weather_note && <p className="text-xs text-slate-500 italic">{a.weather_note}</p>}
      <div className="flex flex-wrap gap-2 pt-2 mt-auto">
        <button onClick={() => onFav(a)} data-testid={`activity-fav-btn-${index}`}
          className={`chip inline-flex items-center gap-1.5 ${isFav ? "chip-on" : ""}`}>
          <Heart className={`h-4 w-4 ${isFav ? "fill-white" : ""}`} />{t("favorite")}
        </button>
        <button onClick={() => onDone(a)} data-testid={`activity-done-btn-${index}`} className="chip inline-flex items-center gap-1.5">
          <Check className="h-4 w-4" />{t("mark_done")}
        </button>
        {onPropose && (
          <button onClick={() => onPropose(a)} data-testid={`activity-propose-btn-${index}`} className="chip inline-flex items-center gap-1.5">
            <Send className="h-4 w-4" />{t("propose_to_group")}
          </button>
        )}
      </div>
    </article>
  );
};
