"use client";
import{useEffect,useMemo,useState}from"react";
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


function InvestmentSimulator({row,market}:{row:Cotizacion;market:string}){
 const{data,error,loading}=useApi<Hist>(`/api/history?symbol=${encodeURIComponent(row.symbol)}&market=${market}&range=5y`,0);
 const hist=(data?.serie??[]).filter((x):x is {fecha:string;valor:number}=>x.valor!==null);
 const[monto,setMonto]=useState(500000);
 const[comision,setComision]=useState(.5);
 const[fecha,setFecha]=useState("");
 useEffect(()=>{if(!fecha&&hist.length){const target=Date.now()-365*24*60*60*1000;const cercano=hist.find(x=>new Date(x.fecha).getTime()>=target)??hist[0];setFecha(cercano.fecha)}},[hist,fecha]);
 const calc=useMemo(()=>{
   if(!hist.length||!fecha||!row.last||row.last<=0||monto<=0)return null;
   const compra=hist.find(x=>x.fecha>=fecha)??hist[hist.length-1];
   const fee=Math.max(0,comision)/100;
   const unidades=monto/(compra.valor*(1+fee));
   const valorBruto=unidades*row.last;
   const valorNeto=valorBruto*(1-fee);
   const ganancia=valorNeto-monto;
   const rendimiento=ganancia/monto*100;
   const dias=Math.max(1,(new Date().getTime()-new Date(compra.fecha).getTime())/86400000);
   const anualizado=dias>=30?(Math.pow(Math.max(valorNeto/monto,0.000001),365/dias)-1)*100:null;
   const evolucion=hist.filter(x=>x.fecha>=compra.fecha).map(x=>({fecha:x.fecha,valor:unidades*x.valor*(1-fee),capital:monto}));
   return{compra,unidades,valorNeto,ganancia,rendimiento,anualizado,evolucion};
 },[hist,fecha,row.last,monto,comision]);
 const ars=new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0});
 return <div className="mt-6 rounded-2xl border border-crema-200 bg-crema-50 p-5">
   <div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-oliva">Simulador histórico</p><h4 className="mt-1 font-serif text-2xl">¿Qué pasaba si comprabas {row.symbol}?</h4><p className="mt-1 text-sm text-tinta/55">Simulá una compra histórica usando precios de cierre y una comisión estimada por operación.</p></div>
   <div className="mt-5 grid gap-4 sm:grid-cols-3">
    <label><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-tinta/50">Monto invertido</span><input className="calc-number w-full rounded-xl border border-crema-200 bg-white px-3 py-3 outline-none" type="number" inputMode="decimal" value={monto} onFocus={e=>e.currentTarget.select()} onChange={e=>setMonto(Number(e.target.value)||0)}/></label>
    <label><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-tinta/50">Fecha de compra</span><input className="w-full rounded-xl border border-crema-200 bg-white px-3 py-3 outline-none" type="date" min={hist[0]?.fecha} max={hist[hist.length-1]?.fecha} value={fecha} onChange={e=>setFecha(e.target.value)}/></label>
    <label><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-tinta/50">Comisión por operación</span><div className="flex rounded-xl border border-crema-200 bg-white px-3"><input className="calc-number min-w-0 flex-1 bg-transparent py-3 outline-none" type="number" step="0.1" inputMode="decimal" value={comision} onFocus={e=>e.currentTarget.select()} onChange={e=>setComision(Number(e.target.value)||0)}/><span className="self-center text-xs text-tinta/40">%</span></div></label>
   </div>
   {loading?<p className="mt-5 text-sm text-tinta/45">Cargando historial para simular…</p>:error||!calc?<p className="mt-5 text-sm text-tinta/45">No se pudo construir la simulación para este activo.</p>:<>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {[
       ["Precio de entrada",fmtNum(calc.compra.valor,2)],
       ["Unidades",fmtNum(calc.unidades,4)],
       ["Valor hoy",ars.format(calc.valorNeto)],
       ["Resultado",(calc.ganancia>=0?"+":"")+ars.format(calc.ganancia)],
       ["Rendimiento",(calc.rendimiento>=0?"+":"")+fmtNum(calc.rendimiento,1)+"%"]
      ].map(([a,b])=><div key={a} className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs text-tinta/45">{a}</p><b className="mt-1 block text-lg">{b}</b></div>)}
    </div>
    <div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={calc.evolucion} margin={{top:10,right:12,left:4,bottom:0}}><CartesianGrid vertical={false} strokeOpacity={.12}/><XAxis dataKey="fecha" minTickGap={42} tick={{fontSize:10}}/><YAxis width={72} tick={{fontSize:10}} tickFormatter={(v:number)=>fmtCompact(v)}/><Tooltip formatter={(v:number,n:string)=>[ars.format(v),n==="valor"?"Inversión":"Capital inicial"]}/><Line type="monotone" dataKey="valor" name="Inversión" stroke="#2C3A22" strokeWidth={2.2} dot={false}/><Line type="linear" dataKey="capital" name="Capital inicial" stroke="#9AA36B" strokeDasharray="5 5" dot={false}/></LineChart></ResponsiveContainer></div>
    <p className="mt-3 text-xs text-tinta/50">Compra tomada al primer cierre disponible desde {calc.compra.fecha}. Se descuenta la comisión tanto al entrar como al valorar una salida hoy.{calc.anualizado!==null?` Retorno anualizado estimado: ${fmtNum(calc.anualizado,1)}%.`:""}</p>
   </>}
   <p className="mt-3 text-xs text-tinta/40">Simulación educativa basada en precios históricos. No incluye impuestos, dividendos, splits, ratios de conversión ni otros costos y no constituye una recomendación de inversión.</p>
 </div>
}

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
   <p className="mt-3 text-xs text-tinta/45">Serie histórica orientativa vía Yahoo Finance. Para acciones y CEDEARs se consulta el símbolo local .BA cuando está disponible.</p><InvestmentSimulator row={row} market={market}/>
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