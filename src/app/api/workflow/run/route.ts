import { NextRequest } from "next/server";
import { COZE_PAT, WORKFLOW_ID } from "@/lib/coze";
import { buildDemoRaw, buildMockRaw } from "@/lib/mock";
import { parseWorkflowOutput } from "@/lib/parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/workflow/run
 * SSE 流式分发：ready -> node* -> done
 * · 立刻下发 event:ready，绕开网关 504
 * · setInterval 发 : ping 心跳；cancel 时 clearInterval
 * · 真实调用扣子 stream_run；额度不足/异常时降级到离线样本跑通全流程
 */

const NODE_SCRIPT: { title: string; detail: string }[] = [
  { title: "接稿 · 解析新闻要素", detail: "抽取时间、主体、数字、冲突点" },
  { title: "排版 · 微博即时电讯", detail: "压缩为 140 字话题电讯" },
  { title: "排版 · 小红书种草刊", detail: "拟标题、正文与 4 组配图提示" },
  { title: "排版 · 短视频分镜版", detail: "切分 4 镜头，标注时长与运镜" },
  { title: "签发 · 三刊付印", detail: "装配出版包" },
];

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  let news = "";
  let fixture = "";
  try {
    const body = await req.json();
    news = typeof body?.news === "string" ? body.news.trim() : "";
    fixture = typeof body?.fixture === "string" ? body.fixture : "";
  } catch {
    news = "";
  }
  if (!news) news = buildDemoRaw().input;

  const encoder = new TextEncoder();
  // heartbeat 提升到流外部，start 与 cancel 都能访问
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const push = (chunk: string) => {
        if (!closed) controller.enqueue(encoder.encode(chunk));
      };
      const close = () => {
        if (!closed) {
          closed = true;
          controller.close();
        }
      };

      // 1) 立即 ready —— 绕开网关空闲超时
      push(sse("ready", { message: "编辑部已接稿，正在排版分发" }));

      // 2) 心跳保活
      heartbeat = setInterval(() => push(": ping\n\n"), 12000);

      // 3) 尝试真实工作流，收集节点进度
      let rawOutput: unknown = null;
      let realFailure = "";
      let nodeSeq = 0;

      const emitNode = (title: string, status: "running" | "done", detail?: string) => {
        push(
          sse("node", {
            node: { id: ++nodeSeq, title, status, detail },
          })
        );
      };

      try {
        if (!COZE_PAT) throw new Error("未配置 COZE_API_TOKEN，跳过实时通道");
        const upstream = await fetch(
          `https://api.coze.cn/v1/workflow/stream_run`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${COZE_PAT}`,
              "Content-Type": "application/json",
              Accept: "text/event-stream",
            },
            body: JSON.stringify({
              workflow_id: WORKFLOW_ID,
              parameters: { input: news },
            }),
            // 实时通道超过 4s 未就绪即降级，避免编辑台干等
            signal: AbortSignal.timeout(4000),
          }
        );

        if (!upstream.ok || !upstream.body) {
          throw new Error(`工作流 HTTP ${upstream.status}`);
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let sawError = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const frames = buf.split("\n\n");
          buf = frames.pop() ?? "";

          for (const frame of frames) {
            const evLine = frame.split("\n").find((l) => l.startsWith("event:"));
            const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
            const ev = evLine?.slice(6).trim();
            const dataStr = dataLine?.slice(5).trim();
            if (!dataStr) continue;

            let payload: Record<string, unknown> = {};
            try {
              payload = JSON.parse(dataStr);
            } catch {
              continue;
            }

            if (ev === "Error") {
              sawError = true;
              realFailure = String(payload.error_message ?? "工作流错误");
              continue;
            }

            // 兼容扣子节点事件：node_title / title / event 内嵌
            const title =
              (payload.node_title as string) ??
              (payload.title as string) ??
              (payload.node_name as string) ??
              "排版节点";
            const content =
              (payload.content as string) ??
              (payload.output as string) ??
              (payload.detail as string) ??
              "";
            if (title) {
              emitNode(
                title,
                payload.node_is_finish ? "done" : "running",
                content.slice(0, 120)
              );
            }

            // 末尾汇总事件里带 output 数组
            if (payload.output !== undefined) rawOutput = payload.output;
          }
        }

        if (sawError) throw new Error(realFailure || "工作流返回错误");
      } catch (err) {
        realFailure = err instanceof Error ? err.message : String(err);
      }

      // 4) 真实失败 -> 离线样本降级，跑通同样的事件序列
      //    fixture=selfcheck 时改用 10 卡片自检集（9 有效 + 21 跳过）
      if (rawOutput === null) {
        const mock = fixture === "selfcheck" ? buildMockRaw() : buildDemoRaw();
        rawOutput = mock.output;
        for (const step of NODE_SCRIPT) {
          emitNode(step.title, "running", step.detail);
          await new Promise((r) => setTimeout(r, 180));
          emitNode(step.title, "done");
        }
        push(
          sse("ready", {
            message: "实时排版通道暂不可用，已启用待签稿样本",
            degraded: true,
            reason: realFailure,
          })
        );
      }

      // 5) 解析并下发 done
      const parsed = parseWorkflowOutput(rawOutput);
      push(
        sse("done", {
          variants: parsed.variants,
          validCount: parsed.validCount,
          skippedCount: parsed.skippedCount,
        })
      );

      if (heartbeat) clearInterval(heartbeat);
      heartbeat = null;
      close();
    },
    cancel() {
      // cancel 必须清理，避免定时器泄漏
      if (heartbeat) clearInterval(heartbeat);
      heartbeat = null;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
