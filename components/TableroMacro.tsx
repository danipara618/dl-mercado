"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChartNoAxesCombined, Download, ExternalLink } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import SalarioRealChart from "@/components/SalarioRealChart";
import { MACRO_INDICADORES, MACRO_TABS, type MacroTab, type MacroIndicador } from "@/lib/macroDefiniciones";

type Punto={fecha:string;valor:number};
type Serie={id:string;etiqueta:string;unidad:string;puntos:Punto[]};
type MacroResponse={series:Serie[];fuente:string;parcial?:boolean;registros?:number;error?:string};
type BcraResponse={ok:boolean;data?:{serie:Punto[];unidad?:string};error?:string};
const num=(n:number)=>new Intl.NumberFormat("es-AR",{maximumFractionDigits:2}).format(n);
function csv(data:Punto[],slug:string){
 const body="fecha;valor\n"+data.map(p=>p.fecha+";"+p.valor).join("\n");
 const href=URL.createObjectURL(new Blob(["\uFEFF"+body],{type:"text/csv;charset=utf-8"}));
 const a=document.createElement("a");a.href=href;a.download=slug+".csv";a.click();URL.revokeObjectURL(href);
}
function MacroCard({cfg}:{cfg:MacroIndicador}){
 const [response,setResponse]=useState<MacroResponse|null>(null);
 const [selected,setSelected]=useState("");
 const [period,setPeriod]=useState("60");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{
   let active=true;
   setLoading(true);setError("");setResponse(null);setSelected("");
   const endpoint=cfg.fuente==="indec"||cfg.fuente==="bm"?"/api/macro/"+cfg.id:cfg.ruta!+(cfg.fuente==="bcra"?"?desde="+new Date(Date.now()-6*365*86400000).toISOString().slice(0,10):"");
   fetch(endpoint,{cache:"no-store"}).then(async(r)=>{
     const json=await r.json() as MacroResponse&BcraResponse;
     if(!r.ok) throw Error(json.error||"Fuente no disponible");
     if(cfg.fuente==="bcra"){
       if(!json.ok||!json.data)throw Error(json.error||"Serie BCRA no disponible");
       return {fuente:"BCRA",series:[{id:cfg.id,etiqueta:cfg.titulo,unidad:json.data.unidad||"",puntos:json.data.serie||[]}]};
     }
     if(cfg.fuente==="mercado"){
       const values=json.ok&&Array.isArray(json.data)?json.data as unknown as Punto[]:[];
       return {fuente:"ArgentinaDatos — EMBI",series:[{id:cfg.id,etiqueta:cfg.titulo,unidad:"pb",puntos:values}]};
     }
     return json;
   }).then(v=>{if(active)setResponse(v as MacroResponse)}).catch(e=>{if(active)setError(e instanceof Error?e.message:"No disponible")})
   .finally(()=>{if(active)setLoading(false)});
   return ()=>{active=false};
 },[cfg.id,cfg.fuente,cfg.ruta,cfg.titulo]);
 const serie=response?.series.find(s=>s.id===selected)||response?.series[0];
 const points=useMemo(()=>{
   const p=serie?.puntos||[];
   const n=Number(period);
   return n?p.slice(-n):p;
 },[serie,period]);
 const last=points.at(-1);
 return <article id={cfg.id} className="min-w-0 scroll-mt-24 rounded-2xl border border-crema-200 bg-white p-5 shadow-sm sm:p-6">
   <div className="flex items-start justify-between gap-3">
     <div><h3 className="font-serif text-xl text-tinta">{cfg.titulo}</h3><p className="mt-1 text-xs leading-relaxed text-tinta/60">{cfg.descripcion}</p></div>
     <button aria-label={"Descargar "+cfg.titulo} title="Descargar CSV" type="button" disabled={!points.length} onClick={()=>csv(points,cfg.id)} className="rounded-full border border-crema-200 p-2 text-oliva disabled:opacity-30"><Download size={16}/></button>
   </div>
   {loading&&<div className="mt-5 grid h-64 place-items-center rounded-xl bg-crema-50 text-sm text-tinta/50">Consultando fuente...</div>}
   {error&&!loading&&<p role="status" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Dato no disponible: {error}</p>}
   {!loading&&!error&&<>
     {response?.series.length ? <>
       {response.series.length>1&&<label className="mt-4 block text-xs font-bold text-tinta/60">Serie y desagregación
        <select value={serie?.id||""} onChange={e=>setSelected(e.target.value)} className="mt-1 block w-full rounded-lg border border-crema-200 bg-crema-50 px-2 py-2 text-xs text-tinta">
         {response.series.map(s=><option key={s.id} value={s.id}>{s.etiqueta}</option>)}
        </select>
       </label>}
       <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
         <div><p className="text-xs text-tinta/50">Último dato en la serie</p><p className="mt-1 font-mono text-2xl tabular-nums">{last?num(last.valor):"—"} <span className="text-xs font-sans text-tinta/60">{serie?.unidad}</span></p><p className="text-xs text-tinta/50">{last?.fecha||"Sin períodos"}</p></div>
         <div role="group" aria-label="Rango de observaciones" className="flex gap-1">{[["12","12"],["60","60"],["0","Todo"]].map(([id,t])=><button key={id} type="button" onClick={()=>setPeriod(id)} aria-pressed={period===id} className={`rounded-md border px-2 py-1 text-xs ${period===id?"bg-oliva text-white":"border-crema-200"}`}>{t}</button>)}</div>
       </div>
       <div className="mt-4 h-64 w-full">
         {points.length>1?<ResponsiveContainer width="100%" height="100%"><LineChart data={points} margin={{top:8,right:14,left:-18,bottom:0}}>
            <CartesianGrid stroke="#E7DECD" vertical={false}/><XAxis dataKey="fecha" minTickGap={45} tick={{fontSize:10}}/>
            <YAxis tick={{fontSize:10}} width={70} tickFormatter={(n:number)=>new Intl.NumberFormat("es-AR",{notation:"compact",maximumFractionDigits:1}).format(n)}/>
            <Tooltip formatter={(v:number)=>[num(v),serie?.unidad||"Valor"]}/>
            <Line dataKey="valor" stroke="#2C3A22" strokeWidth={2} dot={false} type="monotone" isAnimationActive={false}/>
          </LineChart></ResponsiveContainer>:<p className="grid h-full place-items-center text-sm text-tinta/55">La fuente no ofrece suficientes observaciones comparables.</p>}
       </div>
       <p className="mt-3 text-xs text-tinta/50">{response?.fuente} · {serie?.etiqueta}</p>
       {response?.parcial&&<p className="mt-1 text-xs text-amber-800">Vista parcial del histórico: el catálogo puede contener más registros que los consultados.</p>}
     </>:<p className="mt-5 rounded-xl bg-crema-50 p-4 text-sm text-tinta/60">Sin una serie temporal homogénea verificable para graficar. No se muestran valores supuestos.</p>}
   </>}
   {cfg.nota&&<p className="mt-3 text-xs text-tinta/50">{cfg.nota}</p>}
 </article>;
}
export default function TableroMacro(){
 const [tab,setTab]=useState<MacroTab>("Precios");
 const data=MACRO_INDICADORES.filter(x=>x.tab===tab);
 return <div className="space-y-7">
   <section className="rounded-3xl border border-crema-200 bg-white p-6 shadow-sm sm:p-9">
     <div className="flex items-start gap-3"><span className="rounded-xl bg-oliva-100 p-3 text-oliva"><ChartNoAxesCombined size={25}/></span>
     <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-oliva">DL Mercado · Observatorio económico</p>
       <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Tablero Macro</h2>
       <p className="mt-2 max-w-3xl text-sm leading-relaxed text-tinta/65">Inflación, canastas, EMAE, industria, empleo, salarios, comercio exterior, pobreza y PIB por habitante. Visualizaciones con fuente y período de referencia, sin calculadoras.</p>
     </div></div>
     <div role="tablist" aria-label="Temas macroeconómicos" className="mt-7 flex flex-wrap gap-2">
       {MACRO_TABS.map(t=><button role="tab" aria-selected={tab===t} key={t} type="button" onClick={()=>setTab(t)}
         className={`rounded-full border px-4 py-2 text-sm font-semibold ${tab===t?"border-oliva bg-oliva text-white":"border-crema-200 bg-crema-50 text-tinta hover:border-oliva"}`}>{t}</button>)}
     </div>
   </section>
   <section role="tabpanel" aria-label={tab}>
     <div className="grid gap-5 lg:grid-cols-2">{tab==="Trabajo e ingresos"&&<SalarioRealChart/>}{data.map(cfg=><MacroCard key={cfg.id} cfg={cfg}/>)}</div>
   </section>
   <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-oliva-100 p-5">
     <p className="max-w-xl text-sm text-tinta/70">¿Querés comparar poder adquisitivo, inflación acumulada o canastas en términos reales? Esas operaciones están separadas del tablero.</p>
     <Link href="/calculadoras" className="rounded-full bg-oliva px-5 py-2.5 text-sm font-bold text-white">Ir a Calculadoras</Link>
   </div>
   <p className="text-xs text-tinta/55">Fuentes: INDEC — Catálogo API-INDEC; Banco Mundial (WDI); BCRA; ArgentinaDatos. Publicación independiente, sin vinculación institucional con las fuentes. Las series se ofrecen con las aperturas disponibles; no se calculan agregados incompatibles.</p>
 </div>;
}
