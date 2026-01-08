import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 配置 webpack 以支持 FFmpeg.wasm
  webpack: (config, { isServer }) => {
    // 添加 fallback 用于浏览器环境
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  // Turbopack 配置（Next.js 16+ 需要）
  turbopack: {},
  // 配置 headers 以支持 SharedArrayBuffer (FFmpeg.wasm 需要)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
