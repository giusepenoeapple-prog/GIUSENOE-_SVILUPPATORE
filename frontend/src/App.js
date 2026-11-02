import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/i18n/I18nContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import AuthCallback from "@/pages/AuthCallback";
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import Saved from "@/pages/Saved";
import MapPage from "@/pages/MapPage";
import Groups from "@/pages/Groups";
import GroupChat from "@/pages/GroupChat";
import Assistant from "@/pages/Assistant";
import Profile from "@/pages/Profile";
import Donate from "@/pages/Donate";

const Splash = () => (
  <div className="min-h-screen grid place-items-center bg-[var(--bg)]" data-testid="app-loading">
    <div className="h-10 w-10 rounded-full border-4 border-pink-200 border-t-[var(--pink)] animate-spin" />
  </div>
);

const Protected = ({ children, needOnboarding = true }) => {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (needOnboarding && !user.onboarded) return <Navigate to="/onboarding" replace />;
  return children;
};

const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (user) return <Navigate to="/" replace />;
  return children;
};

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<Protected needOnboarding={false}><Onboarding /></Protected>} />
      <Route element={<Protected><AppLayout /></Protected>}>
        <Route path="/" element={<Home />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:groupId" element={<GroupChat />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/donate" element={<Donate />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </I18nProvider>
  );
}
