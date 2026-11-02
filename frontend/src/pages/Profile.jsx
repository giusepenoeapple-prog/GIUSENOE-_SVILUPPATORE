import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Camera, LogOut, Shield, HandHeart, SlidersHorizontal, MapPin } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { hobbyLabel } from "@/i18n/translations";
import { api, errMsg, avatarUrl, getPosition, BACKEND_URL } from "@/lib/api";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const STYLES = ["adventurer", "lorelei", "notionists", "fun-emoji", "big-smile", "micah"];
const SEEDS = ["Luna", "Sole", "Mare"];

const AvatarPicker = ({ user, save }) => {
  const { t } = useI18n();
  const { setUser } = useAuth();
  const upload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error(t("image_too_large"));
    const fd = new FormData();
    fd.append("file", f);
    try {
      const { data } = await api.post("/profile/photo", fd);
      setUser(data);
      toast.success(t("saved_ok"));
    } catch (er) { toast.error(errMsg(er, t)); }
  };
  const opts = STYLES.flatMap((s) => SEEDS.map((sd) => ({ s, sd }))).slice(0, 12);
  return (
    <div className="space-y-3">
      <p className="font-display font-semibold">{t("avatar")}</p>
      <div className="grid grid-cols-6 gap-2" data-testid="avatar-options">
        {opts.map(({ s, sd }, i) => {
          const on = !user.use_picture && user.avatar_style === s && user.avatar_seed === sd;
          return (
            <button key={i} onClick={() => save({ avatar_style: s, avatar_seed: sd, use_picture: false })} data-testid={`avatar-option-${i}`}
              className={`rounded-2xl p-0.5 border-2 transition-colors ${on ? "border-[var(--pink)]" : "border-transparent hover:border-[var(--pink-subtle)]"}`}>
              <img src={avatarUrl(user, s, sd)} alt="" className="w-full aspect-square rounded-xl bg-[var(--pink-light)]" />
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="chip text-sm inline-flex items-center gap-1.5 cursor-pointer" data-testid="upload-photo-btn">
          <Camera className="h-4 w-4" />{t("upload_photo")}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={upload} data-testid="upload-photo-input" />
        </label>
        {user.picture && !user.photo && <button onClick={() => save({ use_picture: true })} className="chip text-sm" data-testid="use-google-photo-btn">{t("use_google_photo")}</button>}
      </div>
    </div>
  );
};

export default function Profile() {
  const { t, lang } = useI18n();
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user.name, city: user.city || "", age: user.age ?? "" });

  const save = async (patch) => {
    try {
      const { data } = await api.put("/profile", patch);
      setUser(data);
      toast.success(t("saved_ok"));
    } catch (e) { toast.error(errMsg(e, t)); }
  };
  const toggleLocation = async (on) => {
    if (!on) return save({ location_consent: false });
    const pos = await getPosition();
    if (pos) save({ location_consent: true, ...pos });
    else toast.error(t("location_denied"));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 fade-up">
        <img src={avatarUrl(user)} alt="" className="h-20 w-20 rounded-3xl bg-[var(--pink-light)] border-4 border-white shadow-md object-cover" data-testid="profile-avatar" />
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-extrabold tracking-tight truncate" data-testid="profile-name">{user.name}</h1>
          <p className="text-sm text-slate-500 truncate">{user.email}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card-soft p-5 space-y-3">
          <input className="field" value={form.name} placeholder={t("name")} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="profile-name-input" />
          <div className="grid grid-cols-[2fr_1fr] gap-2">
            <input className="field" value={form.city} placeholder={t("city")} onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="profile-city-input" />
            <input className="field" type="number" value={form.age} placeholder={t("age")} onChange={(e) => setForm({ ...form, age: e.target.value })} data-testid="profile-age-input" />
          </div>
          <button onClick={() => save({ ...form, age: form.age ? Number(form.age) : null })} className="btn-pink px-6 py-2.5" data-testid="profile-save-btn">{t("save")}</button>
        </div>
        <div className="card-soft p-5"><AvatarPicker user={user} save={save} /></div>
      </div>

      <div className="card-soft p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold">{t("language")}</span><LanguageSwitcher testId="profile-language-select" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--pink)]" />{t("location")}</span>
          <Switch checked={!!user.location_consent} onCheckedChange={toggleLocation} data-testid="profile-location-switch" />
        </div>
        <div>
          <p className="font-semibold mb-2">{t("onb2_title")}</p>
          <div className="flex flex-wrap gap-1.5">
            {user.hobbies.map((h, i) => <span key={h} className="rounded-full bg-[var(--pink-subtle)] text-[var(--pink-hover)] text-xs px-2.5 py-1">{i + 1}. {hobbyLabel(h, lang)}</span>)}
          </div>
        </div>
        <button onClick={() => navigate("/onboarding")} className="chip inline-flex items-center gap-1.5" data-testid="edit-preferences-btn"><SlidersHorizontal className="h-4 w-4" />{t("edit_preferences")}</button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Link to="/donate" className="card-soft p-4 inline-flex items-center gap-2 font-semibold" data-testid="profile-donate-link"><HandHeart className="h-5 w-5 text-[var(--pink)]" />{t("donate")}</Link>
        <a href={`${BACKEND_URL}/api/privacy?lang=${lang}`} target="_blank" rel="noreferrer" className="card-soft p-4 inline-flex items-center gap-2 font-semibold" data-testid="profile-privacy-link"><Shield className="h-5 w-5 text-[var(--pink)]" />{t("privacy")}</a>
        <button onClick={logout} className="card-soft p-4 inline-flex items-center gap-2 font-semibold text-rose-600" data-testid="logout-btn"><LogOut className="h-5 w-5" />{t("logout")}</button>
      </div>
    </div>
  );
}
