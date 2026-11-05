import Link from "next/link";
import {ArrowRight,ChartNoAxesCombined,Calculator,CandlestickChart,NotebookPen,BookOpen,Database} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomeHighlights from "@/components/HomeHighlights";
import HomeAbout from "@/components/HomeAbout";
import EducationBlock from "@/components/EducationBlock";
import SectionTitle from "@/components/SectionTitle";
import {listarNotas} from "@/lib/notas";
export const revalidate=600;
const accesos=[
 {href:"/mercados",titulo:"Mercados",detalle:"Dólar, riesgo país, bonos, LECAP, CEDEAR, acciones y mercados internacionales.",icono:CandlestickChart},
 {href:"/economia",titulo:"Economía argentina",detalle:"Precios, actividad, empleo, pobreza, población y comercio exterior, con datos y gráficos.",icono:ChartNoAxesCombined},
 {href:"/calculadoras",titulo:"Calculadoras",detalle:"Respondé preguntas sobre tu sueldo, inflación, alquiler, ahorro y retiro.",icono:Calculator},
 {href:"/notas",titulo:"Notas y análisis",detalle:"Ideas, análisis de coyuntura y economía explicada con datos.",icono:NotebookPen},
];
export default function Home(){
 const notas=listarNotas().slice(0,3);
 return <><Header activo="/"/><main className="mx-auto max-w-7xl space-y-16 px-4 pb-20 pt-10 sm:px-6 lg:px-8">
  <section className="rounded-3xl border border-crema-200 bg-white p-7 shadow-sm sm:p-12">
   <p className="text-xs font-extrabold uppercase tracking-[.2em] text-oliva">Economía · Mercados · Datos</p>
   <h1 className="mt-3 font-serif text-5xl leading-tight text-tinta sm:text-6xl">Entender la economía, sin perderse entre números.</h1>
   <p className="mt-4 max-w-3xl text-base leading-relaxed text-tinta/65">DL Mercado reúne indicadores oficiales, información financiera y herramientas prácticas. Elegí qué querés explorar: cotizaciones, economía argentina o cómo todo esto afecta a tu dinero.</p>
   <div className="mt-7 flex flex-wrap gap-3">
    <Link href="/mercados" className="inline-flex items-center gap-2 rounded-full bg-oliva px-5 py-3 text-sm font-bold text-white">Ver mercados <ArrowRight size={16}/></Link>
    <Link href="/economia" className="inline-flex items-center gap-2 rounded-full border border-oliva px-5 py-3 text-sm font-bold text-oliva">Explorar economía argentina <ArrowRight size={16}/></Link>
   </div>
  </section>
  <HomeHighlights/>
  <section className="space-y-6">
   <SectionTitle title="Explorá DL Mercado" subtitle="Cada sección cumple una función distinta. Encontrá lo que necesitás y profundizá cuando quieras."/>
   <div className="grid gap-4 md:grid-cols-2">
    {accesos.map(({href,titulo,detalle,icono:Icon})=><Link href={href} key={href} className="group flex flex-col rounded-2xl border border-crema-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-oliva/50">
     <span className="grid h-11 w-11 place-items-center rounded-xl bg-oliva-100 text-oliva"><Icon size={23}/></span>
     <h2 className="mt-5 font-serif text-2xl">{titulo}</h2>
     <p className="mt-2 flex-1 text-sm leading-relaxed text-tinta/65">{detalle}</p>
     <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-oliva">Abrir sección <ArrowRight size={16}/></span>
    </Link>)}
   </div>
  </section>
  <section className="space-y-6">
   <SectionTitle title="Mis notas" subtitle="Análisis, coyuntura y economía explicada con información verificable."/>
   {notas.length?<div className="grid gap-4 md:grid-cols-3">
    {notas.map(n=><Link href={`/notas/${n.slug}`} key={n.slug} className="rounded-2xl border border-crema-200 bg-white p-6 shadow-sm hover:border-oliva/50">
     <p className="text-xs font-bold uppercase tracking-wider text-oliva">{n.categoria} · {n.fecha}</p>
     <h3 className="mt-4 font-serif text-2xl">{n.titulo}</h3>
     <p className="mt-3 text-sm text-tinta/60">{n.bajada}</p>
     <span className="mt-5 inline-block text-sm font-bold text-oliva">Leer nota →</span>
    </Link>)}
   </div>:<p className="rounded-xl bg-crema-50 p-5 text-sm text-tinta/60">Las próximas publicaciones aparecerán en esta sección.</p>}
   <Link href="/notas" className="inline-flex items-center gap-2 font-bold text-oliva">Ver todas mis notas <ArrowRight size={16}/></Link>
  </section>
  <EducationBlock/>
  <HomeAbout/>
  <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-crema-200 bg-crema-50 p-6">
   <div><h2 className="font-serif text-2xl">Datos para analizar</h2><p className="mt-2 text-sm text-tinta/60">Series originales del INDEC y de los mercados, con descargas para investigar.</p></div>
   <Link href="/datos" className="inline-flex items-center gap-2 rounded-full border border-oliva px-5 py-2.5 text-sm font-bold text-oliva"><Database size={17}/> Datos y descargas <ArrowRight size={16}/></Link>
  </section>
 </main><Footer/></>;
}