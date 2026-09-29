import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // El proyecto no incluye ESLint: evita que el build de Vercel falle por eso.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
