import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/i18n/I18nContext";
import { api, errMsg } from "@/lib/api";

export const ProposeDialog = ({ activity, date, time, onClose }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [groups, setGroups] = useState(null);

  useEffect(() => {
    if (activity) api.get("/groups").then((r) => setGroups(r.data)).catch(() => setGroups([]));
  }, [activity]);

  const send = async (g) => {
    try {
      await api.post(`/groups/${g.group_id}/messages`, {
        text: activity.description || "",
        proposal: { title: activity.title, date: date || "", time: time || "", place: activity.place || "" },
      });
      onClose();
      navigate(`/groups/${g.group_id}`);
    } catch (e) {
      toast.error(errMsg(e, t));
    }
  };

  return (
    <Dialog open={!!activity} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl" data-testid="propose-dialog">
        <DialogHeader><DialogTitle className="font-display">{t("choose_group")}</DialogTitle></DialogHeader>
        {groups === null && <p className="text-sm text-slate-500">{t("loading")}</p>}
        {groups?.length === 0 && (
          <div className="text-sm text-slate-500 space-y-3">
            <p>{t("empty_groups")}</p>
            <button className="btn-pink px-4 py-2" onClick={() => { onClose(); navigate("/groups"); }} data-testid="propose-go-groups-btn">{t("create_group")}</button>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {groups?.map((g) => (
            <button key={g.group_id} onClick={() => send(g)} data-testid={`propose-group-${g.group_id}`}
              className="text-start rounded-2xl border border-[var(--line)] px-4 py-3 hover:border-[var(--pink)] transition-colors">
              <p className="font-semibold">{g.name}</p>
              <p className="text-xs text-slate-500">{g.members.length} {t("members")}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
