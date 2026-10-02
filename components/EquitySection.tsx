"use client";
import{useMemo,useState}from"react";
import{CartesianGrid,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis}from"recharts";
import SectionTitle from"./SectionTitle";
import DataTable,{type Column}from"./DataTable";
import Change from"./Change";
import{useApi}from"@/lib/useApi";
import{fmtCompact,fmtNum}from"@/lib/format";
import type{Cotizacion}from"@/lib/types";

const LIDER=new Set("ALUA BBAR BMA BYMA CEPU COME CRES EDN GGAL IRSA LOMA METR PAMP SUPV TECO2 TGNO4 TGSU2 TRAN TXAR VALO YPFD".split(" "));
const MAG7=new Set("AAPL AMZN GOOGL GOOG META MSFT NVDA TSLA".split(" "));
const sectores:Record<string,string>={ALUA:"Materiales",TXAR:"Materiales",BBAR:"Financiero",BMA:"Financiero",GGAL:"Financiero",SUPV:"Financiero",VALO:"Financiero",BYMA:"Financiero",CEPU:"Energía",PAMP:"Energía",YPFD:"Energía",TGNO4:"Energía",TGSU2:"Energía",TRAN:"Energía",EDN:"Utilities",METR:"Utilities",IRSA:"Real Estate",CRES:"Agro / Real Estate",LOMA:"Construcción",TECO2:"Telecom",COME:"Holding",AAPL:"Tecnología",MSFT:"Tecnología",NVDA:"Tecnología",GOOGL:"Tecnología",GOOG:"Tecnología",META:"Tecnología",AMZN:"Consumo",TSLA:"Automotriz",SPY:"ETF",QQQ:"ETF"};
const P=[{id:"arg_stocks",label:"Acciones"},{id:"arg_cedears",label:"CEDEARs"},{id:"arg_corp",label:"ONs"}]as const;
const cols:Column<Cotizacion>[]=[
{key:"s",header:"Especie",render:r=><span className="font-semibold">{r.symbol}</span>,sortValue:r=>r.symbol},
{key:"sector",header:"Sector",render:r=><span className="text-xs text-tinta/60">{sectores[r.symbol]??"Otros"}</span>,sortValue:r=>sectores[r.symbol]??"Otros"},
{key:"p",header:"Último",align:"right",render:r=><span className="font-mono tabular">{fmtNum(r.last,2)}</span>,sortValue:r=>r.last},
{key:"v",header:"Var. %",align:"right",render:r=><Change valor={r.pctChange}/>,sortValue:r=>r.pctChange},
{key:"vol",header:"Volumen",align:"right",render:r=><span className="font-mono tabular">{fmtCompact(r.volume)}</span>,sortValue:r=>r.volume}
];

type Hist={symbol:string;currency:string|null;serie:{fecha:string;valor:number|null}[]};

function AssetDetail({row,market,onClose}:{row:Cotizacion;market:string;onClose:()=>void}){
 const[rango,setRango]=useState("6m");
 const{data,error,loading}=useApi<Hist>(`/api/history?symbol=${encodeURIComponent(row.symbol)}&market=${market}&range=${rango}`,0);
 const serie=(data?.serie??[]).filter((x):x is {fecha:string;valor:number}=>x.valor!==null);
 return <div className="mb-5 rounded-2xl border border-crema-200 bg-white p-5 shadow-sm">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-oliva">Detalle del activo</p><h3 className="mt-1 font-serif text-2xl">{row.symbol}</h3><p className="text-sm text-tinta/55">{sectores[row.symbol]??"Otros"} · Último {fmtNum(row.last,2)} · <Change valor={row.pctChange}/></p></div>
    <button onClick={onClose} className="rounded-full border border-crema-200 px-3 py-1 text-xs font-bold text-tinta/60">Cerrar</button>
   </div>
   <div className="mt-4 flex flex-wrap gap-2">{["1m","6m","1y","5y"].map(x=><button key={x} onClick={()=>setRango(x)} className={`rounded-full border px-3 py-1 text-xs font-bold ${rango===x?"border-oliva bg-oliva text-white":"border-oliva/30 text-oliva"}`}>{x}</button>)}</div>
   <div className="mt-4 h-72">
    {loading?<div className="grid h-full place-items-center text-sm text-tinta/45">Cargando serie…</div>:error||!serie.length?<div className="grid h-full place-items-center text-center text-sm text-tinta/45">No hay serie disponible para este activo en la fuente histórica.</div>:
    <ResponsiveContainer width="100%" height="100%"><LineChart data={serie} margin={{top:10,right:12,left:0,bottom:0}}><CartesianGrid vertical={false} strokeOpacity={.12}/><XAxis dataKey="fecha" minTickGap={38} tick={{fontSize:11}}/><YAxis width={62} tick={{fontSize:11}} domain={["auto","auto"]} tickFormatter={(v:number)=>fmtNum(v,0)}/><Tooltip formatter={(v:number)=>[fmtNum(v,2),"Precio"]}/><Line type="monotone" dataKey="valor" stroke="#2C3A22" strokeWidth={2.2} dot={false} activeDot={{r:4}}/></LineChart></ResponsiveContainer>}
   </div>
   <p className="mt-3 text-xs text-tinta/45">Serie histórica orientativa vía Yahoo Finance. Para acciones y CEDEARs se consulta el símbolo local .BA cuando está disponible.</p>
 </div>
}

function Movers({rows}:{rows:Cotizacion[]}){const valid=rows.filter(r=>r.pctChange!=null);if(!valid.length)return null;const best=[...valid].sort((a,b)=>(b.pctChange??0)-(a.pctChange??0)).slice(0,3),worst=[...valid].sort((a,b)=>(a.pctChange??0)-(b.pctChange??0)).slice(0,3);return <div className="mb-5 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-white p-4 shadow-sm"><b className="text-sm">Mejores del día</b>{best.map(x=><div key={x.symbol} className="mt-2 flex justify-between text-sm"><span>{x.symbol}</span><Change valor={x.pctChange}/></div>)}</div><div className="rounded-2xl bg-white p-4 shadow-sm"><b className="text-sm">Peores del día</b>{worst.map(x=><div key={x.symbol} className="mt-2 flex justify-between text-sm"><span>{x.symbol}</span><Change valor={x.pctChange}/></div>)}</div></div>}

function Market({id,sub}:{id:string;sub:string}){
 const{data,error,loading}=useApi<Cotizacion[]>(`/api/data912/${id}`,60000);
 const[sector,setSector]=useState("Todos");
 const[selected,setSelected]=useState<Cotizacion|null>(null);
 const base=useMemo(()=>{let x=(data??[]).filter(r=>r.last!==null);if(id==="arg_stocks")x=x.filter(r=>sub==="lider"?LIDER.has(r.symbol):!LIDER.has(r.symbol));if(id==="arg_cedears"&&sub==="mag7")x=x.filter(r=>MAG7.has(r.symbol));return x},[data,id,sub]);
 const opciones=useMemo(()=>["Todos",...Array.from(new Set(base.map(r=>sectores[r.symbol]??"Otros"))).sort()],[base]);
 const rows=sector==="Todos"?base:base.filter(r=>(sectores[r.symbol]??"Otros")===sector);
 return <>
  {(id==="arg_stocks"||id==="arg_cedears")&&<div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-tinta/55">Hacé clic en un activo para ver su serie de precios.</p><label className="flex items-center gap-2 text-xs font-bold text-oliva">Sector<select value={sector} onChange={e=>{setSector(e.target.value);setSelected(null)}} className="rounded-full border border-oliva/30 bg-white px-3 py-2 text-sm font-semibold text-tinta outline-none"><option>Todos</option>{opciones.filter(x=>x!=="Todos").map(x=><option key={x}>{x}</option>)}</select></label></div>}
  {selected&&(id==="arg_stocks"||id==="arg_cedears")&&<AssetDetail row={selected} market={id} onClose={()=>setSelected(null)}/>}
  {id!=="arg_corp"&&<Movers rows={rows}/>}
  <DataTable columns={cols} rows={rows} rowKey={r=>r.symbol} initialSort={{key:"vol",dir:"desc"}} pageSize={12} loading={loading} error={error} fuente="data912.com" onRowClick={id==="arg_stocks"||id==="arg_cedears"?setSelected:undefined}/>
 </>;
}

export default function EquitySection(){
 const[tab,setTab]=useState("arg_stocks"),[sub,setSub]=useState("lider");
 return <section aria-labelledby="equity"><SectionTitle id="equity" title="Acciones, CEDEARs y ONs" subtitle="Mercado organizado por panel y sector. Cotizaciones BYMA con demora."/ >
 <div className="mb-4 flex flex-wrap gap-2">{P.map(p=><button key={p.id} onClick={()=>{setTab(p.id);setSub(p.id==="arg_stocks"?"lider":"todos")}} className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${tab===p.id?"bg-oliva text-white":"border-oliva/50 text-oliva"}`}>{p.label}</button>)}</div>
 {tab==="arg_stocks"&&<div className="mb-4 flex gap-2"><button onClick={()=>setSub("lider")} className={`text-xs font-bold ${sub==="lider"?"text-oliva underline":""}`}>Panel líder</button><button onClick={()=>setSub("general")} className={`text-xs font-bold ${sub==="general"?"text-oliva underline":""}`}>Panel general</button></div>}
 {tab==="arg_cedears"&&<div className="mb-4 flex gap-2"><button onClick={()=>setSub("todos")} className={`text-xs font-bold ${sub==="todos"?"text-oliva underline":""}`}>Todos</button><button onClick={()=>setSub("mag7")} className={`text-xs font-bold ${sub==="mag7"?"text-oliva underline":""}`}>7 Magníficas</button></div>}
 <Market key={tab+sub} id={tab} sub={sub}/></section>;
}