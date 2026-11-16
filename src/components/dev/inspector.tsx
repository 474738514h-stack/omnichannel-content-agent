"use client";

/**
 * Dev Inspector —— 用 next/dynamic ssr:false 包装，避免 hydration 不一致。
 * 展示当前版面的运行状态（仅开发环境可见）。
 */
import { useEffect, useState } from "react";

export default function Inspector() {
  const [info, setInfo] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const update = () => setInfo({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-50 rounded-md border border-rule bg-paper-raised/95 px-3 py-2 font-mono text-[10px] text-ink-faint shadow-cool">
      PRESS · {info.w}×{info.h} · dev
    </div>
  );
}
