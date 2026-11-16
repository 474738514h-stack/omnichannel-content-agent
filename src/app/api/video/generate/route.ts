import { NextRequest, NextResponse } from "next/server";
import { generateVideo } from "@/lib/coze";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/video/generate —— 拍摄：镜头脚本 -> 视频 URL */
export async function POST(req: NextRequest) {
  let prompt = "";
  let ratio: "9:16" | "16:9" = "9:16";
  let duration = 5;
  try {
    const body = await req.json();
    prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (body?.ratio === "16:9" || body?.ratio === "9:16") ratio = body.ratio;
    if (typeof body?.duration === "number") duration = body.duration;
  } catch {
    prompt = "";
  }
  if (!prompt) {
    return NextResponse.json({ error: "缺少镜头脚本 prompt" }, { status: 400 });
  }

  const result = await generateVideo(prompt, { ratio, duration });
  return NextResponse.json(result);
}
