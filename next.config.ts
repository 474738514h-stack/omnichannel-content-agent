import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 锁定 turbopack 根到项目目录，避免向上扫描父级 package-lock.json
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
