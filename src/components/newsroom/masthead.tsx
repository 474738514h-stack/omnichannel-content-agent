"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea, UnderlineInput } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_NEWS } from "@/lib/mock";
import { cn } from "@/lib/utils";

type MastheadProps = {
  news: string;
  onNewsChange: (v: string) => void;
  onRun: () => void;
  running: boolean;
};

export function Masthead({ news, onNewsChange, onRun, running }: MastheadProps) {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const clock = now.toLocaleTimeString("zh-CN", { hour12: false });

  return (
    <header className="paper-grain border-b border-rule">
      <div className="mx-auto max-w-7xl px-6 pt-8 pb-7 md:px-10">
        {/* 顶栏：刊头 + 截稿计时 */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge className="border-press text-press">NEWS / PRODUCT / MULTICHANNEL</Badge>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.25em] text-ink-faint sm:inline">
              Edition No. 001
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-ink-soft">
            <span className={cn("h-1.5 w-1.5 rounded-full bg-press", running && "screen-glow")} />
            截稿倒计时 <span className="tabular-nums text-press">{clock}</span>
          </div>
        </div>

        <div className="masthead-rule mb-7" />

        {/* 主标 + 手记副标 */}
        <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-ink md:text-6xl lg:text-7xl">
              一条新闻，
              <br />
              <span className="text-press">三刊分发。</span>
            </h1>
            <p className="mt-5 max-w-xl font-hand text-base italic leading-relaxed text-ink-soft md:text-lg">
              —— 把同一条稿子，讲给三群不同的听众。微博发快讯，小红书写种草，短视频切分镜；
              排版、制版、签发，一气呵成。
            </p>
          </div>

          {/* 编辑手记：截稿条 */}
          <div className="hidden border-l-2 border-rule-strong pl-5 lg:block">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
              Editor&apos;s note
            </p>
            <p className="mt-2 font-hand text-sm leading-relaxed text-ink-soft">
              今夜值班手记：交稿即付印。三块屏幕都已亮起，
              等你把原文放上排版台。
            </p>
          </div>
        </div>

        {/* 输入区：横线下划线输入框 */}
        <div className="mt-9 rounded-md border border-rule bg-paper-raised p-5 shadow-cool md:p-6">
          <div className="mb-1 flex items-center justify-between">
            <label className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
              待签稿 / Paste the raw news
            </label>
            <button
              onClick={() => onNewsChange(SAMPLE_NEWS)}
              className="font-mono text-[11px] text-press underline-offset-2 hover:underline disabled:opacity-40"
              disabled={running}
            >
              填入示例稿
            </button>
          </div>
          <UnderlineInput
            value={news}
            onChange={(e) => onNewsChange(e.target.value)}
            placeholder="把新闻原文粘在这里……"
            disabled={running}
          />
          <Textarea
            value={news}
            onChange={(e) => onNewsChange(e.target.value)}
            placeholder="（也可在上方横线处直接粘贴）"
            rows={news ? 3 : 1}
            className="mt-2 font-body text-sm leading-relaxed"
            disabled={running}
          />
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="hidden font-mono text-[11px] text-ink-faint sm:block">
              {news.length} 字 · 三刊独立排版 · 按平台风格定制
            </p>
            <Button size="lg" onClick={onRun} disabled={running || !news.trim()}>
              {running ? "正在排版分发…" : "排版分发"}
              <span aria-hidden="true">→</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
