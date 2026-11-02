import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, TOKEN_KEY } from "@/lib/api";
import { useI18n } from "@/i18n/I18nContext";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setLang } = useI18n();

  const setUser = useCallback((u) => {
    setUserState(u);
    if (u?.language) setLang(u.language);
  }, [setLang]);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    // Skip /me while returning from Google OAuth; AuthCallback handles it
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const signIn = useCallback((token, u) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
  }, [setUser]);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, signIn, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
