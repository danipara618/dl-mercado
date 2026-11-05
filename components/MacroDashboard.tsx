"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowUpRight,ChartNoAxesCombined,Download,Info} from "lucide-react";
import {CartesianGrid,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import {descargarCSV} from "@/lib/descargarCSV";
type Punto={fecha:string;valor:number};
type Indicador={id:string;titulo:string;subtitulo:string;unidad:string;fuente:string;puntos:Punto[];estado:"ok"|"sin_datos";aviso?:string};
type Respuesta={indicadores:Indicador[];actualizado:string;nota:string};
type Poblacion={puntos:Punto[];fuente:string;unidad:string;cobertura:string;aviso?:string};

const categorias=[
 {id:"precios",titulo:"Precios",sub:"Inflación general, alimentos y canastas básicas de referencia.",ids:["ipc","ipc-anual","ipc-alimentos","cba","canasta"]},
 {id:"actividad",titulo:"Actividad",sub:"Actividad económica y producción industrial.",ids:["emae","industria"]},
 {id:"trabajo",titulo:"Trabajo",sub:"Desocupación trimestral y pobreza semestral, según la EPH.",ids:["empleo","pobreza"]},
 {id:"poblacion",titulo:"Población",sub:"Proyecciones del total de habitantes, con base en el Censo 2022.",ids:["poblacion"]},
 {id:"comercio",titulo:"Comercio",sub:"Exportaciones, importaciones y fuentes detalladas.",ids:["expo","impo"]},
];
const formato=(v:number,unidad:string)=>new Intl.NumberFormat("es-AR",{maximumFractionDigits:unidad==="ARS"||unidad==="personas"?0:1}).format(v);
function Grafico({item}:{item:Indicador}){
 const points=item.puntos||[];
 const ultimo=points.at(-1),previo=points.at(-2);
 const cambio=ultimo&&previo&&previo.valor!==0&&item.unidad!=="%"?(ultimo.valor/previo.valor-1)*100:null;
 const fileRows=points.map(p=>[p.fecha,p.valor,item.unidad,item.fuente,item.subtitulo]);
 return <article id={item.id} className="min-w-0 rounded-2xl border border-crema-200 bg-white p-5 shadow-sm sm:p-6">
  <div className="flex items-start justify-between gap-3">
   <div><h4 className="font-serif text-xl leading-snug">{item.titulo}</h4><p className="mt-1 text-xs leading-relaxed text-tinta/60">{item.subtitulo}</p></div>
   <button type="button" disabled={!points.length} title={"Descargar "+item.titulo+" en CSV"} aria-label={"Descargar "+item.titulo+" en CSV"}
    onClick={()=>descargarCSV("dl-mercado-"+item.id,["periodo","valor","unidad","fuente","serie"],fileRows)}
    className="shrink-0 rounded-full border border-oliva/40 p-2 text-oliva transition hover:bg-oliva-100 disabled:opacity-30"><Download size={17}/></button>
  </div>
  {ultimo && item.estado==="ok"?<>
   <div className="mt-5 flex flex-wrap items-end justify-between gap-2">
    <div>
     <p className="font-mono text-3xl font-semibold tabular-nums">{item.unidad==="ARS"?"$ ":""}{formato(ultimo.valor,item.unidad)}{item.unidad!=="ARS"&&<span className="ml-1 text-sm text-tinta/55">{item.unidad}</span>}</p>
     <p className="mt-1 text-xs text-tinta/50">Último período: {ultimo.fecha}</p>
    </div>
    {cambio!==null&&<p className="text-xs text-tinta/60">Variación entre los últimos registros: {cambio>=0?"+":""}{formato(cambio,"%")}%</p>}
   </div>
   <div className="mt-5 h-56 w-full" role="img" aria-label={"Evolución de "+item.titulo}>
    <ResponsiveContainer width="100%" height="100%">
     <LineChart data={points} margin={{top:10,right:10,left:0,bottom:0}}>
      <CartesianGrid stroke="#E7DECD" vertical={false}/>
      <XAxis dataKey="fecha" minTickGap={36} tick={{fontSize:10}}/>
      <YAxis width={56} tick={{fontSize:10}} tickFormatter={(v:number)=>new Intl.NumberFormat("es-AR",{notation:"compact",maximumFractionDigits:1}).format(v)}/>
      <Tooltip labelFormatter={v=>"Período: "+String(v)} formatter={(v:number)=>[formato(v,item.unidad)+(item.unidad==="%"?"%":item.unidad==="ARS"?" pesos":" "+item.unidad),item.titulo]}/>
      <Line type="monotone" dataKey="valor" stroke="#2C3A22" strokeWidth={2.5} dot={false} isAnimationActive={false}/>
     </LineChart>
    </ResponsiveContainer>
   </div>
  </>:<div className="mt-5 flex min-h-44 items-center justify-center rounded-xl bg-crema-50 px-6 text-center text-sm text-tinta/55">
   {item.aviso||"Este indicador está pendiente de verificación de sus datos oficiales."}
  </div>}
  <p className="mt-4 border-t border-crema-200 pt-3 text-xs text-tinta/50">Fuente: {item.fuente}. {points.length?"CSV con "+points.length+" observaciones.":""}</p>
 </article>;
}
export default function MacroDashboard(){
 const [data,setData]=useState<Respuesta|null>(null);
 const [poblacion,setPoblacion]=useState<Indicador|null>(null);
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{
  let activo=true;
  Promise.allSettled([
   fetch("/api/macro-resumen").then(async r=>{if(!r.ok)throw Error("No se pudo consultar INDEC.");return await r.json() as Respuesta;}),
   fetch("/api/economia/poblacion").then(async r=>{if(!r.ok)throw Error("No se pudo consultar población.");return await r.json() as Poblacion;})
  ]).then(([m,p])=>{
   if(!activo)return;
   if(m.status==="fulfilled")setData(m.value);
   else setError(m.reason instanceof Error?m.reason.message:"No se pudo consultar el tablero");
   if(p.status==="fulfilled"&&p.value.puntos.length>=2)setPoblacion({
    id:"poblacion",titulo:"Habitantes de Argentina",subtitulo:p.value.cobertura,fuente:p.value.fuente,unidad:"personas",puntos:p.value.puntos,estado:"ok"
   });
  }).finally(()=>{if(activo)setLoading(false)});
  return ()=>{activo=false};
 },[]);
 const indicadores=[...(data?.indicadores||[]),...(poblacion?[poblacion]:[])];
 return <section className="space-y-10">
  <div className="rounded-3xl border border-crema-200 bg-white p-6 sm:p-8">
   <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-oliva"><ChartNoAxesCombined size={17}/> INDEC · Datos trabajados</p>
   <h2 className="mt-2 font-serif text-3xl">Argentina en datos</h2>
   <p className="mt-3 max-w-3xl text-sm leading-relaxed text-tinta/65">Seleccionamos cada serie para que puedas ver el último dato, su tendencia histórica y descargarla sin configurar parámetros técnicos.</p>
   <nav aria-label="Áreas económicas" className="mt-6 flex flex-wrap gap-2">
    {categorias.map(c=><a key={c.id} href={"#"+c.id} className="rounded-full border border-oliva/40 px-4 py-2 text-sm font-semibold text-oliva transition hover:bg-oliva-100">{c.titulo}</a>)}
   </nav>
  </div>
  {loading&&<div className="grid gap-4 sm:grid-cols-2">{[0,1,2,3].map(n=><div key={n} className="h-72 animate-pulse rounded-2xl bg-white/60"/>)}</div>}
  {error&&<div role="status" className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-900">{error}</div>}
  {!loading&&categorias.map(c=>{
   const rows=c.ids.map(id=>indicadores.find(v=>v.id===id)).filter((item):item is Indicador=>!!item&&item.estado==="ok"&&item.puntos.length>=2);
   return <section key={c.id} id={c.id} className="scroll-mt-20 space-y-4">
    <div><h3 className="font-serif text-3xl">{c.titulo}</h3><p className="mt-2 text-sm text-tinta/60">{c.sub}</p></div>
    {rows.length?<div className="grid gap-5 lg:grid-cols-2">{rows.map(item=><Grafico key={item.id} item={item}/>)}</div>
     :<div className="rounded-2xl border border-crema-200 bg-crema-50 p-6 text-sm text-tinta/60">
       {c.id==="comercio"?"Las exportaciones e importaciones están disponibles desagregadas en la API del INDEC. Antes de mostrar totales debemos verificar que la cobertura mensual esté completa. Podés explorar y descargar esos registros oficiales desde Datos y descargas.":"Las series automáticas de esta área están pendientes de validación. No mostramos cifras incompletas ni estimadas."}
       <Link href="/observatorio" className="mt-3 inline-flex items-center gap-1 font-bold text-oliva">Abrir explorador INDEC <ArrowUpRight size={15}/></Link>
      </div>}
   </section>;
  })}
  {data&&<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-oliva-100 p-5 text-xs leading-relaxed text-tinta/65">
   <p className="max-w-2xl">Fuente: INDEC. Actualizado al consultar el sitio: {new Date(data.actualizado).toLocaleDateString("es-AR")}. Las series estadísticas tienen sus propias fechas de publicación y pueden revisarse.</p>
   <Link href="/datos" className="inline-flex items-center gap-2 font-bold text-oliva">Datos originales y descargas <ArrowUpRight size={15}/></Link>
  </div>}
 </section>;
}
