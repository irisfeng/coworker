import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@libsql/client",
    "better-sqlite3",
    "openai",
    "resend",
    "ws",
  ],
  turbopack: {
    root: rootDir,
  },
};

export default nextConfig;
