import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";

const ObservatorioIndec = dynamic(() => import("@/components/ObservatorioIndec"));

export const metadata: Metadata = {
  title: "Observatorio macro | DL Mercado",
  description: "Explorador de estadísticas oficiales INDEC: inflación, actividad, trabajo, población y comercio exterior.",
};

export default function ObservatorioPage() {
  return <><Header/><main className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
    <SectionTitle as="h1" title="Datos macro de Argentina" subtitle="Series oficiales del INDEC, filtros, visualización y exportación."/>
    <ObservatorioIndec/>
  </main><Footer/></>;
}
