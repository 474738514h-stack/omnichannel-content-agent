"use client";

import { Button } from "@/components/ui/button";

type ImageGridProps = {
  prompts: string[];
  urls: (string | null)[];
  printing: number;
  onGenerateOne: (idx: number) => void;
  onGenerateAll: () => void;
  busy: boolean;
};

/** 小红书配图建议：按 N 个 prompt 拆成独立图位，2 列网格 */
export function ImagesGrid({
  prompts,
  urls,
  printing,
  onGenerateOne,
  onGenerateAll,
  busy,
}: ImageGridProps) {
  const done = urls.filter(Boolean).length;
  const total = prompts.length;
  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            配图建议
          </h4>
          <span className="font-mono text-[11px] tabular-nums text-press">
            印制 {done}/{total}
          </span>
        </div>
        {total > 1 && (
          <Button
            size="sm"
            variant="outline"
            onClick={onGenerateAll}
            disabled={busy || done === total}
          >
            {busy ? "制版中…" : "一键制版"}
          </Button>
        )}
      </div>

      {total > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {prompts.map((prompt, i) => (
            <figure
              key={i}
              className="overflow-hidden rounded-md border border-rule bg-paper"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-paper-sunk">
                {urls[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={urls[i] as string}
                    alt={prompt}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
                    <span className="font-mono text-xs text-ink-faint">
                      PLATE {i + 1}
                    </span>
                    <p className="line-clamp-3 font-hand text-[11px] italic leading-snug text-ink-soft">
                      {prompt}
                    </p>
                  </div>
                )}
                {printing > i && !urls[i] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-paper-raised/70">
                    <span className="font-mono text-[11px] text-press">制版中…</span>
                  </div>
                )}
              </div>
              <figcaption className="flex items-center justify-between gap-2 border-t border-rule px-2 py-1.5">
                <span className="font-mono text-[10px] text-ink-faint">
                  图 {i + 1}/{total}
                </span>
                <button
                  onClick={() => onGenerateOne(i)}
                  disabled={busy || !!urls[i]}
                  className="font-mono text-[10px] text-press underline-offset-2 hover:underline disabled:opacity-40"
                >
                  {urls[i] ? "已印制" : "制版"}
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-rule p-4 text-center font-hand text-sm italic text-ink-faint">
          本版未附配图建议
        </p>
      )}
    </section>
  );
}
