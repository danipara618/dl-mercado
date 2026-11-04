"use client";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
type Punto={fecha:string;valor:number};
type Serie={id:string;etiqueta:string;unidad:string;puntos:Punto[]};
type Response={series:Serie[];error?:string};
const isIndice=(s:Serie)=>/índice|indice/i.test(s.etiqueta+" "+s.unidad)&&!/variaci[oó]n|acumulad|interanual|mensual|incidencia/i.test(s.etiqueta);
const fmt=(n:number)=>new Intl.NumberFormat("es-AR",{maximumFractionDigits:1}).format(n);
export default function SalarioRealChart(){
 const [sal,setSal]=useState<Serie[]>([]);
 const [ipc,setIpc]=useState<Serie[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [salId,setSalId]=useState("");
 const [ipcId,setIpcId]=useState("");
 useEffect(()=>{
  let active=true;
  Promise.all(["salarios","ipc"].map(async id=>{
   const r=await fetch("/api/macro/"+id,{cache:"no-store"});
   const d=await r.json() as Response;
   if(!r.ok)throw Error(d.error||"Fuente INDEC no disponible");
   return d.series||[];
  })).then(([s,i])=>{if(active){setSal(s.filter(isIndice));setIpc(i.filter(isIndice));}})
   .catch(e=>{if(active)setError(e instanceof Error?e.message:"Datos no disponibles");})
   .finally(()=>{if(active)setLoading(false)});
  return ()=>{active=false};
 },[]);
 const s=sal.find(v=>v.id===salId)||sal[0];
 const i=ipc.find(v=>v.id===ipcId)||ipc[0];
 const points=useMemo(()=>{
  if(!s||!i)return [];
  const imap=new Map(i.puntos.map(p=>[p.fecha,p.valor]));
  const common=s.puntos.filter(p=>imap.has(p.fecha)&&p.valor>0&&imap.get(p.fecha)!>0).sort((a,b)=>a.fecha.localeCompare(b.fecha));
  if(common.length<2)return [];
  const base=common[0],ipcBase=imap.get(base.fecha)!;
  return common.map(p=>({fecha:p.fecha,valor:(p.valor/base.valor)/(imap.get(p.fecha)!/ipcBase)*100}));
 },[s,i]);
 return <article className="rounded-2xl border border-crema-200 bg-white p-5 shadow-sm sm:p-6">
  <h3 className="font-serif text-xl">Salario real · índice de poder adquisitivo</h3>
  <p className="mt-1 text-xs text-tinta/60">Índice propio con base 100 en el primer período común: (salarios / salarios base) ÷ (IPC / IPC base) × 100.</p>
  {loading&&<p className="mt-6 text-sm text-tinta/60">Consultando índices oficiales...</p>}
  {error&&<p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}
  {!loading&&!error&&s&&i&&<>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
     <label className="text-xs font-semibold">Índice de salarios
      <select value={s.id} onChange={e=>setSalId(e.target.value)} className="mt-1 w-full rounded-lg border border-crema-200 p-2 text-xs">
       {sal.map(x=><option key={x.id} value={x.id}>{x.etiqueta}</option>)}
      </select>
     </label>
     <label className="text-xs font-semibold">IPC
      <select value={i.id} onChange={e=>setIpcId(e.target.value)} className="mt-1 w-full rounded-lg border border-crema-200 p-2 text-xs">
       {ipc.map(x=><option key={x.id} value={x.id}>{x.etiqueta}</option>)}
      </select>
     </label>
    </div>
    {points.length>=2?<><p className="mt-4 font-mono text-2xl">{fmt(points.at(-1)!.valor)} <span className="text-xs font-sans text-tinta/55">base 100 · {points.at(-1)!.fecha}</span></p>
    <div className="mt-3 h-64 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={points}>
      <CartesianGrid stroke="#E7DECD" vertical={false}/>
      <XAxis dataKey="fecha" minTickGap={40} tick={{fontSize:10}}/>
      <YAxis tick={{fontSize:10}} width={50}/>
      <Tooltip formatter={(v:number)=>[fmt(v),"Índice real"]}/>
      <Line dataKey="valor" type="monotone" stroke="#2C3A22" dot={false} strokeWidth={2.5} isAnimationActive={false}/>
    </LineChart></ResponsiveContainer></div></>:
    <p className="mt-5 rounded-xl bg-crema-50 p-4 text-sm text-tinta/60">No hay dos fechas comunes de índices compatibles. El gráfico no se construye a partir de tasas de variación.</p>}
  </>}
  {!loading&&!error&&(!s||!i)&&<p className="mt-5 rounded-xl bg-crema-50 p-4 text-sm text-tinta/60">Se necesitan los niveles de los índices de salarios e IPC oficiales. No se utilizan tasas como sustitutos.</p>}
  <p className="mt-4 text-xs text-tinta/45">Elaboración DL Mercado sobre datos INDEC; depende de la cobertura, base y revisiones de ambas series.</p>
 </article>;
}
