import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
import { ChartNoAxesCombined, Calculator, Banknote, House, TrendingUp } from "lucide-react";
export const metadata={title:"Calculadoras | DL Mercado",description:"Herramientas para inflación, salario real, CBT real, inflación regional, difusión, finanzas y alquileres."};
const items=[
 {href:"/calculadoras/macro",title:"Precios, canastas y salarios reales",description:"Cinco herramientas: salario real, inflación acumulada, CBT real, brecha regional y difusión de precios.",Icon:ChartNoAxesCombined},
 {href:"/calculadoras/inflacion",title:"Poder adquisitivo de un monto",description:"Calculá el valor equivalente de un monto histórico ajustado por IPC.",Icon:TrendingUp},
 {href:"/calculadoras/alquiler",title:"Alquiler",description:"Actualización contractual y ajuste por IPC.",Icon:House},
 {href:"/calculadoras/interes-compuesto",title:"Interés compuesto",description:"Capital futuro con aportes periódicos.",Icon:Calculator},
 {href:"/calculadoras/retiro",title:"Retiro",description:"Simulación de ahorro y capital para objetivos.",Icon:Banknote},
 {href:"/calculadoras/nodocente",title:"Salario no docente",description:"Liquidación y poder adquisitivo.",Icon:Calculator},
];
export default function CalculadorasPage(){
 return <><Header/><main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
  <SectionTitle as="h1" title="Calculadoras" subtitle="Herramientas de análisis separadas del Tablero Macro. Las comparaciones estadísticas identifican la fuente y no completan datos faltantes."/>
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(({href,title,description,Icon})=>
   <Link key={href} href={href} className="group rounded-2xl border border-crema-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-oliva/40">
    <Icon size={24} className="text-oliva"/><h2 className="mt-5 font-serif text-xl">{title}</h2><p className="mt-2 text-sm leading-relaxed text-tinta/60">{description}</p>
    <span className="mt-4 inline-block text-xs font-bold text-oliva">Abrir herramienta →</span>
   </Link>)}</div>
 </main><Footer/></>;
}
