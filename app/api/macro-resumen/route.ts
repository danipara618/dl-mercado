// Series curadas para la portada macro. El token oficial solo se usa en el servidor.
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Fila = Record<string, unknown>;
type Punto = { fecha: string; valor: number };
type Item = { id: string; titulo: string; subtitulo: string; unidad: string; fuente: string; puntos: Punto[]; estado: "ok" | "sin_datos"; aviso?: string };
type Def = { id: string; titulo: string; subtitulo: string; servicio: string; incluye: RegExp[]; excluye?: RegExp[]; unidad: string; fuente?: string };
const DEFINICIONES: Def[] = [
  {id:"canasta",titulo:"Canasta básica total",subtitulo:"GBA · Hogar tipo 2 · pesos por mes",servicio:"valorizacion_canastas_cba_cbt",incluye:[/cbt|canasta b[aá]sica total/i,/hogar\s*(tipo\s*)?2|hogar\s*ii|familia tipo 2|cuatro integrantes/i],excluye:[/variaci[oó]n|porcentaje|índice/i],unidad:"ARS"},
  {id:"emae",titulo:"Actividad económica",subtitulo:"EMAE · nivel general desestacionalizado",servicio:"estimador-mensual-de-actividad-economica-nivel-general",incluye:[/desestacionalizad/i,/nivel general|emae/i],excluye:[/variaci[oó]n|interanual|mensual|porcentaje/i],unidad:"Índice"},
  {id:"industria",titulo:"Producción industrial",subtitulo:"IPI manufacturero · nivel general",servicio:"ipi_manufacturero",incluye:[/nivel general/i,/original|índice|indice/i],excluye:[/variaci[oó]n|interanual|mensual|porcentaje/i],unidad:"Índice"},
  {id:"salarios",titulo:"Salarios",subtitulo:"Índice general de salarios",servicio:"indice_salarios",incluye:[/nivel general|total/i,/índice|indice|nivel/i],excluye:[/variaci[oó]n|interanual|mensual|porcentaje/i],unidad:"Índice"},
  {id:"empleo",titulo:"Desocupación",subtitulo:"EPH · 31 aglomerados · tasa trimestral",servicio:"mercado_trabajo_eph",incluye:[/desocupaci[oó]n/i],excluye:[/subocupaci[oó]n|variaci[oó]n|interanual/i],unidad:"%"},
  {id:"pobreza",titulo:"Pobreza",subtitulo:"Personas · 31 aglomerados · semestre",servicio:"pobreza_eph",incluye:[/pobreza/i,/personas/i],excluye:[/indigencia|variaci[oó]n/i],unidad:"%"},
  {id:"expo",titulo:"Exportaciones de bienes",subtitulo:"Total de exportaciones FOB · millones de USD",servicio:"comercio_exterior_exportacion_bienes",incluye:[/total/i],unidad:"Millones USD"},
  {id:"impo",titulo:"Importaciones de bienes",subtitulo:"Total de importaciones CIF · millones de USD",servicio:"comercio_exterior_importacion_bienes",incluye:[/total/i],unidad:"Millones USD"},
];

const txt = (x:unknown):string => x==null?"":String(x).trim();
function number(x:unknown):number|null {
  if(typeof x==="number")return Number.isFinite(x)?x:null;
  if(typeof x!=="string"||!x.trim())return null;
  const n=Number(x.replace(",","."));
  return Number.isFinite(n)?n:null;
}
function fecha(row:Fila):string|null {
  const raw=txt(row.periodo||row.fecha||row.periodo_referencia||row.anio||row.año);
  if(/^\d{4}-\d{2}/.test(raw))return raw.slice(0,7);
  if(/^\d{6}$/.test(raw))return raw.slice(0,4)+"-"+raw.slice(4);
  if(/^\d{4}$/.test(raw) && row.mes!=null && Number(row.mes)>=1 && Number(row.mes)<=12)return raw+"-"+String(row.mes).padStart(2,"0");
  if(/^\d{4}$/.test(raw))return raw;
  // Una frecuencia trimestral/semestral debe conservar su etiqueta, no inventarse un mes.
  if(/^\d{4}[- ]?[TSQ][1-4]$/i.test(raw))return raw;
  return null;
}
function descripcion(row:Fila):string {
  const campos=["indicador","descripcion","serie","tipo_de_indicador","region","division","capitulo","categoria","cuadro_web","unidad_de_medida","hogar","tipo_hogar","sector","agregado","tipo","concepto"];
  return campos.map(k=>txt(row[k])).filter(Boolean).join(" · ");
}
function datosSerie(rows:Fila[], d:Def):Punto[] {
  // Buscar únicamente observaciones con el mismo metadato completo.
  const grupos = new Map<string,{meta:string;puntos:Punto[]}>();
  for(const row of rows) {
    const meta=descripcion(row);
    if(!d.incluye.every(t=>t.test(meta))||d.excluye?.some(t=>t.test(meta)))continue;
    const f=fecha(row);const v=number(row.valor);
    if(!f||v===null)continue;
    const key=meta.toLowerCase().replace(/\s+/g," ").trim();
    const grupo=grupos.get(key)||{meta,puntos:[]};
    grupo.puntos.push({fecha:f,valor:v});grupos.set(key,grupo);
  }
  const candidatos=[...grupos.values()].map(g=>{
    const mapa=new Map<string,number[]>();
    for(const p of g.puntos)mapa.set(p.fecha,[...(mapa.get(p.fecha)||[]),p.valor]);
    const puntos=[...mapa.entries()].filter(([,values])=>values.length===1)
      .map(([fecha,values])=>({fecha,valor:values[0]})).sort((a,b)=>a.fecha.localeCompare(b.fecha));
    return {meta:g.meta,puntos};
  }).filter(c=>c.puntos.length>=3);
  // Un empate entre metadatos distintos no tiene selección estadísticamente segura.
  candidatos.sort((a,b)=>b.puntos.length-a.puntos.length);
  if(!candidatos.length||candidatos[1]?.puntos.length===candidatos[0]?.puntos.length)return [];
  return candidatos[0].puntos.slice(-36);
}
async function getDatos(d:Def):Promise<Item> {
 const empty:Item={id:d.id,titulo:d.titulo,subtitulo:d.subtitulo,unidad:d.unidad,fuente:d.fuente||"INDEC · Catálogo API-INDEC",puntos:[],estado:"sin_datos",aviso:"Todavía no hay una serie homogénea validada para mostrar."};
 const token=process.env.INDEC_API_TOKEN;
 if(!token)return {...empty,aviso:"Servicio oficial no configurado."};
 try{
   // Descarga acotada de dos páginas. Nunca se calcula un total a partir de registros parciales.
   const pages:Fila[]=[];
   for(const offset of [0,500]){
     const url=new URL("https://api.indec.gob.ar/v1/"+d.servicio);
     url.searchParams.set("limit","500");url.searchParams.set("offset",String(offset));
     const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),9000);
     let res:Response;
     try{res=await fetch(url.toString(),{headers:{Authorization:"Bearer "+token,Accept:"application/json"},signal:controller.signal,next:{revalidate:3600}});}
     finally{clearTimeout(timeout);}
     if(!res.ok)return {...empty,aviso:"La fuente oficial no respondió correctamente."};
     const raw:unknown=await res.json();
     if(!Array.isArray(raw))return {...empty,aviso:"Formato de datos pendiente de validación."};
     pages.push(...raw.filter((r):r is Fila=>r!=null&&typeof r==="object"&&!Array.isArray(r)));
     if(raw.length<500)break;
   }
   const puntos=datosSerie(pages,d);
   if(!puntos.length)return empty;
   return {...empty,puntos,estado:"ok",aviso:undefined};
 }catch{
   return {...empty,aviso:"Dato temporalmente no disponible."};
 }
}
async function getIpc():Promise<Item> {
 const base:Item={id:"ipc",titulo:"Inflación mensual",subtitulo:"IPC nacional · variación respecto del mes anterior",unidad:"%",fuente:"INDEC · distribución ArgentinaDatos",estado:"sin_datos",puntos:[]};
 try{
   const r=await fetch("https://api.argentinadatos.com/v1/finanzas/indices/inflacion",{next:{revalidate:21600}});
   if(!r.ok)return {...base,aviso:"IPC temporalmente no disponible."};
   const raw:unknown=await r.json();
   if(!Array.isArray(raw))return base;
   const puntos=raw.filter((x):x is Fila=>x!=null&&typeof x==="object"&&!Array.isArray(x))
     .map(x=>({fecha:fecha(x)||"",valor:number(x.valor)}))
     .filter((p):p is Punto=>/^\d{4}-\d{2}$/.test(p.fecha)&&p.valor!==null)
     .sort((a,b)=>a.fecha.localeCompare(b.fecha)).slice(-36);
   return puntos.length?{...base,puntos,estado:"ok"}:base;
 }catch{return {...base,aviso:"IPC temporalmente no disponible."};}
}
export async function GET(){
 const [ipc,...otros]=await Promise.all([getIpc(),...DEFINICIONES.map(getDatos)]);
 return NextResponse.json({indicadores:[ipc,...otros],actualizado:new Date().toISOString(),nota:"Se publican únicamente series con metadatos y unidades identificables; no se inventan ni agregan totales parciales."},
 {headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=7200"}});
}
