import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { TRANSLATIONS } from "./translations";

const I18nContext = createContext(null);

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(localStorage.getItem("sbft_lang") || "it");

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("sbft_lang", lang);
  }, [lang]);

  const setLang = useCallback((l) => TRANSLATIONS[l] && setLangState(l), []);
  const t = useCallback((key) => TRANSLATIONS[lang][key] ?? TRANSLATIONS.it[key] ?? key, [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
