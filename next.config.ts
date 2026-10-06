import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No dev badge: keeps screenshots and the rendered video clean.
  devIndicators: false,
  // Knowledge files, comic pool and video metadata are read with fs at request time;
  // make sure they are bundled with every server function.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
};

export default nextConfig;
