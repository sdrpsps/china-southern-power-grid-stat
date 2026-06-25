import type { NextConfig } from "next";
import { APP_BASE_PATH } from "./lib/app-path";

const nextConfig: NextConfig = {
  basePath: APP_BASE_PATH || undefined,
  env: {
    APP_BASE_PATH,
  },
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
