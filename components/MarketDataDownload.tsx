"use client";
import {useState} from "react";
import {Download,Loader2} from "lucide-react";
import {descargarCSV} from "@/lib/descargarCSV";
type Json={ok:boolean;data?:unknown};
const requests=[
 {url:"/api/dolares",id:"Dólar",tipo:"dolares"},
 {url:"/api/riesgo-pais",id:"Riesgo país",tipo:"riesgo"},
 {url:"/api/indicadores",id:"Indicadores",tipo:"indicadores"},
 {url:"/api/bcra/1",id:"Reservas internacionales",tipo:"bcra"},
 {url:"/api/bcra/30",id:"CER",tipo:"bcra"},
 {url:"/api/bcra/31",id:"UVA",tipo:"bcra"},
];
export default function MarketDataDownload(){
 const [loading,setLoading]=useState(false);
 async function descargar(){
  if(loading)return;
  setLoading(true);
  try {
   const rs=await Promise.allSettled(requests.map(async q=>{
    const r=await fetch(q.url,{cache:"no-store"});const j=await r.json() as Json;
    if(!r.ok||!j.ok)return {q,data:null};
    return {q,data:j.data};
   }));
   const rows:(string|number|null)[][]=[];
   for(const res of rs){
    if(res.status!=="fulfilled"||!res.value.data)continue;
    const {q,data}=res.value;
    if(q.tipo==="dolares"&&Array.isArray(data)){
      for(const d of data as Record<string,unknown>[])
       rows.push(["Dólar "+String(d.nombre||d.casa),typeof d.venta==="number"?d.venta:null,"ARS por USD",String(d.fechaActualizacion||""),"DolarAPI"]);
    }else if(q.tipo==="riesgo"){
      const d=data as {ultimo?:{fecha:string;valor:number}};
      if(d.ultimo)rows.push(["Riesgo país",d.ultimo.valor,"puntos básicos",d.ultimo.fecha,"ArgentinaDatos"]);
    }else if(q.tipo==="indicadores"){
      const d=data as {inflacionMensual?:{valor:number;fecha:string};inflacionInteranual?:{valor:number;fecha:string};plazoFijo?:{promedioTna:number}};
      if(d.inflacionMensual)rows.push(["IPC mensual",d.inflacionMensual.valor,"%",d.inflacionMensual.fecha,"INDEC / ArgentinaDatos"]);
      if(d.inflacionInteranual)rows.push(["IPC interanual",d.inflacionInteranual.valor,"%",d.inflacionInteranual.fecha,"INDEC / ArgentinaDatos"]);
      if(d.plazoFijo)rows.push(["Plazo fijo promedio",d.plazoFijo.promedioTna,"% TNA","","ArgentinaDatos"]);
    }else if(q.tipo==="bcra"){
      const d=data as {nombre:string;unidad:string;ultimo?:{fecha:string;valor:number}};
      if(d.ultimo)rows.push([d.nombre||q.id,d.ultimo.valor,d.unidad||"",d.ultimo.fecha,"BCRA"]);
    }
   }
   if(rows.length)descargarCSV("mercados-indicadores",["indicador","valor","unidad","fecha","fuente"],rows);
  }finally{setLoading(false);}
 }
 return <button type="button" onClick={descargar} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-oliva/50 px-4 py-2 text-xs font-bold text-oliva hover:bg-oliva-100 disabled:opacity-40">
  {loading?<Loader2 size={16} className="animate-spin"/>:<Download size={16}/>} Descargar indicadores (CSV)
 </button>;
}
