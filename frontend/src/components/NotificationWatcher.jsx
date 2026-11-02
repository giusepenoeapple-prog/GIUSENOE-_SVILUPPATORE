import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nContext";
import { api } from "@/lib/api";

const KEY = "sbft_notif_since";

export const NotificationWatcher = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, new Date().toISOString());
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
    const check = async () => {
      try {
        const { data } = await api.get("/notifications", { params: { since: localStorage.getItem(KEY) } });
        if (!data.length) return;
        localStorage.setItem(KEY, data[data.length - 1].created_at);
        data.forEach((n) => {
          const body = `${n.user_name} · ${n.group_name}: ${n.title}`;
          toast(t("new_proposal"), { description: body, action: { label: t("groups"), onClick: () => navigate(`/groups/${n.group_id}`) } });
          if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
            new Notification(t("new_proposal"), { body, icon: "/icons/icon-192.png" });
          }
        });
      } catch { /* ignore */ }
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [t, navigate]);

  return null;
};
