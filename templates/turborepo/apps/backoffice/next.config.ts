import {fileURLToPath} from "node:url";
import path from "node:path";
import {withPayload} from "@payloadcms/next/withPayload";
import type {NextConfig} from "next";

const workspaceRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: workspaceRoot,
  output: "standalone",
  poweredByHeader: false,
  images: {
    localPatterns: [
      {
        pathname: "/api/media/file/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig, {
  devBundleServerPackages: false,
});
