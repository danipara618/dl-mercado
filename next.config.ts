import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // El proyecto no incluye ESLint: evita que el build de Vercel falle por eso.
  eslint: { ignoreDuringBuilds: true },
  // Recharts y lucide-react exportan todo desde un único barrel file; sin esto,
  // Next empaqueta el paquete completo aunque solo se use un ícono o un chart.
  // optimizePackageImports reescribe los imports a sus módulos internos (tree-shaking real).
  experimental: {
    optimizePackageImports: ["recharts", "lucide-react"],
  },
};

export default nextConfig;
