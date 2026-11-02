import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

export const InstallButton = () => {
  const { t } = useI18n();
  const [ready, setReady] = useState(!!window.__installPrompt);

  useEffect(() => {
    const on = () => setReady(true);
    window.addEventListener("pwa-installable", on);
    return () => window.removeEventListener("pwa-installable", on);
  }, []);

  if (!ready) return null;

  const install = async () => {
    const p = window.__installPrompt;
    if (!p) return;
    p.prompt();
    await p.userChoice;
    window.__installPrompt = null;
    setReady(false);
  };

  return (
    <button onClick={install} data-testid="pwa-install-btn" className="btn-pink inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm">
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">{t("install_app")}</span>
    </button>
  );
};
