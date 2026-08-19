import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  // 关闭生产模式 source map, 节省构建时间
  productionBrowserSourceMaps: false,
};

export default nextConfig;
