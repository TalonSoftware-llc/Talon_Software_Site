import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  // Keep this app from compiling the marketing site one directory up.
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
  agentRules: false,
};

export default nextConfig;
