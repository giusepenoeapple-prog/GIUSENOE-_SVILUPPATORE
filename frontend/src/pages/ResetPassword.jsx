import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nContext";
import { api, errMsg } from "@/lib/api";
import { Logo } from "@/components/Logo";

export default function ResetPassword() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/reset", { token: params.get("token") || "", password });
      toast.success(t("reset_done"));
      navigate("/login");
    } catch (err) {
      toast.error(errMsg(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] px-6 py-8 flex flex-col">
      <Logo />
      <form onSubmit={submit} className="m-auto w-full max-w-sm space-y-4 card-soft p-8" data-testid="reset-password-form">
        <h1 className="font-display text-2xl font-bold">{t("reset_password")}</h1>
        <input className="field" type="password" minLength={6} required placeholder={t("new_password")} value={password}
          onChange={(e) => setPassword(e.target.value)} data-testid="reset-password-input" />
        <button className="btn-pink w-full py-3" disabled={busy} data-testid="reset-password-submit-btn">{t("reset_password")}</button>
      </form>
    </div>
  );
}
