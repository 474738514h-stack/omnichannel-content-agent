import type { Metadata } from "next";
import "./globals.css";
import { InspectorWrapper } from "@/components/dev/inspector-wrapper";

export const metadata: Metadata = {
  title: "午夜新闻编辑室 · 一条新闻，三刊分发",
  description: "把一条新闻排版分发成微博、小红书与短视频三刊内容包。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        {children}
        <InspectorWrapper />
      </body>
    </html>
  );
}
