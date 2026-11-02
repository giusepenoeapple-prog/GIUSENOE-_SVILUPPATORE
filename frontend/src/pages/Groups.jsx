import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Users, Plus, LogIn, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { api, errMsg } from "@/lib/api";

export default function Groups() {
  const { t } = useI18n();
  const [groups, setGroups] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const load = () => api.get("/groups").then((r) => setGroups(r.data)).catch(() => setGroups([]));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try { await api.post("/groups", { name }); setName(""); load(); } catch (er) { toast.error(errMsg(er, t)); }
  };
  const join = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    try { await api.post("/groups/join", { invite_code: code }); setCode(""); load(); } catch (er) { toast.error(errMsg(er, t)); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">{t("groups")}</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        <form onSubmit={create} className="card-soft p-5 space-y-3">
          <p className="font-display font-bold inline-flex items-center gap-2"><Plus className="h-4 w-4 text-[var(--pink)]" />{t("create_group")}</p>
          <div className="flex gap-2">
            <input className="field" placeholder={t("group_name")} value={name} onChange={(e) => setName(e.target.value)} data-testid="create-group-name-input" />
            <button className="btn-pink px-4" data-testid="create-group-btn"><Plus className="h-5 w-5" /></button>
          </div>
        </form>
        <form onSubmit={join} className="card-soft p-5 space-y-3">
          <p className="font-display font-bold inline-flex items-center gap-2"><LogIn className="h-4 w-4 text-[var(--pink)]" />{t("join_group")}</p>
          <div className="flex gap-2">
            <input className="field uppercase tracking-widest" placeholder={t("invite_code")} value={code} onChange={(e) => setCode(e.target.value)} data-testid="join-group-code-input" />
            <button className="btn-pink px-4" data-testid="join-group-btn"><LogIn className="h-5 w-5" /></button>
          </div>
        </form>
      </div>
      {groups?.length === 0 && <div className="card-soft p-10 text-center text-slate-500" data-testid="groups-empty">{t("empty_groups")}</div>}
      <div className="space-y-3" data-testid="groups-list">
        {groups?.map((g, i) => (
          <Link key={g.group_id} to={`/groups/${g.group_id}`} className="card-soft p-4 flex items-center gap-4 fade-up" data-testid={`group-card-${i}`}>
            <div className="h-12 w-12 rounded-2xl bg-[var(--pink-subtle)] grid place-items-center"><Users className="h-6 w-6 text-[var(--pink)]" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold truncate">{g.name}</p>
              <p className="text-xs text-slate-500">{g.members.length} {t("members")} · {t("invite_code")}: <b className="tracking-widest">{g.invite_code}</b></p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 rtl:rotate-180" />
          </Link>
        ))}
      </div>
    </div>
  );
}
