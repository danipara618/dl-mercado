"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {Download} from "lucide-react";
import {descargarCSV} from "@/lib/descargarCSV";
type Punto={fecha:string;valor:number};
type Serie={id:string;titulo:string;unidad:string;puntos:Punto[];estado:string};
type Response={indicadores:Serie[]};
type Dolar={casa:string;venta:number};
const fmt=(n:number,dec=1)=>new Intl.NumberFormat("es-AR",{maximumFractionDigits:dec}).format(n);
export default function HomeHighlights(){
 const [ind,setInd]=useState<Serie[]>([]);
 const [dolar,setDolar]=useState<number|null>(null);
 const [riesgo,setRiesgo]=useState<number|null>(null);
 useEffect(()=>{
  let active=true;
  Promise.allSettled([
   fetch("/api/macro-resumen").then(r=>r.json() as Promise<Response>),
   fetch("/api/dolares").then(async r=>{const j=await r.json();return (j?.data||[]) as Dolar[];}),
   fetch("/api/riesgo-pais").then(async r=>{const j=await r.json();return j?.data?.ultimo?.valor as number|null;})
  ]).then(rs=>{
   if(!active)return;
   if(rs[0].status==="fulfilled")setInd(rs[0].value.indicadores||[]);
   if(rs[1].status==="fulfilled")setDolar(rs[1].value.find(x=>x.casa==="oficial")?.venta??null);
   if(rs[2].status==="fulfilled")setRiesgo(rs[2].value??null);
  });
  return ()=>{active=false};
 },[]);
 const items=[
  {titulo:"Dólar oficial",valor:dolar!=null?"$ "+fmt(dolar,2):"—",fuente:"Mercados",href:"/mercados",periodo:"Última cotización"},
  {titulo:"Riesgo país",valor:riesgo!=null?fmt(riesgo,0)+" pb":"—",fuente:"Mercados",href:"/mercados#riesgo",periodo:"Último dato"},
  ...["ipc","empleo","pobreza","emae"].map(id=>{
   const x=ind.find(s=>s.id===id&&s.estado==="ok"),p=x?.puntos.at(-1);
   return {titulo:id==="ipc"?"Inflación mensual":id==="empleo"?"Desocupación":id==="pobreza"?"Pobreza":"Actividad (EMAE)",
    valor:p?fmt(p.valor,x?.unidad==="Índice"?1:1)+(x?.unidad==="%"?"%":" "+(x?.unidad||"")):"—",
    fuente:"INDEC",href:"/economia",periodo:p?.fecha||"Sin datos verificados"};
  })
 ];
 return <section className="space-y-5">
  <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-oliva">Un vistazo a la economía</p><h2 className="mt-1 font-serif text-3xl">Indicadores destacados</h2>
   <p className="mt-2 text-sm text-tinta/60">Cada dato conserva su período de referencia: cotizaciones financieras y estadísticas publicadas tienen distinta frecuencia.</p></div>
   <button type="button" onClick={()=>descargarCSV("dl-mercado-indicadores-destacados",["indicador","ultimo_valor","periodo","fuente"],items.map(x=>[x.titulo,x.valor,x.periodo,x.fuente]))} className="inline-flex items-center gap-2 rounded-full border border-oliva/40 px-4 py-2 text-xs font-bold text-oliva hover:bg-oliva-100"><Download size={16}/> Descargar resumen CSV</button></div>
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
   {items.map((item,i)=><Link href={item.href} key={i} className="rounded-2xl border border-crema-200 bg-white p-5 shadow-sm transition hover:border-oliva/50">
    <span className="text-xs font-semibold text-tinta/55">{item.titulo}</span>
    <span className="mt-3 block font-mono text-2xl font-semibold tabular-nums">{item.valor}</span>
    <span className="mt-2 block text-xs text-tinta/45">{item.periodo} · {item.fuente}</span>
   </Link>)}
  </div>
 </section>;
}
