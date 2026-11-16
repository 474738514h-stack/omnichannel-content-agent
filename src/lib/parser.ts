/**
 * 工作流输出解析器
 * ---------------------------------------------------------------
 * 三条铁律（来自需求，务必保持）：
 * 1. 跳过检测只看决策首段 decision.split(/[：:,，]/)[0].trim()，
 *    绝不对整段做 .includes("不推荐")——原因文本会误命中。
 * 2. 分镜/配图按编号拆分必须用全局 matchAll /g + [^<>]* 字符类，
 *    不能 line-anchored；工作流一行塞 4 个分镜也必须 4 命中。
 * 3. 不依赖全局数组下标共享状态；每张卡片按渠道独立成 state。
 */

import { CHANNEL_KEYS, type ChannelKey, type ChannelState, type ParsedOutput, type ShotState, type Variant } from "./types";

type Dict = Record<string, unknown>;

function isDict(v: unknown): v is Dict {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** 按候选键取第一个有效值，兼容工作流中英字段别名 */
function pick(obj: Dict, keys: string[]): unknown {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

function asString(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  return "";
}

/**
 * 编号拆分 —— 全局 matchAll /g + [^<>]* 字符类，非 line-anchored。
 * 单行 "1.开场 2.转折 3.高潮 4.收尾" 也能全部命中。
 * (?!\d) 防止把 "2.5K" 之类小数误当编号。
 */
export function splitNumbered(text: string): string[] {
  if (!text) return [];
  const re = /(?:^|[\s，,、；;])([1-9])[\.．、](?!\d)\s*([^<>]*?)(?=(?:^|[\s，,、；;])[1-9][\.．、](?!\d)|$)/gm;
  const parts = Array.from(text.matchAll(re))
    .map((m) => m[2].trim())
    .filter((s) => s.length > 0);
  return parts;
}

/** 字符串或数组 -> 字符串数组（字符串走编号拆分） */
function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(asString).filter(Boolean);
  if (typeof v === "string") {
    const parts = splitNumbered(v);
    return parts.length > 0 ? parts : [v.trim()].filter(Boolean);
  }
  return [];
}

/** 跳过检测：只看决策首段；关键字段为"无"亦视为跳过 */
export function detectSkip(decision: string, copy?: string): { skipped: boolean; reason: string } {
  const head = decision.split(/[：:,，]/)[0].trim();
  const skipHeads = ["不推荐", "不建议", "无", "跳过", "弃用", "不适用"];
  if (skipHeads.includes(head)) {
    return { skipped: true, reason: decision };
  }
  if (head === "" && asString(copy) === "无") {
    return { skipped: true, reason: "关键字段为「无」" };
  }
  return { skipped: false, reason: "" };
}

/** 从分镜文本提取时长标签，缺省 5s */
function extractDuration(script: string): string {
  const m = script.match(/(\d+(?:\.\d+)?)\s*(?:s|S|秒|sec)/);
  return m ? `${m[1]}s` : "5s";
}

function parseShots(script: string): ShotState[] {
  return splitNumbered(script).map((part, i) => ({
    id: i + 1,
    script: part,
    duration: extractDuration(part),
    videoUrl: null,
    status: "idle" as const,
  }));
}

/** 把一张卡片的三个渠道字段归一化 */
function normalizeCard(card: unknown): Record<ChannelKey, unknown> {
  const obj = isDict(card) ? card : {};
  const channels = isDict(obj["channels"]) ? (obj["channels"] as Dict) : obj;
  return {
    weibo: pick(channels, ["weibo", "微博", "weibo_content", "weibo_copy", "weibo_post"]),
    xiaohongshu: pick(channels, ["xiaohongshu", "小红书", "xhs", "rednote", "note", "xiaohongshu_note"]),
    video: pick(channels, ["video", "短视频", "short_video", "video_script", "storyboard", "script"]),
  };
}

function parseChannel(raw: unknown, key: ChannelKey): ChannelState {
  const obj = isDict(raw) ? raw : {};
  const decision = asString(
    pick(obj, ["decision", "决策", "判断", "recommendation", "推荐", "评估", "是否推荐"])
  );
  const copy = asString(
    pick(obj, ["copy", "content", "text", "文案", "正文", "笔记正文", "微博文案", "description", "body"])
  );
  const title = asString(pick(obj, ["title", "标题", "话题", "headline", "note_title"]));
  const tags = asStringArray(pick(obj, ["tags", "话题标签", "hashtags", "标签", "topics"]));
  const imagePrompts = asStringArray(
    pick(obj, ["image_prompts", "imagePrompts", "配图建议", "配图", "images", "prompts", "cover_prompt", "封面图"])
  );
  const script = asString(
    pick(obj, ["script", "分镜脚本", "脚本", "shots", "视频脚本", "storyboard", "outline"])
  );

  const { skipped, reason } = detectSkip(decision, copy);
  const shots = key === "video" ? parseShots(script) : [];

  return {
    key,
    decision,
    copy,
    title,
    tags,
    skipped,
    skipReason: reason,
    imagePrompts,
    imageUrls: imagePrompts.map(() => null),
    printing: 0,
    shots,
    videoUrl: null,
  };
}

/** 从各种包裹形态里抽出卡片数组 */
function extractCards(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      return extractCards(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  if (isDict(raw)) {
    const inner = pick(raw, ["output", "data", "result", "cards", "variants", "outputs"]);
    if (inner !== undefined) return extractCards(inner);
    return [raw];
  }
  return [];
}

/** 主入口：解析工作流 output -> 标准变体结构 */
export function parseWorkflowOutput(raw: unknown): ParsedOutput {
  const cards = extractCards(raw);
  const variants: Variant[] = cards.slice(0, 12).map((card, index) => {
    const channels = {} as Record<ChannelKey, ChannelState>;
    const normalized = normalizeCard(card);
    for (const key of CHANNEL_KEYS) {
      channels[key] = parseChannel(normalized[key], key);
    }
    return {
      index,
      label: `第 ${index + 1} 版`,
      channels,
    };
  });

  let validCount = 0;
  let skippedCount = 0;
  for (const v of variants) {
    for (const key of CHANNEL_KEYS) {
      if (v.channels[key].skipped) skippedCount++;
      else validCount++;
    }
  }

  return { variants, validCount, skippedCount };
}

/** 深拷贝一份变体，供前端按 key + idx 建立互不干扰的独立状态 */
export function cloneVariants(variants: Variant[]): Variant[] {
  return variants.map((v) => ({
    ...v,
    channels: Object.fromEntries(
      CHANNEL_KEYS.map((key) => {
        const c = v.channels[key];
        return [
          key,
          {
            ...c,
            tags: [...c.tags],
            imagePrompts: [...c.imagePrompts],
            imageUrls: [...c.imageUrls],
            shots: c.shots.map((s) => ({ ...s })),
          },
        ];
      })
    ) as Record<ChannelKey, ChannelState>,
  }));
}
