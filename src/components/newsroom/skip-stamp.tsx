"use client";

/** 本刊跳过 —— 灰色橡胶印章：旋转 -4°、米色底、灰色描边 */
export function SkipStamp({ reason }: { reason?: string }) {
  return (
    <div className="relative flex min-h-64 flex-col items-center justify-center overflow-hidden p-6">
      <div
        className="stamp-in rotate-[-4deg] rounded-md border-2 border-stamp bg-stamp-wash px-7 py-4 text-center shadow-sm"
        style={{ transform: "rotate(-4deg)" }}
      >
        <div className="font-display text-2xl font-bold tracking-[0.35em] text-stamp">
          本刊跳过
        </div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-stamp">
          SKIPPED THIS EDITION
        </div>
      </div>
      {reason ? (
        <p className="mt-6 max-w-xs text-center font-hand text-sm italic leading-relaxed text-ink-faint">
          {reason}
        </p>
      ) : null}
    </div>
  );
}
