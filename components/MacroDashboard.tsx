"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ChartNoAxesCombined, Info } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import SectionTitle from "./SectionTitle";

type Punto = {fecha: string; valor: number};
type Indicador = {
  id:string;
  titulo:string;
  subtitulo:string;
  unidad:string;
  fuente:string;
  puntos:Punto[];
  estado:"ok"|"sin_datos";
  aviso?:string;
};
type Respuesta = {indicadores:Indicador[];actualizado:string;nota:string};

const categorias = [
 {titulo:"Precios y costo de vida",sub:"Inflación y canasta básica de referencia",ids:["ipc","canasta"]},
 {titulo:"Actividad y producción",sub:"Evolución de la economía y de la industria",ids:["emae","industria"]},
 {titulo:"Trabajo e ingresos",sub:"Salarios y desocupación",ids:["salarios","empleo"]},
 {titulo:"Condiciones de vida",sub:"Pobreza de las personas",ids:["pobreza"]},
 {titulo:"Comercio exterior",sub:"Bienes exportados e importados; sus valores no se suman desde muestras parciales",ids:["expo","impo"]},
];
function fmt(valor:number,unidad:string){
 return new Intl.NumberFormat("es-AR",{maximumFractionDigits:unidad==="ARS"?0:1}).format(valor);
}
function Tarjeta({item}:{item:Indicador}) {
 const puntos=item.puntos||[];
 const ultimo=puntos.at(-1);
 const anterior=puntos.at(-2);
 const diferencia=ultimo&&anterior&&anterior.valor!==0?(ultimo.valor-anterior.valor)/Math.abs(anterior.valor)*100:null;
 const esTasa=item.unidad==="%";
 return <article className="min-w-0 rounded-2xl border border-crema-200 bg-white p-5 shadow-sm sm:p-6">
   <h4 className="font-serif text-xl leading-snug">{item.titulo}</h4>
   <p className="mt-1 min-h-9 text-xs leading-relaxed text-tinta/60">{item.subtitulo}</p>
   {item.estado==="ok" && ultimo ? <>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
     <div>
      <p className="font-mono text-3xl font-semibold tabular-nums">
       {item.unidad==="ARS"?"$ ":""}{fmt(ultimo.valor,item.unidad)}
       {item.unidad!=="ARS" && <span className="ml-1 text-sm font-medium text-tinta/55">{item.unidad}</span>}
      </p>
      <p className="mt-1 text-xs text-tinta/50">Último período: {ultimo.fecha}</p>
     </div>
     {!esTasa && diferencia!==null && <p className="text-xs font-semibold text-tinta/60">
      {diferencia>=0?"+":""}{fmt(diferencia,"%")}% frente al registro anterior
     </p>}
    </div>
    <div className="mt-4 h-56 w-full" role="img" aria-label={`Evolución histórica de ${item.titulo}`}>
      <ResponsiveContainer width="100%" height="100%">
       <LineChart data={puntos} margin={{top:10,left:0,right:10,bottom:0}}>
        <CartesianGrid stroke="#E7DECD" vertical={false} />
        <XAxis dataKey="fecha" minTickGap={38} tick={{fontSize:10}}/>
        <YAxis width={55} tick={{fontSize:10}} tickFormatter={(v:number)=>new Intl.NumberFormat("es-AR",{notation:"compact",maximumFractionDigits:1}).format(v)}/>
        <Tooltip labelFormatter={(v)=>"Período: "+String(v)}
          formatter={(v:number)=>[fmt(v,item.unidad)+(item.unidad==="%"?"%":item.unidad==="ARS"?" pesos":" "+item.unidad),item.titulo]} />
        <Line type="monotone" dataKey="valor" stroke="#2C3A22" strokeWidth={2.5} dot={false} isAnimationActive={false}/>
       </LineChart>
      </ResponsiveContainer>
    </div>
   </>:<div className="mt-5 flex min-h-52 flex-col items-center justify-center rounded-xl bg-crema-50 px-6 py-8 text-center">
     <Info size={20} className="text-oliva/65" />
     <p className="mt-3 font-semibold text-sm">Dato pendiente de validación</p>
     <p className="mt-2 max-w-xs text-xs leading-relaxed text-tinta/60">{item.aviso||"Todavía no contamos con una serie homogénea para este indicador."}</p>
   </div>}
   <p className="mt-4 border-t border-crema-200 pt-3 text-[11px] leading-relaxed text-tinta/50">
     Fuente: {item.fuente} {puntos.length>0&&`· ${puntos.length} observaciones`}
   </p>
 </article>;
}
export default function MacroDashboard(){
 const [data,setData]=useState<Respuesta|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let activo=true;
  fetch("/api/macro-resumen",{cache:"no-store"})
    .then(async r=>{const json=await r.json() as Respuesta;if(!r.ok)throw new Error("No se pudo consultar el resumen macro.");return json;})
    .then(j=>{if(activo)setData(j);})
    .catch(e=>{if(activo)setError(e instanceof Error?e.message:"Error consultando estadísticas.");})
    .finally(()=>{if(activo)setLoading(false);});
  return ()=>{activo=false};
 },[]);
 return <section id="macro-series" className="space-y-7">
  <div className="rounded-3xl border border-crema-200 bg-white p-6 shadow-sm sm:p-8">
    <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-oliva"><ChartNoAxesCombined size={17}/> Datos macro de Argentina</p>
    <div className="mt-2"><SectionTitle title="Tablero macro" subtitle="La economía argentina explicada con gráficos que se actualizan desde las fuentes. No necesitás elegir series, completar formularios ni hacer cálculos."/></div>
    <p className="text-sm text-tinta/60">Inflación, canasta básica, actividad, industria, salarios, empleo, pobreza y comercio exterior.</p>
  </div>
  {loading&&<div className="grid gap-4 sm:grid-cols-2">{Array.from({length:4},(_,i)=><div key={i} className="h-72 animate-pulse rounded-2xl border border-crema-200 bg-white/60"/>)}</div>}
  {error&&<p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{error}</p>}
  {data && <>
    {categorias.map(grupo=><div key={grupo.titulo}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div><h3 className="font-serif text-2xl text-tinta">{grupo.titulo}</h3><p className="mt-1 text-sm text-tinta/60">{grupo.sub}</p></div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {grupo.ids.map(id=>{const item=data.indicadores.find(i=>i.id===id);return item?<Tarjeta key={id} item={item}/>:null;})}
      </div>
    </div>)}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-oliva-100 p-5 text-xs text-tinta/65">
      <p className="max-w-xl">{data.nota} Consulta: {new Date(data.actualizado).toLocaleDateString("es-AR")}.</p>
      <a href="/observatorio" className="inline-flex items-center gap-1 font-bold text-oliva">Consultar datos completos del INDEC <ArrowUpRight size={16}/></a>
    </div>
  </>}
 </section>;
}
