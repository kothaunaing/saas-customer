import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  async rewrites() {
    // Accept the legacy public API URL only as a server-side proxy target.
    const configuredUrl = process.env.BACKEND_URL ||
      (/^https?:\/\//.test(process.env.NEXT_PUBLIC_API_URL ?? "")
        ? process.env.NEXT_PUBLIC_API_URL!
        : "http://127.0.0.1:4010");
    const backendUrl = configuredUrl.replace(/\/+$/, "").replace(/\/api$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
