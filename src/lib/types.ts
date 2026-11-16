/**
 * 数据契约 —— 与扣子工作流的 output 数组对齐。
 *
 * 工作流返回 { output: [card1, card2, ...] }，每张卡片承载
 * 微博 / 小红书 / 短视频三个渠道各一个变体。
 */

export type ChannelKey = "weibo" | "xiaohongshu" | "video";

export const CHANNEL_KEYS: ChannelKey[] = ["weibo", "xiaohongshu", "video"];

/** 单渠道在某一个变体上的完整独立状态（绝不共享全局数组下标） */
export type ChannelState = {
  key: ChannelKey;
  /** 该渠道对该变体的决策原文，用于首段跳过检测 */
  decision: string;
  /** 主文案 / 笔记正文 / 视频脚本总述 */
  copy: string;
  /** 小红书标题；微博可为话题串 */
  title: string;
  /** 话题标签 */
  tags: string[];
  /** 是否跳过（决策首段命中"不推荐"或关键字段为"无"） */
  skipped: boolean;
  /** 跳过原因 */
  skipReason: string;
  /** 配图提示词（小红书 N 张 / 微博可选） */
  imagePrompts: string[];
  /** 已印制完成的图片 URL，与 imagePrompts 一一对应 */
  imageUrls: (string | null)[];
  /** 印制任务进行中的数量 */
  printing: number;
  /** 短视频分镜，每镜独立 */
  shots: ShotState[];
  /** 封面图 URL */
  videoUrl: string | null;
};

/** 单个分镜的独立状态 */
export type ShotState = {
  id: number;
  /** 镜头脚本（画面 + 台词 + 运镜） */
  script: string;
  /** 时长标签，如 "6s" */
  duration: string;
  videoUrl: string | null;
  status: "idle" | "shooting" | "ready";
};

/** 一个变体 = 三渠道各一份内容 */
export type Variant = {
  index: number;
  label: string;
  channels: Record<ChannelKey, ChannelState>;
};

/** 工作流节点进度（SSE event: node） */
export type NodeProgress = {
  id: number;
  title: string;
  status: "running" | "done";
  detail?: string;
};

/** SSE 从后端推给前端的事件负载 */
export type StreamEvent =
  | {
      type: "ready";
      message: string;
      variantCount?: number;
      degraded?: boolean;
      reason?: string;
    }
  | { type: "node"; node: NodeProgress }
  | {
      type: "done";
      variants: Variant[];
      validCount: number;
      skippedCount: number;
      raw?: string;
    }
  | { type: "error"; message: string };

/** 后端解析工作流输出后的标准结果 */
export type ParsedOutput = {
  variants: Variant[];
  validCount: number;
  skippedCount: number;
};

export const CHANNEL_META: Record<
  ChannelKey,
  { label: string; edition: string; plural: string }
> = {
  weibo: { label: "微博", edition: "微刊", plural: "即时电讯" },
  xiaohongshu: { label: "小红书", edition: "种草刊", plural: "生活方式版" },
  video: { label: "短视频", edition: "影刊", plural: "分镜版" },
};
