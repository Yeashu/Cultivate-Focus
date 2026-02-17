import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => [
    { source: "/tasks", destination: "/", permanent: true },
  ],
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
