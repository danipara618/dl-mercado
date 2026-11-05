import type {Metadata} from "next";
import Link from "next/link";
import {ArrowRight,Database,ChartNoAxesCombined} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
export const metadata:Metadata={title:"Datos y descargas | DL Mercado",description:"Accedé al explorador de series estadísticas INDEC y al histórico financiero, con descarga CSV."};
export default function Datos(){
 return <><Header/><main className="mx-auto max-w-7xl space-y-7 px-4 pb-20 pt-10 sm:px-6 lg:px-8">
  <SectionTitle as="h1" title="Datos y descargas" subtitle="Accedé a los históricos completos y a los registros oficiales. Las visualizaciones principales están seleccionadas para que no necesites configurar nada."/>
  <div className="grid gap-5 md:grid-cols-2">
   <Link href="/series" className="rounded-3xl border border-crema-200 bg-white p-7 shadow-sm hover:border-oliva"><ChartNoAxesCombined size={27} className="text-oliva"/><h2 className="mt-5 font-serif text-3xl">Series históricas</h2><p className="mt-3 text-sm text-tinta/65">Dólar, tasas, reservas, precios y riesgo país, con series originales y CSV.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-oliva">Explorar series <ArrowRight size={15}/></span></Link>
   <Link href="/observatorio" className="rounded-3xl border border-crema-200 bg-white p-7 shadow-sm hover:border-oliva"><Database size={27} className="text-oliva"/><h2 className="mt-5 font-serif text-3xl">API-INDEC</h2><p className="mt-3 text-sm text-tinta/65">Explorador técnico de precios, actividad, trabajo, población y comercio exterior.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-oliva">Abrir datos oficiales <ArrowRight size={15}/></span></Link>
  </div>
 </main><Footer/></>;
}