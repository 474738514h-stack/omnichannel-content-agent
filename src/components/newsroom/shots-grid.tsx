"use client";

import { Button } from "@/components/ui/button";
import type { ShotState } from "@/lib/types";
import { cn } from "@/lib/utils";

type ShotsGridProps = {
  shots: ShotState[];
  onShootOne: (id: number) => void;
  onShootAll: () => void;
  busyAll: boolean;
};

/** 短视频分镜：每镜独立 9:16 视频位 + 时长标签 + 生成按钮 */
export function ShotsGrid({ shots, onShootOne, onShootAll, busyAll }: ShotsGridProps) {
  if (shots.length === 0) {
    return (
      <p className="mt-5 rounded-md border border-dashed border-rule p-4 text-center font-hand text-sm italic text-ink-faint">
        本版未附分镜脚本
      </p>
    );
  }

  const ready = shots.filter((s) => s.status === "ready").length;

  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            分镜脚本
          </h4>
          <span className="font-mono text-[11px] tabular-nums text-press">
            已拍 {ready}/{shots.length}
          </span>
        </div>
        <Button size="sm" onClick={onShootAll} disabled={busyAll || ready === shots.length}>
          {busyAll ? "拍摄中…" : "一键拍摄全镜"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {shots.map((shot) => (
          <div
            key={shot.id}
            className="overflow-hidden rounded-md border border-rule bg-paper"
          >
            {/* 9:16 视频位 */}
            <div className="relative aspect-[9/16] w-full overflow-hidden bg-rule-strong">
              {shot.videoUrl ? (
                <video
                  src={shot.videoUrl}
                  poster={undefined}
                  controls
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className={cn(
                    "flex h-full w-full flex-col items-center justify-center gap-2 p-2 text-center",
                    shot.status === "shooting" && "bg-press/10"
                  )}
                >
                  <span className="font-display text-3xl text-paper-raised/80">
                    {String(shot.id).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[10px] tracking-widest text-paper-raised/70">
                    {shot.status === "shooting" ? "SHOOTING" : "SLATE"}
                  </span>
                </div>
              )}
              {/* 时长标签 */}
              <span className="absolute right-1.5 top-1.5 rounded-md border border-rule bg-paper-raised px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-ink">
                {shot.duration}
              </span>
            </div>
            <div className="p-2">
              <p className="line-clamp-3 min-h-[3.5rem] font-hand text-[11px] leading-snug text-ink-soft">
                {shot.script}
              </p>
              <button
                onClick={() => onShootOne(shot.id)}
                disabled={shot.status !== "idle"}
                className="mt-2 w-full rounded-md border border-rule bg-paper py-1 font-mono text-[10px] text-press hover:border-press disabled:opacity-40"
              >
                {shot.status === "ready"
                  ? "已杀青"
                  : shot.status === "shooting"
                    ? "拍摄中…"
                    : "拍摄此镜"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
