import type { ChannelKey } from "@/lib/types";

type MarkProps = { className?: string };

/**
 * 自定义平台徽标 —— 手绘 editorial 线条，非 emoji、非官方 logo 像素。
 * 统一 32x32 视框，stroke 走 currentColor，便于用语义色。
 */

/** 微博：一只简笔飞鸟（电讯快鸟） */
export function WeiboMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 19c4.5 1 8-0.5 10.5-3.5C16.8 13 18 9.5 21 7c1.2 3.6 0 6-1.5 8 2-0.8 3.6-2.2 4.8-4C25 15 22.5 20 17.5 22c-4 1.6-9.5 1-13.5-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M6 24.5c2.5 1 5.5 1 8 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="23" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

/** 小红书：一个带折角的笔记方块（稿笺） */
export function NoteMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <rect x="6" y="5" width="20" height="23" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 10h20" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 5v23" stroke="currentColor" strokeWidth="1.2" />
      <path d="M15 15h7M15 19h7M15 23h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M22 5l4 4h-4V5Z" fill="currentColor" />
    </svg>
  );
}

/** 短视频：播放三角嵌在胶片框里 */
export function PlayMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <rect x="3" y="7" width="26" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 7v18M25 7v18" stroke="currentColor" strokeWidth="1.1" />
      <path d="M6 11h2M6 16h2M6 21h2M24 11h2M24 16h2M24 21h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M14 12.5l6 3.5-6 3.5v-7Z" fill="currentColor" />
    </svg>
  );
}

export function PlatformMark({
  channel,
  className,
}: MarkProps & { channel: ChannelKey }) {
  if (channel === "weibo") return <WeiboMark className={className} />;
  if (channel === "xiaohongshu") return <NoteMark className={className} />;
  return <PlayMark className={className} />;
}
