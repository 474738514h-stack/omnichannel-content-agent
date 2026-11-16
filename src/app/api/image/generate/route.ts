import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/coze";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/image/generate —— 制版：prompt -> 图片 URL */
export async function POST(req: NextRequest) {
  let prompt = "";
  try {
    const body = await req.json();
    prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  } catch {
    prompt = "";
  }
  if (!prompt) {
    return NextResponse.json({ error: "缺少制版说明 prompt" }, { status: 400 });
  }

  const result = await generateImage(prompt);
  return NextResponse.json(result);
}
