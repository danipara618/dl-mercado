import { NextRequest, NextResponse } from "next/server";
import { MACRO_INDICADORES } from "@/lib/macroDefiniciones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Fila = Record<string, unknown>;
type Punto = { fecha: string; valor: number };
type Serie = { id: string; etiqueta: string; unidad: string; puntos: Punto[] };
const CAMPOS_DIM = ["indicador","descripcion","serie","tipo_de_indicador","region","division","capitulo",
"categoria","cuadro_web","unidad_de_medida","sexo","grupo_edad","jurisdiccion","provincia",
"departamento","rubro","pais","uso_economico","tipo_hogar","hogar","sector","componente"];
const CAMPOS_VALOR = ["valor","valor_total","monto","total","dato","millones_usd","valor_usd"];
function str(v: unknown) { return v == null ? "" : String(v).trim(); }
function num(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string" || !v.trim()) return null;
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function fecha(r: Fila): string {
  const s = str(r.periodo || r.fecha || r.anio || r.año);
  if (/^\d{6}$/.test(s)) return s.slice(0,4) + "-" + s.slice(4);
  if (/^\d{4}$/.test(s) && Number(r.mes) >= 1 && Number(r.mes) <= 12) return s + "-" + String(r.mes).padStart(2,"0");
  return s.slice(0,16);
}
function armarSeries(rows: Fila[], preferencia: string): Serie[] {
  const agrupado = new Map<string, { etiqueta: string; unidad: string; fechas: Map<string,number[]> }>();
  for (const r of rows) {
    const f = fecha(r);
    const claveValor = CAMPOS_VALOR.find((c) => num(r[c]) !== null);
    if (!f || !claveValor) continue;
    const valor = num(r[claveValor]);
    if (valor === null) continue;
    const parts = CAMPOS_DIM.filter((k) => str(r[k])).map((k) => `${k}: ${str(r[k])}`);
    const etiqueta = parts.join(" · ") || "Total informado";
    const id = etiqueta + " · " + claveValor;
    const s = agrupado.get(id) ?? { etiqueta, unidad: str(r.unidad_de_medida) || "", fechas: new Map<string,number[]>() };
    const v = s.fechas.get(f) || [];
    v.push(valor); s.fechas.set(f,v); agrupado.set(id,s);
  }
  const prefer = preferencia.toLowerCase().split(/\s+/).filter(Boolean);
  const puntaje = (s: Serie) => s.puntos.length + prefer.filter(w=>s.etiqueta.toLowerCase().includes(w)).length * 6;
  return [...agrupado.entries()].map(([id,s]):Serie=>({
    id, etiqueta:s.etiqueta, unidad:s.unidad,
    // Una fecha con más de un registro no se promedia ni suma sin justificar unidad.
    puntos:[...s.fechas.entries()].filter(([,vals])=>vals.length===1)
      .map(([f,vals])=>({fecha:f,valor:vals[0]})).sort((a,b)=>a.fecha.localeCompare(b.fecha))
  })).filter(s=>s.puntos.length>=2).sort((a,b)=>puntaje(b)-puntaje(a)).slice(0,50);
}
async function indec(servicio: string, preferencia: string) {
  const token = process.env.INDEC_API_TOKEN;
  if (!token) throw new Error("Falta INDEC_API_TOKEN en Vercel.");
  let result: Fila[] = [];
  let paginado = false;
  // Recuperación acotada y cacheada: el catálogo puede tener millones de filas.
  for(let offset=0;offset<3000;offset+=1000) {
    const url = new URL("https://api.indec.gob.ar/v1/"+servicio);
    url.searchParams.set("limit","1000");
    url.searchParams.set("offset",String(offset));
    url.searchParams.set("order","periodo.desc");
    url.searchParams.set("periodo","gte.202201");
    const opts = { headers:{Authorization:`Bearer ${token}`,Accept:"application/json"},next:{revalidate:3600} };
    let response = await fetch(url.toString(), opts);
    if(!response.ok && response.status===400) {
      // Algunos servicios no tienen el campo/forma de período homogéneo.
      url.searchParams.delete("periodo");
      response = await fetch(url.toString(),opts);
      if(!response.ok && response.status===400) {
        url.searchParams.delete("order");
        response = await fetch(url.toString(),opts);
      }
    }
    if (!response.ok) throw new Error(response.status===401||response.status===403
      ?"El token INDEC no fue autorizado.":"INDEC no respondió correctamente ("+response.status+").");
    const page: unknown = await response.json();
    if(!Array.isArray(page)) throw new Error("Formato de datos INDEC no reconocido.");
    const valid = page.filter((x): x is Fila => typeof x==="object"&&x!==null&&!Array.isArray(x));
    result=result.concat(valid);
    if(page.length<1000) break;
    paginado=true;
  }
  return {series:armarSeries(result,preferencia),registros:result.length,parcial:paginado,fuente:"INDEC — Catálogo API-INDEC",periodicidad:"Según serie",servicio};
}
async function bancoMundial() {
  const url="https://api.worldbank.org/v2/country/ARG/indicator/NY.GDP.PCAP.KD?format=json&per_page=100";
  const response=await fetch(url,{next:{revalidate:86400}});
  if(!response.ok) throw new Error("El Banco Mundial no respondió.");
  const json: unknown=await response.json();
  if(!Array.isArray(json)||!Array.isArray(json[1])) throw new Error("Formato del Banco Mundial no reconocido.");
  const puntos:Punto[]=json[1].filter((r:unknown)=>!!r&&typeof r==="object"&&!Array.isArray(r))
    .map((r:Record<string,unknown>)=>({fecha:str(r.date),valor:num(r.value)}))
    .filter((p):p is Punto=>p.valor!==null).sort((a,b)=>a.fecha.localeCompare(b.fecha));
  return {series:[{id:"NY.GDP.PCAP.KD",etiqueta:"PIB por habitante, US$ constantes de 2015",unidad:"US$ de 2015",puntos}],registros:puntos.length,parcial:false,fuente:"Banco Mundial — WDI (NY.GDP.PCAP.KD)",periodicidad:"Anual"};
}
export async function GET(_request: NextRequest,context:{params:Promise<{id:string}>}) {
  const {id}=await context.params;
  const cfg=MACRO_INDICADORES.find(s=>s.id===id);
  if(!cfg || (cfg.fuente!=="indec"&&cfg.fuente!=="bm")) return NextResponse.json({error:"Indicador no encontrado"},{status:404});
  try{
    const data=cfg.fuente==="bm" ? await bancoMundial() : await indec(cfg.servicio!,cfg.preferencia || "");
    return NextResponse.json({...data,indicador:id}, {headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=7200"}});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Sin datos disponibles",series:[]},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
