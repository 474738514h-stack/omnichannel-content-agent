/**
 * 扣子能力封装
 * ---------------------------------------------------------------
 * · 生图 / 生视频：使用 coze-coding-dev-sdk，baseUrl 指向 api.coze.cn
 * · 工作流：使用扣子 REST（stream_run），由 SSE 路由消费
 * · 当账户额度不足 / 凭证缺失时，降级到确定性占位资源，保证交付可演示。
 *   所有返回体带 source 字段，真实 / 降级一眼可辨，不伪装。
 */

import {
  Config,
  ImageGenerationClient,
  VideoGenerationClient,
} from "coze-coding-dev-sdk";

export const COZE_PAT = process.env.COZE_API_TOKEN ?? "";

export const WORKFLOW_ID =
  process.env.COZE_WORKFLOW_ID ?? "7708734514465439754";

/** 集成端点：PAT 令牌走 api.coze.cn（integration.coze.cn 会 403） */
export const INTEGRATION_BASE =
  process.env.COZE_INTEGRATION_BASE_URL ?? "https://api.coze.cn";

export type MediaResult = {
  url: string;
  source: "coze" | "placeholder";
  note?: string;
};

function makeConfig(): Config {
  return new Config({ apiKey: COZE_PAT, baseUrl: INTEGRATION_BASE });
}

/** 稳定的占位图：报刊工坊风格的 SVG data URI，随 prompt 变化色相 */
function placeholderImage(prompt: string): string {
  const seed = [...prompt].reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = seed % 40;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="900" viewBox="0 0 720 900">
  <rect width="720" height="900" fill="#e9e1cf"/>
  <rect x="40" y="40" width="640" height="820" fill="#fbf8f0" stroke="#c1441e" stroke-width="3"/>
  <text x="360" y="120" font-family="Georgia,serif" font-size="34" fill="#c1441e" text-anchor="middle" letter-spacing="6">PRESS PROOF</text>
  <line x1="80" y1="150" x2="640" y2="150" stroke="#2a2723" stroke-width="2"/>
  <text x="360" y="470" font-family="Georgia,serif" font-size="26" fill="#55504a" text-anchor="middle">制版样张 · 待签发</text>
  <text x="360" y="520" font-family="Georgia,serif" font-size="20" fill="#90897d" text-anchor="middle">hue ${hue} / seed ${seed}</text>
  <line x1="80" y1="760" x2="640" y2="760" stroke="#d5cdbc" stroke-width="1"/>
  <text x="360" y="810" font-family="monospace" font-size="16" fill="#90897d" text-anchor="middle">MIDNIGHT NEWSROOM</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** 稳定的占位视频：来自公开可访问的服务，UI 里以海报帧呈现 */
const PLACEHOLDER_VIDEO =
  "https://cdn.coverr.co/videos/coverr-a-camera-on-a-desk-1080p.mp4";

/** 真实生图；失败降级 */
export async function generateImage(prompt: string): Promise<MediaResult> {
  try {
    const client = new ImageGenerationClient(makeConfig());
    const response = await client.generate({
      prompt,
      size: "1K",
      watermark: false,
      responseFormat: "url",
    });
    const helper = client.getResponseHelper(response);
    const urls = helper.imageUrls;
    if (urls.length > 0) {
      return { url: urls[0], source: "coze" };
    }
    const errs = helper.errorMessages;
    throw new Error(errs.length ? errs.join("; ") : "空图片返回");
  } catch (err) {
    return {
      url: placeholderImage(prompt),
      source: "placeholder",
      note: err instanceof Error ? err.message : String(err),
    };
  }
}

/** 真实生视频；失败降级 */
export async function generateVideo(
  prompt: string,
  opts?: { ratio?: "9:16" | "16:9"; duration?: number }
): Promise<MediaResult> {
  try {
    const client = new VideoGenerationClient(makeConfig());
    const response = await client.videoGeneration(
      [{ type: "text", text: prompt }],
      {
        ratio: opts?.ratio ?? "9:16",
        resolution: "720p",
        duration: opts?.duration ?? 5,
      }
    );
    const url = response?.videoUrl;
    if (url) return { url, source: "coze" };
    throw new Error(response?.response?.error_message || "空视频返回");
  } catch (err) {
    return {
      url: PLACEHOLDER_VIDEO,
      source: "placeholder",
      note: err instanceof Error ? err.message : String(err),
    };
  }
}
