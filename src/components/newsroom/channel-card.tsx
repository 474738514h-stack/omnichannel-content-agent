"use client";

import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformMark } from "./platform-marks";
import { VariantPager } from "./variant-pager";
import { SkipStamp } from "./skip-stamp";
import { ImagesGrid } from "./images-grid";
import { ShotsGrid } from "./shots-grid";
import { CHANNEL_META, type ChannelKey, type ChannelState } from "@/lib/types";

type ChannelCardProps = {
  channelKey: ChannelKey;
  state: ChannelState;
  variantTotal: number;
  activeIdx: number;
  onPage: (idx: number) => void;
  onGenerateImage: (idx: number) => void;
  onGenerateAllImages: () => void;
  onShoot: (shotId: number) => void;
  onShootAll: () => void;
  mediaBusy: boolean;
};

export function ChannelCard({
  channelKey,
  state,
  variantTotal,
  activeIdx,
  onPage,
  onGenerateImage,
  onGenerateAllImages,
  onShoot,
  onShootAll,
  mediaBusy,
}: ChannelCardProps) {
  const meta = CHANNEL_META[channelKey];

  const copyText = () => {
    const parts = [state.title, state.copy, ...state.tags.map((t) => `#${t}#`)].filter(Boolean);
    if (channelKey === "video") {
      parts.push(...state.shots.map((s, i) => `${i + 1}. ${s.script}`));
    }
    void navigator.clipboard?.writeText(parts.join("\n"));
  };

  return (
    <Card className="flex h-full flex-col">
      {/* 刊头 */}
      <CardHeader className="border-b border-rule">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-rule bg-paper text-press">
              <PlatformMark channel={channelKey} className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-display text-2xl leading-none text-ink">{meta.edition}</h3>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                {channelKey === "weibo"
                  ? "WEIBO · 即时电讯"
                  : channelKey === "xiaohongshu"
                    ? "XIAOHONGSHU · 生活方式"
                    : "SHORT VIDEO · 分镜版"}
              </p>
            </div>
          </div>
          <Badge className={state.skipped ? "border-stamp text-stamp" : "border-press text-press"}>
            {state.skipped ? "跳过" : `第 ${activeIdx + 1} 版`}
          </Badge>
        </div>
      </CardHeader>

      <CardBody className="flex-1">
        {state.skipped ? (
          <SkipStamp reason={state.skipReason} />
        ) : (
          <>
            {state.title && (
              <h4 className="font-display text-xl leading-snug text-ink">{state.title}</h4>
            )}
            {state.copy && (
              <p className="mt-3 whitespace-pre-line font-body text-sm leading-7 text-ink-soft">
                {state.copy}
              </p>
            )}
            {state.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {state.tags.map((t, i) => (
                  <span key={i} className="rounded-md bg-press-wash px-2 py-0.5 font-mono text-[11px] text-press-deep">
                    #{t}#
                  </span>
                ))}
              </div>
            )}

            {channelKey === "xiaohongshu" && (
              <ImagesGrid
                prompts={state.imagePrompts}
                urls={state.imageUrls}
                printing={state.printing}
                onGenerateOne={onGenerateImage}
                onGenerateAll={onGenerateAllImages}
                busy={mediaBusy}
              />
            )}

            {channelKey === "video" && (
              <ShotsGrid
                shots={state.shots}
                onShootOne={onShoot}
                onShootAll={onShootAll}
                busyAll={mediaBusy}
              />
            )}
          </>
        )}
      </CardBody>

      {/* 页脚：翻页器 + 签发按钮（跳过时置灰） */}
      <CardFooter className="justify-between">
        <VariantPager total={variantTotal} active={activeIdx} onChange={onPage} />
        <Button
          size="sm"
          variant="outline"
          disabled={state.skipped}
          onClick={copyText}
          title={state.skipped ? "本刊跳过，无可签发内容" : "复制本刊文案"}
        >
          {state.skipped ? "跳过 · 不签发" : "签发"}
        </Button>
      </CardFooter>
    </Card>
  );
}
