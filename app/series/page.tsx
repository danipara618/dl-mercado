import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
import SeriesGrid from "@/components/series/SeriesGrid";

export const metadata: Metadata = {
  title: "Series | DL Mercado",
  description: "Dólar, tasas, reservas, precios y riesgo país — series históricas con descarga en CSV.",
};

export const revalidate = 600;

export default function SeriesPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl space-y-10 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <SectionTitle
          as="h1"
          title="Series"
          subtitle="Todas las series de DL Mercado en un solo lugar: dólar, tasas y reservas del BCRA, precios y expectativas, y riesgo país. Cada una con su histórico, su color de categoría y descarga individual en CSV."
        />
        <SeriesGrid />
      </main>
      <Footer />
    </>
  );
}
