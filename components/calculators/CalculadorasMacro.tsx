"use client";
import { useEffect, useMemo, useState } from "react";
import { MACRO_INDICADORES } from "@/lib/macroDefiniciones";
type Punto={fecha:string;valor:number};
type Serie={id:string;etiqueta:string;unidad:string;puntos:Punto[]};
type Payload={series:Serie[];error?:string};
type Tipo="salario"|"inflacion"|"cbt"|"regiones"|"difusion";
type Item={id:Tipo;titulo:string;descripcion:string};
const ITEMS:Item[]=[
 {id:"salario",titulo:"Salario real y poder adquisitivo",descripcion:"Variación del índice de salarios respecto al índice de precios al consumidor."},
 {id:"inflacion",titulo:"Inflación acumulada",descripcion:"Cambio entre dos períodos del IPC en nivel de índice."},
 {id:"cbt",titulo:"Variación real de la CBT",descripcion:"Variación del costo de la canasta básica total descontando el IPC."},
 {id:"regiones",titulo:"Brecha de inflación entre regiones",descripcion:"Comparación de la variación del IPC de dos regiones en un mismo período."},
 {id:"difusion",titulo:"Difusión de aumentos de precios",descripcion:"Porcentaje de divisiones del IPC con aumentos mensuales en una región."},
];
const fmt=(n:number)=>new Intl.NumberFormat("es-AR",{maximumFractionDigits:2}).format(n);
const isNivel=(s:Serie)=>/índice|indice|nivel/i.test(s.etiqueta+" "+s.unidad)&&!/variaci[oó]n|acumulad|interanual|mensual|incidencia/i.test(s.etiqueta);
const indexSeries=(ss:Serie[])=>ss.filter(isNivel);
function mesesComun(a:Serie,b:Serie){const bmap=new Map(b.puntos.map(p=>[p.fecha,p.valor]));return a.puntos.filter(p=>bmap.has(p.fecha)).map(p=>p.fecha).sort();}
function val(s:Serie,f:string){return s.puntos.find(x=>x.fecha===f)?.valor;}
function ratio(a0:number,a1:number,b0:number,b1:number){
 if([a0,a1,b0,b1].some(n=>!Number.isFinite(n)||n<=0))return null;
 return ((a1/a0)/(b1/b0)-1)*100;
}
function Options({series,selected,onChange}:{series:Serie[];selected:string;onChange:(x:string)=>void}){
 return <select className="w-full rounded-lg border border-crema-200 bg-white px-3 py-2 text-xs" value={selected} onChange={e=>onChange(e.target.value)}>
  {series.map(s=><option key={s.id} value={s.id}>{s.etiqueta.slice(0,180)}</option>)}
 </select>;
}
export default function CalculadorasMacro(){
 const [mode,setMode]=useState<Tipo>("salario");
 const [data,setData]=useState<Record<string,Serie[]>>({});
 const [errors,setErrors]=useState<Record<string,string>>({});
 const [first,setFirst]=useState("");
 const [second,setSecond]=useState("");
 const [start,setStart]=useState("");
 const [end,setEnd]=useState("");
 useEffect(()=>{
  let active=true;
  for(const id of ["ipc","salarios","canastas"]){
   fetch("/api/macro/"+id,{cache:"no-store"}).then(async r=>{const d=await r.json() as Payload;if(!r.ok)throw Error(d.error||"Fuente no disponible");return d;})
    .then(d=>{if(active)setData(old=>({...old,[id]:d.series||[]}))})
    .catch(e=>{if(active)setErrors(old=>({...old,[id]:e instanceof Error?e.message:"Error"}))});
  }
  return ()=>{active=false};
 },[]);
 const ipc=indexSeries(data.ipc||[]);
 const sal=indexSeries(data.salarios||[]);
 const cbt=(data.canastas||[]).filter(s=>/canasta b[aá]sica total|\bcbt\b/i.test(s.etiqueta)&&!/variaci[oó]n|porcentaje/i.test(s.etiqueta));
 const baseList=mode==="salario"?sal:mode==="cbt"?cbt:ipc;
 const compList=ipc;
 const base=baseList.find(x=>x.id===first)||baseList[0];
 const comp=compList.find(x=>x.id===second)||compList[mode==="regiones"?1:0]||compList[0];
 const dates=useMemo(()=>base&&comp?mesesComun(base,comp):[],[base,comp]);
 const desde=dates.includes(start)?start:dates[0]||"";
 const hasta=dates.includes(end)&&end>=desde?end:dates.at(-1)||"";
 const result=useMemo(()=>{
  if(!base||!comp||!desde||!hasta||hasta<=desde)return null;
  const a0=val(base,desde),a1=val(base,hasta),b0=val(comp,desde),b1=val(comp,hasta);
  if([a0,a1,b0,b1].some(v=>v==null))return null;
  if(mode==="inflacion") return a0!>0?((a1!/a0!)-1)*100:null;
  if(mode==="salario"||mode==="cbt")return ratio(a0!,a1!,b0!,b1!);
  if(mode==="regiones"){
   if(base.id===comp.id)return null;
   // Los dos índices deben corresponder a la misma división y tipo de cálculo.
   const clear=(s:string)=>s.replace(/regi[oó]n:\s*[^·]+/ig,"región").replace(/\s+/g," ").trim();
   if(clear(base.etiqueta)!==clear(comp.etiqueta))return null;
   if(a0!<=0||b0!<=0)return null;
   return ((a1!/a0!)-(b1!/b0!))*100;
  }
  return null;
 },[base,comp,desde,hasta,mode]);
 const diffusion=useMemo(()=>{
  if(mode!=="difusion")return null;
  const divisions=(data.ipc||[]).filter(s=>isNivel(s)&&/divisi[oó]n\s*:/i.test(s.etiqueta)&&!(/nivel general/i.test(s.etiqueta)));
  const groups=new Map<string,Serie[]>();
  for(const s of divisions){const region=s.etiqueta.match(/regi[oó]n:\s*([^·]+)/i)?.[1]?.trim()||"sin región";const v=groups.get(region)||[];v.push(s);groups.set(region,v);}
  // Utilizar sólo divisiones homogéneas; elegir la región con más divisiones y período compartido.
  const best=[...groups.entries()].sort((a,b)=>b[1].length-a[1].length)[0];
  if(!best||best[1].length<3)return null;
  const periods=best[1][0].puntos.map(p=>p.fecha).filter(f=>best[1].every(s=>s.puntos.some(q=>q.fecha===f))).sort();
  if(periods.length<2)return null;
  const cur=periods.at(-1)!,prev=periods.at(-2)!;
  const changes=best[1].map(s=>{const a=val(s,prev),b=val(s,cur);return a!=null&&b!=null&&a>0?{label:s.etiqueta,delta:(b/a-1)*100}:null}).filter((v):v is {label:string;delta:number}=>v!==null);
  if(changes.length<3)return null;
  const positive=changes.filter(s=>s.delta>0).length;
  return {positive,total:changes.length,percentage:(positive/changes.length)*100,region:best[0],period:cur};
 },[data.ipc,mode]);
 function selectMode(next:Tipo){setMode(next);setFirst("");setSecond("");setStart("");setEnd("");}
 const cfg=ITEMS.find(x=>x.id===mode)!;
 const needed=mode==="salario"?["salarios","ipc"]:mode==="cbt"?["canastas","ipc"]:["ipc"];
 const issues=needed.filter(k=>errors[k]).map(k=>k+": "+errors[k]);
 return <div className="space-y-6">
   <section className="rounded-3xl border border-crema-200 bg-white p-6 sm:p-8">
    <p className="text-xs font-bold uppercase tracking-[.18em] text-oliva">Economía aplicada</p>
    <h2 className="mt-2 font-serif text-3xl">Calculadoras de precios e ingresos</h2>
    <p className="mt-2 text-sm text-tinta/65">Resultados derivados de índices compatibles. Sin interpolaciones ni sustituciones de datos faltantes.</p>
    <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
     {ITEMS.map(i=><button type="button" key={i.id} onClick={()=>selectMode(i.id)} className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold ${mode===i.id?"border-oliva bg-oliva-100 text-oliva":"border-crema-200 bg-crema-50"}`}>{i.titulo}</button>)}
    </div>
   </section>
   <section className="rounded-3xl border border-crema-200 bg-white p-6 sm:p-8">
     <h3 className="font-serif text-2xl">{cfg.titulo}</h3>
     <p className="mt-1 text-sm text-tinta/60">{cfg.descripcion}</p>
     {issues.length>0&&<p role="status" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Datos no disponibles: {issues.join(" · ")}</p>}
     {mode==="difusion"?<div className="mt-7 rounded-2xl bg-oliva-100 p-6">
      {diffusion?<><p className="text-sm text-tinta/70">Divisiones con incremento en {diffusion.region} · {diffusion.period}</p>
       <p className="mt-2 font-serif text-4xl">{fmt(diffusion.percentage)}%</p>
       <p className="mt-3 text-sm text-tinta/70">{diffusion.positive} de {diffusion.total} divisiones disponibles presentaron aumentos; difusión calculada sobre el subconjunto de divisiones consultadas.</p></>:
       <p className="text-sm text-tinta/70">No hay suficientes divisiones comparables del IPC para calcular una tasa de difusión válida. Es necesario cargar un conjunto completo de divisiones de una misma región y dos meses consecutivos.</p>}
     </div>:<>
      {base&&comp?<div className="mt-6 grid gap-4 sm:grid-cols-2">
       <label className="text-xs font-bold text-tinta/70">{mode==="salario"?"Índice salarial":mode==="cbt"?"CBT":mode==="regiones"?"Región A":"IPC índice (nivel)"}<div className="mt-2"><Options series={baseList} selected={base.id} onChange={setFirst}/></div></label>
       {mode!=="inflacion"&&<label className="text-xs font-bold text-tinta/70">{mode==="regiones"?"Región B":"IPC índice (nivel)"}<div className="mt-2"><Options series={compList} selected={comp.id} onChange={setSecond}/></div></label>}
       <label className="text-xs font-bold text-tinta/70">Desde
        <select value={desde} onChange={e=>setStart(e.target.value)} className="mt-2 w-full rounded-lg border border-crema-200 bg-white px-3 py-2 text-sm">{dates.map(d=><option key={d} value={d}>{d}</option>)}</select>
       </label>
       <label className="text-xs font-bold text-tinta/70">Hasta
        <select value={hasta} onChange={e=>setEnd(e.target.value)} className="mt-2 w-full rounded-lg border border-crema-200 bg-white px-3 py-2 text-sm">{dates.filter(d=>d>=desde).map(d=><option key={d} value={d}>{d}</option>)}</select>
       </label>
      </div>:<p className="mt-5 rounded-xl bg-crema-50 p-5 text-sm text-tinta/60">Faltan índices de nivel identificables y homogéneos para este cálculo. Revisá la disponibilidad del servicio del INDEC.</p>}
      <div aria-live="polite" className="mt-6 rounded-2xl bg-oliva p-6 text-white">
       <p className="text-xs uppercase tracking-wider text-white/70">Resultado {mode==="regiones"?"· puntos porcentuales":"· variación %"}</p>
       <p className="mt-2 font-serif text-4xl">{result===null?"Sin cálculo válido":`${result>=0?"+":""}${fmt(result)}${mode==="regiones"?" pp":"%"}`}</p>
       <p className="mt-3 text-sm text-white/75">{mode==="salario"?"Se compara la variación del índice salarial con el IPC: (salario final/salario inicial) / (IPC final/IPC inicial) - 1.":mode==="cbt"?"Se compara la variación nominal de la CBT con el IPC, en fechas comunes.":mode==="inflacion"?"Se obtiene del cociente entre niveles del índice IPC, no sumando porcentajes.":"Se resta la variación acumulada de la región B a la de la región A; deben ser índices equivalentes."}</p>
      </div>
     </>}
     <p className="mt-5 text-xs leading-relaxed text-tinta/50">Fuente: INDEC · API-INDEC. Se requiere consultar niveles de índice compatibles y con fechas comunes. Las tasas interanuales, intermensuales y los índices de nivel no son intercambiables. Si la API no devuelve esos niveles o datos suficientes, el resultado se oculta.</p>
   </section>
 </div>;
}
