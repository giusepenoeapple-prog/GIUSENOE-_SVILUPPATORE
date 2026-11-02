import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, X, Plus, Facebook, Instagram, MapPin, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { HOBBY_IDS, hobbyLabel } from "@/i18n/translations";
import { api, errMsg, getPosition } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const StepPersonal = ({ data, set, t }) => (
  <div className="space-y-4">
    <input className="field" placeholder={t("name")} value={data.name} onChange={(e) => set({ name: e.target.value })} data-testid="onb-name-input" />
    <div className="grid grid-cols-2 gap-3">
      <input className="field" type="number" min={10} max={110} placeholder={t("age")} value={data.age ?? ""} onChange={(e) => set({ age: e.target.value })} data-testid="onb-age-input" />
      <select className="field" value={data.gender} onChange={(e) => set({ gender: e.target.value })} data-testid="onb-gender-select">
        <option value="">{t("gender")}</option>
        {["m", "f", "o", "n"].map((g) => <option key={g} value={g}>{t(`gender_${g}`)}</option>)}
      </select>
    </div>
    <input className="field" placeholder={t("city")} value={data.city} onChange={(e) => set({ city: e.target.value })} data-testid="onb-city-input" />
  </div>
);

const StepHobbies = ({ data, set, t, lang }) => {
  const [custom, setCustom] = useState("");
  const list = data.hobbies;
  const toggle = (h) => set({ hobbies: list.includes(h) ? list.filter((x) => x !== h) : list.length < 15 ? [...list, h] : list });
  const move = (i, d) => {
    const n = [...list];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    set({ hobbies: n });
  };
  const addCustom = () => {
    const v = custom.trim();
    if (v && !list.includes(v) && list.length < 15) set({ hobbies: [...list, v] });
    setCustom("");
  };
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">{t("hobbies_hint")} <b className="text-[var(--pink)]" data-testid="hobby-count">{list.length}/15</b> {t("selected")}</p>
      <div className="flex flex-wrap gap-2">
        {HOBBY_IDS.map((h) => (
          <button key={h} type="button" onClick={() => toggle(h)} data-testid={`hobby-chip-${h}`} className={`chip ${list.includes(h) ? "chip-on" : ""}`}>{hobbyLabel(h, lang)}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="field" placeholder={t("add_custom_hobby")} value={custom} onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())} data-testid="custom-hobby-input" />
        <button type="button" onClick={addCustom} className="btn-pink px-4" data-testid="custom-hobby-add-btn"><Plus className="h-5 w-5" /></button>
      </div>
      {list.length > 0 && (
        <div>
          <p className="font-display font-semibold mb-2">{t("priority_list")}</p>
          <ol className="space-y-1.5" data-testid="hobby-priority-list">
            {list.map((h, i) => (
              <li key={h} className="flex items-center gap-2 rounded-2xl bg-white border border-[var(--line)] px-3 py-2" data-testid={`hobby-priority-item-${i}`}>
                <span className="h-7 w-7 shrink-0 rounded-full bg-[var(--pink-subtle)] text-[var(--pink-hover)] text-sm font-bold grid place-items-center">{i + 1}</span>
                <span className="flex-1 text-sm truncate">{hobbyLabel(h, lang)}</span>
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-25" data-testid={`hobby-up-btn-${i}`}><ChevronUp className="h-4 w-4" /></button>
                <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-25" data-testid={`hobby-down-btn-${i}`}><ChevronDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => toggle(h)} className="p-1 text-slate-400 hover:text-rose-500" data-testid={`hobby-remove-btn-${i}`}><X className="h-4 w-4" /></button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

const StepGroups = ({ data, set, t }) => {
  const [g, setG] = useState({ platform: "facebook", name: "", url: "" });
  const add = () => {
    if (!g.name.trim()) return;
    set({ groups: [...data.groups, { ...g, name: g.name.trim() }] });
    setG({ ...g, name: "", url: "" });
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{t("groups_hint")}</p>
      <div className="flex gap-2">
        {["facebook", "instagram"].map((p) => (
          <button key={p} type="button" onClick={() => setG({ ...g, platform: p })} data-testid={`group-platform-${p}`}
            className={`chip inline-flex items-center gap-1.5 ${g.platform === p ? "chip-on" : ""}`}>
            {p === "facebook" ? <Facebook className="h-4 w-4" /> : <Instagram className="h-4 w-4" />}{p === "facebook" ? "Facebook" : "Instagram"}
          </button>
        ))}
      </div>
      <input className="field" placeholder={t("group_name")} value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} data-testid="group-name-input" />
      <input className="field" placeholder={t("group_url")} value={g.url} onChange={(e) => setG({ ...g, url: e.target.value })} data-testid="group-url-input" />
      <button type="button" onClick={add} className="chip inline-flex items-center gap-1.5" data-testid="group-add-btn"><Plus className="h-4 w-4" />{t("add")}</button>
      <ul className="space-y-1.5">
        {data.groups.length === 0 && <li className="text-sm text-slate-400">{t("no_groups_yet")}</li>}
        {data.groups.map((x, i) => (
          <li key={i} className="flex items-center gap-2 rounded-2xl bg-white border border-[var(--line)] px-3 py-2 text-sm" data-testid={`group-item-${i}`}>
            {x.platform === "facebook" ? <Facebook className="h-4 w-4 text-blue-600" /> : <Instagram className="h-4 w-4 text-pink-600" />}
            <span className="flex-1 truncate">{x.name}</span>
            <button type="button" onClick={() => set({ groups: data.groups.filter((_, j) => j !== i) })} className="text-slate-400 hover:text-rose-500"><X className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const StepLocation = ({ data, set, t }) => {
  const ask = async () => {
    const pos = await getPosition();
    if (pos) set({ location_consent: true, ...pos });
    else toast.error(t("location_denied"));
  };
  return (
    <div className="space-y-5 text-center py-4">
      <div className="mx-auto h-20 w-20 rounded-full bg-[var(--pink-subtle)] grid place-items-center"><MapPin className="h-10 w-10 text-[var(--pink)]" /></div>
      <p className="text-slate-600 max-w-sm mx-auto">{t("location_hint")}</p>
      {data.location_consent ? (
        <p className="inline-flex items-center gap-2 text-emerald-600 font-semibold" data-testid="location-granted"><CheckCircle2 className="h-5 w-5" />{t("location_granted")}</p>
      ) : (
        <button type="button" onClick={ask} className="btn-pink px-6 py-3" data-testid="allow-location-btn">{t("allow_location")}</button>
      )}
    </div>
  );
};

export default function Onboarding() {
  const { t, lang } = useI18n();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState({
    name: user.name || "", age: user.age ?? "", gender: user.gender || "", city: user.city || "",
    hobbies: user.hobbies || [], groups: user.groups || [], location_consent: !!user.location_consent, lat: user.lat, lon: user.lon,
  });
  const set = (p) => setData((d) => ({ ...d, ...p }));
  const titles = ["onb1_title", "onb2_title", "onb3_title", "onb4_title"];
  const canNext = step === 0 ? data.name.trim() && data.city.trim() : step === 1 ? data.hobbies.length >= 10 && data.hobbies.length <= 15 : true;

  const finish = async () => {
    setBusy(true);
    try {
      const body = { ...data, age: data.age ? Number(data.age) : null, onboarded: true, language: lang };
      const { data: u } = await api.put("/profile", body);
      setUser(u);
      navigate(user.onboarded ? "/profile" : "/", { replace: true });
    } catch (e) {
      toast.error(errMsg(e, t));
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (!canNext) return toast.error(step === 1 ? t("hobbies_count_error") : t("error_generic"));
    step === 3 ? finish() : setStep(step + 1);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] grain">
      <div className="max-w-xl mx-auto px-5 py-6 relative z-10">
        <div className="flex items-center justify-between mb-8"><Logo /><LanguageSwitcher testId="onb-language-select" /></div>
        <div className="flex gap-2 mb-6" data-testid="onboarding-progress">
          {titles.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-[var(--pink)]" : "bg-slate-200"}`} />)}
        </div>
        <p className="text-xs uppercase tracking-widest text-[var(--pink)] font-semibold">{t("step")} {step + 1} {t("of")} 4</p>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 mb-6" data-testid="onboarding-step-title">{t(titles[step])}</h1>
        <div key={step} className="fade-up">
          {step === 0 && <StepPersonal data={data} set={set} t={t} />}
          {step === 1 && <StepHobbies data={data} set={set} t={t} lang={lang} />}
          {step === 2 && <StepGroups data={data} set={set} t={t} />}
          {step === 3 && <StepLocation data={data} set={set} t={t} />}
        </div>
        <div className="flex items-center justify-between gap-3 mt-10 pb-8">
          <button type="button" onClick={() => setStep(step - 1)} disabled={step === 0} className="chip disabled:opacity-0" data-testid="onboarding-step-back-btn">{t("back")}</button>
          <div className="flex gap-2">
            {(step === 2 || step === 3) && <button type="button" onClick={() => (step === 3 ? finish() : setStep(3))} className="chip" data-testid="onboarding-skip-btn">{t("skip")}</button>}
            <button type="button" onClick={next} disabled={busy} className={`btn-pink px-7 py-3 ${canNext ? "" : "opacity-50"}`} data-testid="onboarding-step-next-btn">
              {step === 3 ? t("finish") : t("next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
