"use client";
import {useEffect,useMemo,useState} from "react";
import {Wallet,TrendingUp,ShoppingBasket,MapPin,ChartColumnIncreasing,ArrowRight,Info,RefreshCcw} from "lucide-react";
import {factorInflacion,factorNiveles,validos,moneda,formatearNumero,leerFilasIndec,canastasINDEC,ipcRegional,type DatoMensual} from "@/lib/calculadorasFaciles";
import type {Indicadores} from "@/lib/types";
import type {ApiResponse} from "@/lib/types";

type Modo="sueldo"|"inflacion"|"canasta"|"regiones"|"productos";
const ITEMS=[
 {id:"sueldo" as const,icon:Wallet,title:"¿Mi sueldo le ganó a la inflación?",subtitle:"Descubrí si hoy podés comprar más o menos que antes."},
 {id:"inflacion" as const,icon:TrendingUp,title:"¿Cuánto aumentaron los precios?",subtitle:"Compará dos meses y conocé la inflación acumulada."},
 {id:"canasta" as const,icon:ShoppingBasket,title:"¿Cuánto aumentó la canasta básica?",subtitle:"Mirá cuánto cambió su costo, también frente a la inflación."},
 {id:"regiones" as const,icon:MapPin,title:"¿Dónde aumentaron más los precios?",subtitle:"Compará la inflación de dos regiones del país."},
 {id:"productos" as const,icon:ChartColumnIncreasing,title:"¿Qué productos están aumentando?",subtitle:"Descubrí cuántos rubros subieron y cuáles aumentaron más."},
];
const MESES=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
function mesBonito(ym:string){const [y,m]=ym.split("-");return `${MESES[Number(m)-1]||m} ${y}`;}
function texto(e:unknown){return e instanceof Error?e.message:"No pudimos obtener los datos.";}
function SelectorMes({value,onChange,months,label}:{value:string;onChange:(s:string)=>void;months:string[];label:string}){
 return <label className="block space-y-1.5"><span className="text-sm font-bold text-tinta/75">{label}</span><select className="w-full rounded-xl border border-crema-200 bg-crema-50 px-4 py-3 text-sm" value={value} onChange={e=>onChange(e.target.value)}>
 {months.map(x=><option key={x} value={x}>{mesBonito(x)}</option>)}</select></label>;
}
function Explicacion({children}:{children:React.ReactNode}){return <details className="rounded-xl border border-crema-200 bg-crema-50 p-4 text-sm text-tinta/70">
 <summary className="cursor-pointer font-bold text-oliva">¿Cómo se calculó?</summary><div className="mt-3 leading-relaxed">{children}</div>
 </details>;}
function Resultado({title,big,body,info}:{title:string;big:string;body:string;info?:string}){
 return <div aria-live="polite" className="rounded-2xl bg-oliva p-6 text-white sm:p-8">
 <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/70">{title}</p>
 <p className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">{big}</p>
 <p className="mt-4 text-sm leading-relaxed text-white/85">{body}</p>
 {info&&<p className="mt-4 border-t border-white/20 pt-3 text-xs text-white/65">{info}</p>}
 </div>;
}
function Aviso({children}:{children:React.ReactNode}){return <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">{children}</div>;}
const money=(v:string)=>Number(v);
export default function CalculadorasFaciles(){
 const [modo,setModo]=useState<Modo>("sueldo");
 useEffect(()=>{
  const type=new URLSearchParams(window.location.search).get("tipo");
  if(type&&ITEMS.some(item=>item.id===type))setModo(type as Modo);
 },[]);

 const [inflacion,setInflacion]=useState<DatoMensual[]>([]);
 const [errorInflacion,setErrorInflacion]=useState("");
 const [cargando,setCargando]=useState(true);
 const [canastas,setCanastas]=useState<ReturnType<typeof canastasINDEC>>([]);
 const [regionales,setRegionales]=useState<ReturnType<typeof ipcRegional>>([]);
 const [errorCanasta,setErrorCanasta]=useState("");
 const [errorRegional,setErrorRegional]=useState("");
 const [cargandoIndec,setCargandoIndec]=useState(true);
 const [sueldoAntes,setSueldoAntes]=useState("800000");
 const [sueldoAhora,setSueldoAhora]=useState("1100000");
 const [monto,setMonto]=useState("100000");
 const [desdeElegido,setDesdeElegido]=useState("");
 const [hastaElegido,setHastaElegido]=useState("");
 const [regionA,setRegionA]=useState("");
 const [regionB,setRegionB]=useState("");
 const [regionDif,setRegionDif]=useState("");
 const [mesRegional,setMesRegional]=useState("");
 useEffect(()=>{
  let active=true;
  (async()=>{
   try{
    const r=await fetch("/api/indicadores",{cache:"no-store"});
    const j=await r.json() as ApiResponse<Indicadores>;
    if(!j.ok)throw Error(j.error);
    const serie=validos((j.data.inflacionSerie||[]).map(p=>({mes:p.fecha.slice(0,7),valor:p.valor})));
    if(active)setInflacion(serie);
   }catch(e){if(active)setErrorInflacion(texto(e));}
   finally{if(active)setCargando(false);}
  })();
  Promise.allSettled(["valorizacion_canastas_cba_cbt","ipc_nacional"].map(async id=>{
    // Los servicios pueden ser extensos. Consultar pocas páginas no garantiza el histórico completo.
    const responses=await Promise.all([0,500].map(async offset=>{
      const r=await fetch(`/api/indec/${id}?limit=500&offset=${offset}`,{cache:"no-store"});
      const j=await r.json();if(!r.ok)throw Error(j.error||"Servicio INDEC no disponible");
      return leerFilasIndec(j);
    }));
    return responses.flat();
  })).then(results=>{
    if(!active)return;
    if(results[0].status==="fulfilled")setCanastas(canastasINDEC(results[0].value));
    else setErrorCanasta(texto(results[0].reason));
    if(results[1].status==="fulfilled")setRegionales(ipcRegional(results[1].value));
    else setErrorRegional(texto(results[1].reason));
  }).finally(()=>{if(active)setCargandoIndec(false);});
  return ()=>{active=false;};
 },[]);
 const meses=useMemo(()=>inflacion.map(x=>x.mes),[inflacion]);
 const hasta=meses.includes(hastaElegido)?hastaElegido:meses.at(-1)||"";
 const desde=meses.includes(desdeElegido)?desdeElegido:meses.at(-13)||meses.at(0)||"";
 const mesesAnteriores=meses.filter(m=>m<=hasta);
 const mesesPosteriores=meses.filter(m=>m>=desde);
 const factor=useMemo(()=>factorInflacion(inflacion,desde,hasta),[inflacion,desde,hasta]);
 const salario1=money(sueldoAntes),salario2=money(sueldoAhora);
 const salarioValido=Number.isFinite(salario1)&&Number.isFinite(salario2)&&salario1>0&&salario2>=0;
 const real=factor&&salarioValido?(salario2/(salario1*factor)-1)*100:null;
 const montoValor=money(monto);
 const inflacionAcum=factor?(factor-1)*100:null;
 const canastaSeries=useMemo(()=>validos(canastas.map(c=>({mes:c.mes,valor:c.valor}))),[canastas]);
 const mesesCanasta=canastaSeries.map(x=>x.mes).filter(m=>meses.includes(m));
 const desdeC=mesesCanasta.includes(desdeElegido)?desdeElegido:mesesCanasta.at(-13)||mesesCanasta[0]||"";
 const hastaC=mesesCanasta.includes(hastaElegido)?hastaElegido:mesesCanasta.at(-1)||"";
 const fCanasta=factorNiveles(canastaSeries,desdeC,hastaC);
 const fIPCcanasta=factorInflacion(inflacion,desdeC,hastaC);
 const variacionCanasta=fCanasta?(fCanasta-1)*100:null;
 const variacionReal=fCanasta&&fIPCcanasta?(fCanasta/fIPCcanasta-1)*100:null;
 const regiones=useMemo(()=>[...new Set(regionales.filter(r=>/nivel general/i.test(r.division)).map(r=>r.region))].sort(),[regionales]);
 const regA=regiones.includes(regionA)?regionA:regiones[0]||"";
 const regB=regiones.includes(regionB)?regionB:regiones[1]||regiones[0]||"";
 const regionesMeses=useMemo(()=>[...new Set(regionales.filter(r=>/nivel general/i.test(r.division)).map(r=>r.mes))].sort(),[regionales]);
 const rMes=regionesMeses.includes(mesRegional)?mesRegional:regionesMeses.at(-1)||"";
 const indiceR=(region:string)=>regionales.find(r=>r.region===region&&r.mes===rMes&&/nivel general/i.test(r.division))?.variacion;
 const valorRA=indiceR(regA),valorRB=indiceR(regB);
 const regionE=regiones.includes(regionDif)?regionDif:regiones.find(r=>regionales.some(v=>v.region===r&&v.mes===rMes&&!/nivel general/i.test(v.division)))||"";
 const divisiones=regionales.filter(r=>r.region===regionE&&r.mes===rMes&&!/nivel general/i.test(r.division));
 const validas=divisiones.length>=10&&divisiones.length<=13;
 const aumentos=divisiones.filter(d=>d.variacion>0).length;
 const modoInfo=ITEMS.find(x=>x.id===modo)!;
 function cambiar(m:Modo){setModo(m);setDesdeElegido("");setHastaElegido("");}
 return <div className="space-y-8">
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
   {ITEMS.map(item=><button type="button" key={item.id} onClick={()=>cambiar(item.id)} aria-pressed={modo===item.id}
    className={`group min-h-36 rounded-2xl border p-5 text-left transition hover:border-oliva/50 ${modo===item.id?"border-oliva bg-oliva-100 shadow-sm":"border-crema-200 bg-white"}`}>
    <item.icon size={22} className="text-oliva"/>
    <span className="mt-3 block font-semibold leading-snug text-tinta">{item.title}</span>
    <span className="mt-1 block text-xs leading-relaxed text-tinta/60">{item.subtitle}</span>
   </button>)}
  </div>
  <section className="rounded-3xl border border-crema-200 bg-white p-5 shadow-sm sm:p-8">
   <div className="mb-6 flex items-center gap-3"><span className="rounded-xl bg-oliva-100 p-3 text-oliva"><modoInfo.icon size={23}/></span>
    <div><p className="text-xs font-extrabold uppercase tracking-wider text-oliva">Calculadora fácil</p>
    <h2 className="mt-1 font-serif text-2xl sm:text-3xl">{modoInfo.title}</h2></div></div>
   {(["sueldo","inflacion"].includes(modo)&&cargando)&&<p className="rounded-xl bg-crema-50 p-4 text-sm">Buscando los datos de inflación...</p>}
   {(["sueldo","inflacion"].includes(modo)&&errorInflacion)&&<Aviso>No podemos consultar el IPC: {errorInflacion}</Aviso>}
   {(["sueldo","inflacion"].includes(modo)&&!cargando&&meses.length===0)&&<Aviso>Por ahora no tenemos una serie mensual de inflación disponible. No vamos a mostrar resultados estimados.</Aviso>}
   {modo==="sueldo"&&meses.length>0&&<>
    <div className="grid gap-6 lg:grid-cols-2">
     <div className="grid gap-4">
      <label className="block space-y-1.5"><span className="text-sm font-bold">¿Cuánto cobrabas antes?</span>
       <input type="number" inputMode="decimal" min="1" value={sueldoAntes} onChange={e=>setSueldoAntes(e.target.value)}
        className="w-full rounded-xl border border-crema-200 bg-crema-50 px-4 py-3.5 text-lg" aria-label="Sueldo anterior en pesos"/></label>
      <SelectorMes label="¿En qué mes?" months={mesesAnteriores} value={desde} onChange={setDesdeElegido}/>
      <label className="block space-y-1.5"><span className="text-sm font-bold">¿Cuánto cobrás ahora?</span>
       <input type="number" inputMode="decimal" min="0" value={sueldoAhora} onChange={e=>setSueldoAhora(e.target.value)}
        className="w-full rounded-xl border border-crema-200 bg-crema-50 px-4 py-3.5 text-lg" aria-label="Sueldo actual en pesos"/></label>
      <SelectorMes label="¿De qué mes es ese sueldo?" months={mesesPosteriores} value={hasta} onChange={setHastaElegido}/>
     </div>
     <div>{real===null?<Aviso>Revisá los montos y las fechas. Se necesitan todos los meses de inflación entre ambos períodos.</Aviso>:
      <Resultado title="Tu poder adquisitivo" big={real>=0?"¡Tu sueldo le ganó a la inflación!":"Tu sueldo perdió contra la inflación"}
       body={`En términos reales, tu poder de compra ${real>=0?"aumentó":"disminuyó"} ${formatearNumero(Math.abs(real))}%. Para mantener tu poder de compra anterior necesitarías ${moneda(salario1*factor!)} al final de este período.`}
       info={`Sueldo anterior: ${moneda(salario1)} · Sueldo actual: ${moneda(salario2)} · Inflación del período: ${formatearNumero((factor!-1)*100)}%.`}/>}</div>
    </div>
    <div className="mt-5"><Explicacion>Primero calculamos cuánto aumentaron los precios según el IPC mensual. Después comparamos tu sueldo actual con lo que necesitarías para mantener el mismo poder de compra. El resultado es personal: no representa el salario real promedio del país.</Explicacion></div>
   </>}
   {modo==="inflacion"&&meses.length>0&&<>
    <div className="grid gap-6 lg:grid-cols-2"><div className="grid gap-4">
     <SelectorMes label="¿Desde qué mes?" months={mesesAnteriores} value={desde} onChange={setDesdeElegido}/>
     <SelectorMes label="¿Hasta qué mes?" months={mesesPosteriores} value={hasta} onChange={setHastaElegido}/>
     <label className="block space-y-1.5"><span className="text-sm font-bold">¿Qué monto querés comparar?</span>
      <input type="number" min="1" value={monto} onChange={e=>setMonto(e.target.value)} className="w-full rounded-xl border border-crema-200 bg-crema-50 px-4 py-3.5 text-lg"/>
      <span className="text-xs text-tinta/50">Por ejemplo, $100.000. Podés cambiarlo.</span></label>
    </div><div>{inflacionAcum===null||!Number.isFinite(montoValor)||montoValor<=0?<Aviso>No podemos calcular ese período: revisá el monto o elegí fechas con datos mensuales completos.</Aviso>:
     <Resultado title="Los precios aumentaron" big={formatearNumero(inflacionAcum)+"%"}
      body={`Lo que costaba ${moneda(montoValor)} en ${mesBonito(desde)} necesitaría aproximadamente ${moneda(montoValor*factor!)} en ${mesBonito(hasta)} para comprar lo mismo.`}
      info="El cálculo es acumulado: se componen las variaciones mensuales; no se suman porcentajes."/ >}</div></div>
    <div className="mt-5"><Explicacion>Para cada mes posterior al inicial multiplicamos el valor por (1 + inflación mensual / 100). Si falta un mes, no completamos la cuenta con valores inventados.</Explicacion></div>
   </>}
   {modo==="canasta"&&<>
    {cargandoIndec?<p className="rounded-xl bg-crema-50 p-4 text-sm">Buscando datos oficiales de la canasta básica...</p>:
     canastaSeries.length<2?<Aviso>La API del INDEC está disponible, pero todavía no encontramos una serie inequívoca de **CBT del mismo hogar** para comparar. {errorCanasta&&`Detalle: ${errorCanasta}`} No mezclamos hogares ni importes distintos.</Aviso>:
      <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">
       <SelectorMes label="¿Desde qué mes?" months={mesesCanasta.filter(m=>m<=hastaC)} value={desdeC} onChange={setDesdeElegido}/>
       <SelectorMes label="¿Hasta qué mes?" months={mesesCanasta.filter(m=>m>=desdeC)} value={hastaC} onChange={setHastaElegido}/>
      </div>{variacionCanasta===null||variacionReal===null?<Aviso>No hay información completa y comparable para esos meses.</Aviso>:
       <Resultado title="Canasta básica total" big={`Aumentó ${formatearNumero(variacionCanasta)}%`}
       body={`En comparación con la inflación general, la canasta ${variacionReal>0?"se encareció":"se abarató"} ${formatearNumero(Math.abs(variacionReal))}% en términos reales.`}
       info={`Elaboración con CBT del INDEC e IPC mensual. ${mesBonito(desdeC)} – ${mesBonito(hastaC)}.`}/>}
      <Explicacion>Se compara cuánto costaba la misma canasta de un mismo tipo de hogar en dos fechas. La variación real descuenta lo que aumentó el IPC nacional en ese período. Solo usamos registros que podamos identificar sin ambigüedad.</Explicacion>
      </div>}
   </>}
   {modo==="regiones"&&<>
    {cargandoIndec?<p className="rounded-xl bg-crema-50 p-4 text-sm">Buscando los datos regionales...</p>:
    regiones.length<2?<Aviso>Todavía no hay suficientes tasas mensuales regionales verificadas para comparar. {errorRegional&&`Detalle: ${errorRegional}`} No vamos a confundir inflación mensual con índices o tasas anuales.</Aviso>:
    <div className="space-y-5">
     <div className="grid gap-4 sm:grid-cols-3">
      <label className="space-y-1.5 text-sm font-bold">Primera región<select className="mt-1 w-full rounded-xl border border-crema-200 bg-crema-50 p-3 text-sm" value={regA} onChange={e=>setRegionA(e.target.value)}>{regiones.map(r=><option key={r}>{r}</option>)}</select></label>
      <label className="space-y-1.5 text-sm font-bold">Segunda región<select className="mt-1 w-full rounded-xl border border-crema-200 bg-crema-50 p-3 text-sm" value={regB} onChange={e=>setRegionB(e.target.value)}>{regiones.map(r=><option key={r}>{r}</option>)}</select></label>
      <SelectorMes label="¿Qué mes?" months={regionesMeses} value={rMes} onChange={setMesRegional}/>
     </div>
     {regA===regB||valorRA===undefined||valorRB===undefined?<Aviso>Elegí dos regiones diferentes con datos para el mismo mes.</Aviso>:
      <Resultado title="Comparación regional" big={`${Math.abs(valorRA-valorRB)<0.0001?"Empataron":`${valorRA>valorRB?regA:regB} tuvo más inflación`}`}
       body={`${regA}: ${formatearNumero(valorRA)}%. ${regB}: ${formatearNumero(valorRB)}%. Diferencia de ${formatearNumero(Math.abs(valorRA-valorRB))} puntos porcentuales en ${mesBonito(rMes)}.`}/>}
     <Explicacion>Comparamos la variación mensual del nivel general del IPC regional. La diferencia se expresa en puntos porcentuales, no como diferencia entre valores de canastas.</Explicacion>
    </div>}
   </>}
   {modo==="productos"&&<>
    {cargandoIndec?<p className="rounded-xl bg-crema-50 p-4 text-sm">Buscando la inflación por rubros...</p>:
     regionales.length===0?<Aviso>La API todavía no entregó las variaciones por división necesarias. {errorRegional&&`Detalle: ${errorRegional}`}</Aviso>:
     <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
       <label className="text-sm font-bold">¿En qué región?<select value={regionE} onChange={e=>setRegionDif(e.target.value)} className="mt-1 w-full rounded-xl border border-crema-200 bg-crema-50 p-3 text-sm">{regiones.map(r=><option key={r}>{r}</option>)}</select></label>
       <SelectorMes label="¿En qué mes?" months={regionesMeses} value={rMes} onChange={setMesRegional}/>
      </div>
      {!validas?<Aviso>Para mostrar un porcentaje confiable necesitamos identificar las 12 divisiones de consumo de una región y mes. Los registros disponibles no alcanzan para eso.</Aviso>:
       <><Resultado title="Rubros que subieron" big={`${aumentos} de ${divisiones.length} divisiones`}
        body={`En ${mesBonito(rMes)}, el ${formatearNumero(aumentos/divisiones.length*100,0)}% de las divisiones del IPC de ${regionE} registró aumentos.`}/>
       <div className="space-y-2"><h3 className="font-bold">¿Cuáles aumentaron más?</h3>{[...divisiones].sort((a,b)=>b.variacion-a.variacion).slice(0,6).map(x=><div key={x.division} className="flex justify-between gap-3 rounded-xl bg-crema-50 p-3 text-sm"><span>{x.division}</span><b className="shrink-0">{formatearNumero(x.variacion)}%</b></div>)}</div></>}
      <Explicacion>Medimos cuántas divisiones del IPC tuvieron variación mensual positiva sobre el total disponible para la misma región. No es el porcentaje de productos individuales que subieron: cada división agrupa muchos productos y servicios.</Explicacion>
     </div>}
   </>}
   <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-crema-200 pt-5 text-xs text-tinta/55"><Info size={16}/> Fuentes: IPC de INDEC distribuido por ArgentinaDatos; CBT e IPC regional de la API oficial del INDEC, sujetos a disponibilidad. Nunca se muestran cifras supuestas.</div>
  </section>
  <div className="rounded-2xl border border-crema-200 bg-crema-50 p-4 text-sm text-tinta/65">
   <strong className="text-tinta">¿Querés profundizar?</strong> El <a href="/observatorio" className="font-bold text-oliva underline">Observatorio INDEC</a> tiene los datos originales y sus desagregaciones. Estas calculadoras están pensadas para responder preguntas sin exigir conocimientos económicos.
  </div>
 </div>;
}
