import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const serif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-dm-serif", display: "swap" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const mono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-dm-mono", display: "swap" });

export const metadata: Metadata = {
  title: "DL Mercado · Economía y Finanzas",
  description: "Dólar, riesgo país, bonos soberanos, LECAPs, CER, UVA y mercados globales en un solo tablero.",
};

export const viewport: Viewport = { themeColor: "#2C3A22" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
