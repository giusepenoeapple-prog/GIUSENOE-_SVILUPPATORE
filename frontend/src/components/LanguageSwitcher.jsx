import { Globe } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { LANGUAGES } from "@/i18n/translations";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export const LanguageSwitcher = ({ testId = "language-switcher-select" }) => {
  const { lang, setLang } = useI18n();
  const { user, setUser } = useAuth();

  const change = async (e) => {
    const l = e.target.value;
    setLang(l);
    if (user) {
      try {
        const { data } = await api.put("/profile", { language: l });
        setUser(data);
      } catch { /* keep local */ }
    }
  };

  return (
    <label className="relative inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white/80 ps-3 pe-2 py-1.5 text-sm hover:border-[var(--pink)] transition-colors">
      <Globe className="h-4 w-4 text-[var(--pink)]" />
      <select value={lang} onChange={change} data-testid={testId} className="bg-transparent outline-none cursor-pointer pe-1">
        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </label>
  );
};
