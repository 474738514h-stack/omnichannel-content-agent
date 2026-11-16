"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Masthead } from "./masthead";
import { ChannelCard } from "./channel-card";
import { WorkflowLog } from "./workflow-log";
import { CHANNEL_KEYS, type ChannelKey, type ChannelState, type NodeProgress, type StreamEvent, type Variant } from "@/lib/types";
import { cloneVariants } from "@/lib/parser";
import { SAMPLE_NEWS } from "@/lib/mock";

type MediaItem = { url: string; source: string };

export function Desk() {
  const [news, setNews] = useState("");
  const [running, setRunning] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [nodes, setNodes] = useState<NodeProgress[]>([]);
  const [statusLine, setStatusLine] = useState("待签稿 · 此刊尚在排版中");
  const [ready, setReady] = useState(false);

  /**
   * 关键：翻页索引按渠道独立存放，不用全局数组下标。
   * 每渠道每变体的媒体状态直接写进 variants 里的 ChannelState，天然互不干扰。
   */
  const [activeIdxByKey, setActiveIdxByKey] = useState<Record<ChannelKey, number>>({
    weibo: 0,
    xiaohongshu: 0,
    video: 0,
  });
  const [mediaBusyByKey, setMediaBusyByKey] = useState<Record<ChannelKey, boolean>>({
    weibo: false,
    xiaohongshu: false,
    video: false,
  });
  const abortRef = useRef<AbortController | null>(null);

  /** 不可变地更新某个渠道当前变体的 ChannelState */
  const patchChannel = useCallback(
    (key: ChannelKey, idx: number, patch: (c: ChannelState) => ChannelState) => {
      setVariants((prev) =>
        prev.map((v, vi) =>
          vi === idx
            ? {
                ...v,
                channels: {
                  ...v.channels,
                  [key]: patch(v.channels[key]),
                },
              }
            : v
        )
      );
    },
    []
  );

  /** 排版分发：fetch + getReader 打字机式消费 SSE */
  const run = useCallback(async (overrideNews?: string) => {
    if (running) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setRunning(true);
    setReady(false);
    setNodes([]);
    setVariants([]);
    setActiveIdxByKey({ weibo: 0, xiaohongshu: 0, video: 0 });
    setStatusLine("正在排版分发 · 接稿中");

    try {
      const resp = await fetch("/api/workflow/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ news: overrideNews || news || SAMPLE_NEWS }),
        signal: ctrl.signal,
      });
      if (!resp.ok || !resp.body) throw new Error(`分发通道异常 ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let degraded = false;

      const handleEvent = (event: string, dataStr: string) => {
        let payload: StreamEvent;
        try {
          payload = JSON.parse(dataStr) as StreamEvent;
        } catch {
          return;
        }
        if (event === "ready") {
          const p = payload as Extract<StreamEvent, { type: "ready" }>;
          setStatusLine(p.message);
          if (p.degraded) degraded = true;
        } else if (event === "node") {
          const p = payload as Extract<StreamEvent, { type: "node" }>;
          setNodes((prev) => {
            const exists = prev.findIndex((n) => n.id === p.node.id);
            if (exists >= 0) {
              const next = [...prev];
              next[exists] = p.node;
              return next;
            }
            return [...prev, p.node];
          });
          setStatusLine(`正在排版分发 · ${p.node.title}`);
        } else if (event === "done") {
          const p = payload as Extract<StreamEvent, { type: "done" }>;
          setVariants(cloneVariants(p.variants));
          setReady(true);
          setStatusLine(
            degraded
              ? `待签稿样本已排版 · ${p.validCount} 版有效 / ${p.skippedCount} 版跳过`
              : `本版已就绪 · ${p.validCount} 版有效 / ${p.skippedCount} 版跳过`
          );
        } else if (event === "error") {
          const p = payload as Extract<StreamEvent, { type: "error" }>;
          setStatusLine(p.message);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const frames = buf.split("\n\n");
        buf = frames.pop() ?? "";
        for (const frame of frames) {
          const ev = frame.split("\n").find((l) => l.startsWith("event:"))?.slice(6).trim();
          const data = frame.split("\n").find((l) => l.startsWith("data:"))?.slice(5).trim();
          if (ev && data) handleEvent(ev, data);
        }
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setStatusLine(`排版中断：${(err as Error).message}`);
      }
    } finally {
      setRunning(false);
    }
  }, [news, running]);

  /** 单个媒体请求 */
  const requestMedia = useCallback(
    async (
      kind: "image" | "video",
      key: ChannelKey,
      idx: number,
      prompt: string,
      onResult: (m: MediaItem) => void,
      shotId?: number
    ) => {
      try {
        const resp = await fetch(`/api/${kind}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            kind === "video"
              ? { prompt, ratio: "9:16", duration: 5 }
              : { prompt }
          ),
        });
        if (!resp.ok) return;
        const m = (await resp.json()) as MediaItem;
        onResult(m);
      } finally {
        if (shotId !== undefined) {
          patchChannel(key, idx, (c) => ({
            ...c,
            shots: c.shots.map((s) =>
              s.id === shotId ? { ...s, status: "ready" as const } : s
            ),
          }));
        }
      }
    },
    [patchChannel]
  );

  /** 制版：单张图 */
  const generateImage = useCallback(
    (key: ChannelKey, idx: number, imgIdx: number) => {
      const prompt = variants[idx]?.channels[key].imagePrompts[imgIdx];
      if (!prompt) return;
      setMediaBusyByKey((s) => ({ ...s, [key]: true }));
      patchChannel(key, idx, (c) => ({ ...c, printing: Math.max(c.printing, imgIdx + 1) }));
      void requestMedia("image", key, idx, prompt, (m) => {
        patchChannel(key, idx, (c) => {
          const urls = [...c.imageUrls];
          urls[imgIdx] = m.url;
          return { ...c, imageUrls: urls };
        });
      }).finally(() => setMediaBusyByKey((s) => ({ ...s, [key]: false })));
    },
    [variants, requestMedia, patchChannel]
  );

  /** 一键制版：N 张并行 */
  const generateAllImages = useCallback(
    (key: ChannelKey, idx: number) => {
      const state = variants[idx]?.channels[key];
      if (!state) return;
      setMediaBusyByKey((s) => ({ ...s, [key]: true }));
      patchChannel(key, idx, (c) => ({ ...c, printing: c.imagePrompts.length }));
      Promise.all(
        state.imagePrompts.map((prompt, imgIdx) =>
          requestMedia("image", key, idx, prompt, (m) => {
            patchChannel(key, idx, (c) => {
              const urls = [...c.imageUrls];
              urls[imgIdx] = m.url;
              return { ...c, imageUrls: urls };
            });
          })
        )
      ).finally(() => setMediaBusyByKey((s) => ({ ...s, [key]: false })));
    },
    [variants, requestMedia, patchChannel]
  );

  /** 拍摄：单镜头 */
  const shoot = useCallback(
    (key: ChannelKey, idx: number, shotId: number) => {
      const shot = variants[idx]?.channels[key].shots.find((s) => s.id === shotId);
      if (!shot) return;
      patchChannel(key, idx, (c) => ({
        ...c,
        shots: c.shots.map((s) => (s.id === shotId ? { ...s, status: "shooting" as const } : s)),
      }));
      void requestMedia("video", key, idx, shot.script, (m) => {
        patchChannel(key, idx, (c) => ({
          ...c,
          shots: c.shots.map((s) =>
            s.id === shotId ? { ...s, videoUrl: m.url } : s
          ),
        }));
      }, shotId);
    },
    [variants, requestMedia, patchChannel]
  );

  /** 一键拍摄全镜：并行 */
  const shootAll = useCallback(
    (key: ChannelKey, idx: number) => {
      const shots = variants[idx]?.channels[key].shots ?? [];
      setMediaBusyByKey((s) => ({ ...s, [key]: true }));
      patchChannel(key, idx, (c) => ({
        ...c,
        shots: c.shots.map((s) => ({ ...s, status: "shooting" as const })),
      }));
      Promise.all(
        shots.map((shot) =>
          requestMedia("video", key, idx, shot.script, (m) => {
            patchChannel(key, idx, (c) => ({
              ...c,
              shots: c.shots.map((s) =>
                s.id === shot.id ? { ...s, videoUrl: m.url } : s
              ),
            }));
          }, shot.id)
        )
      ).finally(() => setMediaBusyByKey((s) => ({ ...s, [key]: false })));
    },
    [variants, requestMedia, patchChannel]
  );

  /** 演示模式：?demo=1 自动填入示例稿并排版分发一次 */
  const autoRanRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1" && !autoRanRef.current) {
      autoRanRef.current = true;
      setNews(SAMPLE_NEWS);
      void run(SAMPLE_NEWS);
    }
  }, [run]);

  return (
    <main className="min-h-screen">
      <Masthead news={news} onNewsChange={setNews} onRun={() => void run()} running={running} />

      <div className="mx-auto max-w-7xl px-6 py-9 md:px-10">
        {/* 状态条 */}
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-rule pb-3">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${running || ready ? "bg-press" : "bg-rule"}`} />
            <p className="font-mono text-xs tracking-wide text-ink-soft">{statusLine}</p>
          </div>
          {ready && (
            <span className="hidden font-mono text-[11px] text-ink-faint sm:inline">
              三刊已装配 · 可逐版签发
            </span>
          )}
        </div>

        <WorkflowLog nodes={nodes} active={running} />

        {/* 三刊并排 */}
        {variants.length > 0 ? (
          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {CHANNEL_KEYS.map((key) => {
              const idx = Math.min(activeIdxByKey[key], variants.length - 1);
              return (
                <ChannelCard
                  key={key}
                  channelKey={key}
                  state={variants[idx].channels[key]}
                  variantTotal={variants.length}
                  activeIdx={idx}
                  onPage={(i) => setActiveIdxByKey((s) => ({ ...s, [key]: i }))}
                  onGenerateImage={(imgIdx) => generateImage(key, idx, imgIdx)}
                  onGenerateAllImages={() => generateAllImages(key, idx)}
                  onShoot={(shotId) => shoot(key, idx, shotId)}
                  onShootAll={() => shootAll(key, idx)}
                  mediaBusy={mediaBusyByKey[key]}
                />
              );
            })}
          </div>
        ) : (
          <div className="paper-grain mt-7 grid min-h-64 place-items-center rounded-md border border-dashed border-rule">
            <div className="text-center">
              <p className="font-display text-2xl text-ink-faint">排版台已就绪</p>
              <p className="mt-2 font-hand text-sm italic text-ink-faint">
                粘一条新闻上去，三块屏幕就会亮起来。
              </p>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-rule py-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">
        Midnight Newsroom · 本版付印前请复核
      </footer>
    </main>
  );
}
