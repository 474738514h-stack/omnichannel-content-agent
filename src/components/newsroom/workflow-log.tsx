"use client";

import type { NodeProgress } from "@/lib/types";
import { cn } from "@/lib/utils";

/** 工作日志：SSE node 事件打字机式逐条呈现 */
export function WorkflowLog({
  nodes,
  active,
}: {
  nodes: NodeProgress[];
  active: boolean;
}) {
  if (nodes.length === 0) return null;
  return (
    <section className="mt-7 rounded-md border border-rule bg-paper-raised p-4 shadow-cool md:p-5">
      <div className="mb-3 flex items-center justify-between border-b border-rule pb-2">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          工作日志 / Desk log
        </h3>
        <span className="font-mono text-[10px] text-ink-faint">
          {nodes.filter((n) => n.status === "done").length}/{nodes.length}
        </span>
      </div>
      <ol className="space-y-1.5 font-mono text-xs">
        {nodes.map((node) => (
          <li key={node.id} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                node.status === "done" ? "bg-press" : "bg-ink-faint"
              )}
            />
            <span
              className={cn(
                "shrink-0 tabular-nums",
                node.status === "done" ? "text-ink-soft" : "text-press"
              )}
            >
              {String(node.id).padStart(2, "0")}
            </span>
            <span className={node.status === "running" ? "type-caret text-ink" : "text-ink-soft"}>
              {node.title}
              {node.detail ? (
                <span className="ml-2 text-ink-faint">· {node.detail}</span>
              ) : null}
            </span>
            {node.status === "done" && (
              <span className="ml-auto shrink-0 text-[10px] text-ink-faint">已签</span>
            )}
          </li>
        ))}
        {active && (
          <li className="flex items-center gap-3 text-ink-faint">
            <span className="type-caret text-press">正在排版分发</span>
          </li>
        )}
      </ol>
    </section>
  );
}
