"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet, TrendingUp, Info } from "lucide-react";
import type { ApiResponse, Indicadores } from "@/lib/types";
import { factorInflacion, formatearNumero, moneda, validos, type DatoMensual } from "@/lib/calculadorasFaciles";

type Modo = "sueldo" | "inflacion";
const PREGUNTAS = [
  { id: "sueldo" as const, titulo: "¿Mi sueldo le ganó a la inflación?", detalle: "Compará lo que cobrabas antes con lo que cobrás ahora.", icono: Wallet },
  { id: "inflacion" as const, titulo: "¿Cuánto aumentaron los precios?", detalle: "Elegí dos meses y descubrí cuánto perdió de valor tu dinero.", icono: TrendingUp },
];
const nombresMes = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function nombreMes(ym: string) {
  const [anio, mes] = ym.split("-");
  return `${nombresMes[Number(mes) - 1] || mes} ${anio}`;
}
function Mes({ titulo, value, onChange, opciones }: { titulo: string; value: string; onChange: (s: string) => void; opciones: string[] }) {
  return <label className="block">
    <span className="mb-1.5 block text-sm font-semibold">{titulo}</span>
    <select className="w-full rounded-xl border border-crema-200 bg-crema-50 px-4 py-3 text-sm" value={value} onChange={e => onChange(e.target.value)}>
      {opciones.map(x => <option key={x} value={x}>{nombreMes(x)}</option>)}
    </select>
  </label>;
}
function Monto({titulo,valor,onChange}:{titulo:string;valor:string;onChange:(v:string)=>void}) {
  return <label className="block">
    <span className="mb-1.5 block text-sm font-semibold">{titulo}</span>
    <div className="flex items-center rounded-xl border border-crema-200 bg-crema-50 px-4 focus-within:border-oliva">
      <span className="text-tinta/50">$</span>
      <input type="number" inputMode="decimal" min="0" step="any" value={valor} onChange={e=>onChange(e.target.value)} className="min-w-0 w-full bg-transparent px-2 py-3 text-lg outline-none" />
    </div>
  </label>;
}
function Respuesta({titulo,resultado,explicacion}:{titulo:string;resultado:string;explicacion:string}){
  return <div aria-live="polite" className="rounded-2xl bg-oliva p-6 text-white sm:p-7">
    <p className="text-xs font-bold uppercase tracking-widest text-white/70">{titulo}</p>
    <h3 className="mt-3 font-serif text-3xl leading-tight">{resultado}</h3>
    <p className="mt-4 text-sm leading-relaxed text-white/85">{explicacion}</p>
  </div>;
}
export default function CalculadorasFaciles() {
  const [modo, setModo] = useState<Modo>("sueldo");
  const [serie, setSerie] = useState<DatoMensual[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [sueldoAnterior, setSueldoAnterior] = useState("800000");
  const [sueldoActual, setSueldoActual] = useState("1100000");
  const [monto, setMonto] = useState("100000");
  const [desdeElegido, setDesdeElegido] = useState("");
  const [hastaElegido, setHastaElegido] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("tipo");
    if (q === "inflacion" || q === "sueldo") setModo(q);
  }, []);
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const res = await fetch("/api/indicadores", { cache: "no-store" });
        const json = await res.json() as ApiResponse<Indicadores>;
        if (!json.ok) throw new Error(json.error);
        const puntos = validos((json.data.inflacionSerie || []).map(p=>({mes:p.fecha.slice(0,7),valor:p.valor})));
        if (activo) setSerie(puntos);
      } catch (e) {
        if (activo) setError(e instanceof Error ? e.message : "No pudimos obtener los datos.");
      } finally { if (activo) setCargando(false); }
    })();
    return () => {activo = false;};
  }, []);

  const meses = useMemo(()=>serie.map(p=>p.mes),[serie]);
  const hasta = meses.includes(hastaElegido) ? hastaElegido : meses.at(-1) || "";
  const desde = meses.includes(desdeElegido) ? desdeElegido : meses.at(-13) || meses[0] || "";
  const factor = useMemo(()=>factorInflacion(serie, desde, hasta),[serie,desde,hasta]);
  const antes = Number(sueldoAnterior);
  const ahora = Number(sueldoActual);
  const sueldoValido = Number.isFinite(antes) && antes > 0 && Number.isFinite(ahora) && ahora >= 0;
  const sueldoReal = factor !== null && sueldoValido ? (ahora/(antes*factor)-1)*100 : null;
  const montoNum = Number(monto);
  const inflacion = factor !== null ? (factor-1)*100 : null;
  const actual = PREGUNTAS.find(x=>x.id===modo)!;

  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2">
      {PREGUNTAS.map(({id,titulo,detalle,icono:Icon})=><button key={id} type="button" aria-pressed={modo===id}
        onClick={()=>{setModo(id);setDesdeElegido("");setHastaElegido("");}}
        className={`rounded-2xl border p-5 text-left transition hover:border-oliva/50 ${modo===id?"border-oliva bg-oliva-100":"border-crema-200 bg-white"}`}>
        <Icon className="mb-3 text-oliva" size={23}/><span className="block font-semibold">{titulo}</span>
        <span className="mt-1 block text-sm text-tinta/60">{detalle}</span>
      </button>)}
    </div>
    <section className="rounded-3xl border border-crema-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-xl bg-oliva-100 p-3 text-oliva"><actual.icono size={23}/></span>
        <h2 className="font-serif text-2xl">{actual.titulo}</h2>
      </div>
      {cargando ? <p className="rounded-xl bg-crema-50 p-4 text-sm">Cargando los datos de inflación...</p>
       : error || !meses.length ? <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">No hay datos suficientes del IPC para calcular ahora. {error}</p>
       : <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-4">
          {modo==="sueldo" && <Monto titulo="¿Cuánto cobrabas antes?" valor={sueldoAnterior} onChange={setSueldoAnterior}/>}
          <Mes titulo="¿Desde qué mes?" value={desde} onChange={setDesdeElegido} opciones={meses.filter(x=>x<=hasta)}/>
          {modo==="sueldo" && <Monto titulo="¿Cuánto cobrás ahora?" valor={sueldoActual} onChange={setSueldoActual}/>}
          <Mes titulo="¿Hasta qué mes?" value={hasta} onChange={setHastaElegido} opciones={meses.filter(x=>x>=desde)}/>
          {modo==="inflacion" && <Monto titulo="¿Qué monto querés comparar?" valor={monto} onChange={setMonto}/>}
        </div>
        <div>
          {modo==="sueldo" ? sueldoReal === null
            ? <p role="status" className="rounded-xl bg-crema-50 p-5 text-sm">Revisá los importes y las fechas. Hacen falta todos los meses del IPC entre ambas fechas.</p>
            : <Respuesta titulo="Tu poder de compra" resultado={sueldoReal>=0?"Tu sueldo le ganó a la inflación":"Tu sueldo perdió contra la inflación"}
              explicacion={`Tu capacidad de compra ${sueldoReal>=0?"subió":"bajó"} ${formatearNumero(Math.abs(sueldoReal))}%. Para comprar lo mismo que antes necesitarías ${moneda(antes*factor!)} en ${nombreMes(hasta)}.`} />
          : inflacion===null || !Number.isFinite(montoNum) || montoNum<=0
            ? <p role="status" className="rounded-xl bg-crema-50 p-5 text-sm">Revisá las fechas y el monto. Hacen falta todos los meses del IPC.</p>
            : <Respuesta titulo="Inflación acumulada" resultado={formatearNumero(inflacion)+"%"}
              explicacion={`Lo que costaba ${moneda(montoNum)} en ${nombreMes(desde)} necesitaría aproximadamente ${moneda(montoNum*factor!)} en ${nombreMes(hasta)} para comprar lo mismo.`}/>}
        </div>
      </div>}
      <details className="mt-6 rounded-xl border border-crema-200 bg-crema-50 p-4 text-sm text-tinta/70">
        <summary className="cursor-pointer font-bold text-oliva">¿Cómo se calculó?</summary>
        <p className="mt-3 leading-relaxed">{modo==="sueldo"
          ? "Comparamos el cambio en tu sueldo con la inflación acumulada: (sueldo actual / sueldo anterior) ÷ (1 + inflación acumulada) − 1."
          : "Encadenamos las variaciones del IPC mensual. Los porcentajes mensuales se multiplican, no se suman."} Si falta algún mes, no mostramos un resultado inventado.</p>
      </details>
      <p className="mt-4 flex items-center gap-2 text-xs text-tinta/55"><Info size={15}/> Fuente: IPC nacional del INDEC distribuido por ArgentinaDatos. Resultado estimado a partir de los montos que ingresás.</p>
    </section>
  </div>;
}
