import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Knowledge files, comic pool and video metadata are read with fs at request time;
  // make sure they are bundled with every server function.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
};

export default nextConfig;
