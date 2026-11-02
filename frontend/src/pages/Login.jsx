import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { api, errMsg } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const HERO = "https://images.unsplash.com/photo-1569617084133-26942bb441f2?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400";

const GoogleButton = ({ t }) => {
  const go = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  return (
    <button type="button" onClick={go} data-testid="google-login-btn"
      className="w-full rounded-full border border-[var(--line)] bg-white py-3 font-medium flex items-center justify-center gap-2 hover:border-[var(--pink)] transition-colors">
      <svg className="h-5 w-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
      {t("continue_google")}
    </button>
  );
};

export default function Login() {
  const { t, lang } = useI18n();
  const { signIn } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        await api.post("/auth/forgot", { email: form.email });
        toast.success(t("reset_sent"));
        setMode("login");
      } else {
        const path = mode === "login" ? "/auth/login" : "/auth/register";
        const body = mode === "login" ? { email: form.email, password: form.password } : { ...form, language: lang };
        const { data } = await api.post(path, body);
        signIn(data.token, data.user);
      }
    } catch (err) {
      toast.error(errMsg(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--bg)]">
      <div className="relative hidden lg:block">
        <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-[#0F172A]/20 to-transparent" />
        <div className="absolute bottom-12 start-12 end-12 text-white">
          <h1 className="font-display text-5xl font-extrabold tracking-tight leading-[1.05]">Spend better<br /><span className="text-pink-300">free time.</span></h1>
          <p className="mt-4 text-lg text-white/85 max-w-md">{t("tagline")}</p>
        </div>
      </div>

      <div className="flex flex-col px-6 sm:px-12 py-8">
        <div className="flex items-center justify-between"><Logo /><LanguageSwitcher testId="login-language-select" /></div>
        <div className="flex-1 flex items-center">
          <form onSubmit={submit} className="w-full max-w-sm mx-auto space-y-4 fade-up" data-testid="auth-form">
            <div className="lg:hidden mb-6">
              <h1 className="font-display text-4xl font-extrabold tracking-tight">Spend better <span className="text-[var(--pink)]">free time</span></h1>
              <p className="text-slate-500 mt-2">{t("tagline")}</p>
            </div>
            <h2 className="font-display text-2xl font-bold" data-testid="auth-title">
              {mode === "login" ? t("login") : mode === "register" ? t("register") : t("forgot_password")}
            </h2>
            {mode === "register" && <input className="field" placeholder={t("name")} value={form.name} onChange={set("name")} required data-testid="register-name-input" />}
            <input className="field" type="email" placeholder={t("email")} value={form.email} onChange={set("email")} required data-testid="login-email-input" />
            {mode !== "forgot" && <input className="field" type="password" placeholder={t("password")} value={form.password} onChange={set("password")} required minLength={6} data-testid="login-password-input" />}
            {mode === "login" && (
              <button type="button" onClick={() => setMode("forgot")} className="text-sm text-[var(--pink)] font-medium hover:underline" data-testid="forgot-password-link">{t("forgot_password")}</button>
            )}
            <button type="submit" disabled={busy} className="btn-pink w-full py-3" data-testid="login-submit-btn">
              {busy ? t("loading") : mode === "login" ? t("login") : mode === "register" ? t("register") : t("send_reset_link")}
            </button>
            {mode !== "forgot" && (
              <>
                <div className="flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-[var(--line)]" />{t("or")}<span className="h-px flex-1 bg-[var(--line)]" /></div>
                <GoogleButton t={t} />
              </>
            )}
            <p className="text-sm text-center text-slate-500 pt-2">
              {mode === "login" ? t("no_account") : t("have_account")}{" "}
              <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-[var(--pink)] font-semibold" data-testid="toggle-auth-mode-btn">
                {mode === "login" ? t("register") : t("login")}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
