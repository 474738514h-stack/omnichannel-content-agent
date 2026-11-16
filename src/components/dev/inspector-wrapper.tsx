"use client";

import dynamic from "next/dynamic";

/** Hydration 防御：dev 工具必须 client wrapper + ssr:false */
const Inspector = dynamic(() => import("./inspector"), {
  ssr: false,
});

export function InspectorWrapper() {
  if (process.env.NODE_ENV !== "development") return null;
  return <Inspector />;
}
