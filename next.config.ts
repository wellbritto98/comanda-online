import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pacotes CJS com sub-deps problemáticas no bundler do Vite/vinext (ex.: semver em jsonwebtoken)
  serverExternalPackages: ["jsonwebtoken", "bcryptjs"],
};

export default nextConfig;
