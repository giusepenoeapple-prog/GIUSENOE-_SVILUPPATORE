import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const sessionId = new URLSearchParams(location.hash.slice(1)).get("session_id");
    api.post("/auth/google/session", { session_id: sessionId })
      .then(({ data }) => {
        signIn(data.token, data.user);
        navigate(data.user.onboarded ? "/" : "/onboarding", { replace: true });
      })
      .catch(() => navigate("/login", { replace: true }));
  }, [location.hash, navigate, signIn]);

  return <div className="min-h-screen bg-[var(--bg)]" data-testid="auth-callback" />;
}
