"use client";

import { cn } from "@/lib/utils";

type PagerProps = {
  total: number;
  active: number;
  onChange: (idx: number) => void;
};

/** 变体翻页器：1/3、2/3、3/3 —— 每个渠道独立 */
export function VariantPager({ total, active, onChange }: PagerProps) {
  if (total <= 0) return null;
  return (
    <div className="flex items-center gap-1.5" aria-label="变体翻页">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          aria-label={`第 ${i + 1} 版，共 ${total} 版`}
          aria-current={i === active}
          className={cn(
            "h-6 min-w-6 rounded-md border px-1.5 font-mono text-[11px] tabular-nums transition-colors",
            i === active
              ? "border-press bg-press text-paper-raised"
              : "border-rule bg-paper text-ink-soft hover:border-ink-faint"
          )}
        >
          {i + 1}/{total}
        </button>
      ))}
    </div>
  );
}
