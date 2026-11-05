import type {Metadata} from "next";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
import KPIGrid from "@/components/KPIGrid";
import {Skeleton} from "@/components/States";
const RiskChart=dynamic(()=>import("@/components/RiskChart"),{loading:()=> <Skeleton className="h-[380px] w-full rounded-2xl"/>});
const BondsSection=dynamic(()=>import("@/components/BondsSection"),{loading:()=> <Skeleton className="h-[420px] w-full rounded-2xl"/>});
const PesosSection=dynamic(()=>import("@/components/PesosSection"),{loading:()=> <Skeleton className="h-[420px] w-full rounded-2xl"/>});
const EquitySection=dynamic(()=>import("@/components/EquitySection"),{loading:()=> <Skeleton className="h-[420px] w-full rounded-2xl"/>});
const GlobalMarkets=dynamic(()=>import("@/components/GlobalMarkets"),{loading:()=> <Skeleton className="h-[420px] w-full rounded-2xl"/>});
export const metadata:Metadata={title:"Mercados | DL Mercado",description:"Dólar, riesgo país, bonos, LECAP, renta fija, acciones, CEDEAR y mercados internacionales."};
export default function MercadosPage(){
 return <><Header activo="/mercados"/><main className="mx-auto max-w-7xl space-y-16 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
  <SectionTitle as="h1" title="Mercados" subtitle="Cotizaciones y análisis de activos financieros argentinos y globales. Mantenemos los paneles de dólar, riesgo país, bonos, LECAP, acciones y CEDEAR."/>
  <section id="indicadores" className="space-y-5"><SectionTitle title="Pulso del mercado" subtitle="Valores y variaciones según las fuentes de cada mercado."/><KPIGrid/></section>
  <section id="riesgo" className="space-y-5"><SectionTitle title="Riesgo país" subtitle="Evolución del EMBI Argentina y principales valores del período."/><RiskChart/></section>
  <BondsSection/><PesosSection/><EquitySection/><GlobalMarkets/>
 </main><Footer/></>;
}