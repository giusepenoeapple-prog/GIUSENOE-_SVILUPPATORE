import { NavLink, Outlet, Link } from "react-router-dom";
import { Home, Map, Users, Bot, Heart, User, HandHeart } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { avatarUrl } from "@/lib/api";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { InstallButton } from "./InstallButton";
import { NotificationWatcher } from "./NotificationWatcher";

const NAV = [
  { to: "/", key: "home", icon: Home, end: true },
  { to: "/map", key: "map", icon: Map },
  { to: "/groups", key: "groups", icon: Users },
  { to: "/assistant", key: "assistant", icon: Bot },
  { to: "/saved", key: "saved", icon: Heart },
];
const SIDE_EXTRA = [
  { to: "/profile", key: "profile", icon: User },
  { to: "/donate", key: "donate", icon: HandHeart },
];

const SideLink = ({ item, t }) => (
  <NavLink to={item.to} end={item.end} data-testid={`sidebar-nav-${item.key}`}
    className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium transition-colors ${isActive ? "bg-[var(--pink-subtle)] text-[var(--pink-hover)]" : "text-slate-600 hover:bg-white"}`}>
    <item.icon className="h-5 w-5" />{t(item.key)}
  </NavLink>
);

export default function AppLayout() {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <div className="min-h-screen grain">
      <NotificationWatcher />
      <aside className="hidden md:flex fixed inset-y-0 start-0 w-64 flex-col gap-1 border-e border-[var(--line)] bg-[var(--bg)] p-5 z-20">
        <div className="mb-8 px-2"><Logo /></div>
        {[...NAV, ...SIDE_EXTRA].map((i) => <SideLink key={i.to} item={i} t={t} />)}
      </aside>

      <div className="md:ps-64 relative z-10">
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-[var(--bg)]/75 border-b border-[var(--line)]/70">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-8 h-16">
            <div className="md:hidden"><Logo /></div>
            <div className="hidden md:block" />
            <div className="flex items-center gap-2">
              <InstallButton />
              <LanguageSwitcher />
              <Link to="/profile" data-testid="header-profile-link" className="shrink-0">
                <img src={avatarUrl(user)} alt="avatar" className="h-9 w-9 rounded-full border-2 border-[var(--pink-subtle)] bg-[var(--pink-light)] object-cover" />
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 pb-32 md:pb-16">
          <Outlet />
        </main>
      </div>

      <nav className="md:hidden fixed bottom-3 inset-x-3 z-40 rounded-[28px] bg-white/90 backdrop-blur-xl border border-[var(--line)] shadow-[0_18px_40px_-18px_rgba(15,23,42,.35)]" data-testid="bottom-nav">
        <div className="grid grid-cols-5">
          {NAV.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} data-testid={`bottom-nav-${i.key}`}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${isActive ? "text-[var(--pink)]" : "text-slate-500"}`}>
              <i.icon className="h-5 w-5" />
              <span className="truncate max-w-full px-1">{t(i.key)}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
