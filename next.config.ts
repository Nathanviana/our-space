import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Cada foto é enviada já reduzida no celular, uma por vez (RNF-04)
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
