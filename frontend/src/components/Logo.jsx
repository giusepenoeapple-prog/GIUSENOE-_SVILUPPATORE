import { Sparkles } from "lucide-react";

export const Logo = ({ compact = false }) => (
  <div className="flex items-center gap-2.5" data-testid="app-logo">
    <div className="h-9 w-9 rounded-2xl bg-[var(--pink)] grid place-items-center shadow-[0_8px_20px_-8px_rgba(232,61,132,.8)]">
      <Sparkles className="h-5 w-5 text-white" />
    </div>
    {!compact && (
      <div className="leading-tight">
        <p className="font-display font-extrabold text-[15px] tracking-tight">Spend better</p>
        <p className="text-[12px] text-[var(--pink)] font-semibold -mt-0.5">free time</p>
      </div>
    )}
  </div>
);
