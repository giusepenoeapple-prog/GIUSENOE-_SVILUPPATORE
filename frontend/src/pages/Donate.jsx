import { toast } from "sonner";
import { Heart, Copy, Landmark } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

const PAYPAL_EMAIL = "giuseppenoe@libero.it";
const IBAN = "IT91B0306946250100000001330";
const HOLDER = "Giuseppe Noè";
const PAYPAL_URL = `https://www.paypal.com/donate/?business=${encodeURIComponent(PAYPAL_EMAIL)}&currency_code=EUR&item_name=${encodeURIComponent("Spend better free time")}`;

export default function Donate() {
  const { t } = useI18n();
  const copy = (v) => { navigator.clipboard?.writeText(v); toast.success(t("copied")); };
  const ibanPretty = IBAN.replace(/(.{4})/g, "$1 ").trim();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="fade-up">
        <div className="h-14 w-14 rounded-2xl bg-[var(--pink)] grid place-items-center mb-4"><Heart className="h-7 w-7 text-white fill-white" /></div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">{t("donate_title")}</h1>
        <p className="text-slate-600 mt-3 leading-relaxed">{t("donate_text")}</p>
      </div>

      <div className="card-soft p-6 space-y-3">
        <p className="font-display font-bold">PayPal</p>
        <p className="text-sm text-slate-500" data-testid="paypal-email">{PAYPAL_EMAIL}</p>
        <a href={PAYPAL_URL} target="_blank" rel="noreferrer" className="btn-pink inline-flex items-center gap-2 px-6 py-3" data-testid="paypal-donate-btn">
          <Heart className="h-4 w-4" />{t("paypal_btn")}
        </a>
      </div>

      <div className="card-soft p-6 space-y-4">
        <p className="font-display font-bold inline-flex items-center gap-2"><Landmark className="h-5 w-5 text-[var(--pink)]" />{t("bank_transfer")}</p>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">IBAN</p>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 rounded-2xl bg-[var(--pink-light)] px-4 py-3 font-mono text-sm sm:text-base tracking-wide break-all" data-testid="iban-value" dir="ltr">{ibanPretty}</code>
            <button onClick={() => copy(IBAN)} className="chip inline-flex items-center gap-1.5 shrink-0" data-testid="iban-copy-btn"><Copy className="h-4 w-4" />{t("copy")}</button>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">{t("holder")}</p>
          <p className="font-semibold mt-1" data-testid="iban-holder">{HOLDER}</p>
        </div>
      </div>
      <p className="text-center text-[var(--pink)] font-display font-bold">{t("thanks")}</p>
    </div>
  );
}
