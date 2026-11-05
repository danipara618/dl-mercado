// Gráficos automáticos basados en series identificadas por las dimensiones de INDEC.
// Catálogo API-INDEC: las claves se validan antes de publicar valores.
import { NextResponse } from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";

type Row=Record<string,unknown>;
type Punto={fecha:string;valor:number};
type Item={id:string;titulo:string;subtitulo:string;unidad:string;fuente:string;puntos:Punto[];estado:"ok"|"sin_datos";aviso?:string};
type Def={id:string;titulo:string;subtitulo:string;unidad:string;servicio:string;filtros:Record<string,string>;valor?:string;frecuencia?:"mensual"|"trimestral"|"semestral"};
const defs:Def[]=[
 {id:"ipc",titulo:"Inflación mensual",subtitulo:"IPC nacional · variación mensual",unidad:"%",servicio:"ipc_nacional",filtros:{clasificador:"IPC",nivel:"Nivel General",codigo:"0",descripcion:"Nivel general",indicador:"IPC base Dic16=100",tipo_de_indicador:"v_m",tipo_de_indicador_descripcion:"Variación porcentual respecto del período anterior",region:"Nacional",unidad_de_medida:"Porcentaje"}},
 {id:"ipc-anual",titulo:"Inflación interanual",subtitulo:"IPC nacional · variación frente a igual mes del año anterior",unidad:"%",servicio:"ipc_nacional",filtros:{clasificador:"IPC",nivel:"Nivel General",codigo:"0",descripcion:"Nivel general",indicador:"IPC base Dic16=100",tipo_de_indicador:"v_ia",tipo_de_indicador_descripcion:"Variación porcentual respecto del mismo período del año anterior",region:"Nacional",unidad_de_medida:"Porcentaje"}},
 {id:"ipc-alimentos",titulo:"Precios de alimentos y bebidas",subtitulo:"IPC nacional · división alimentos y bebidas no alcohólicas",unidad:"%",servicio:"ipc_nacional",filtros:{descripcion:"Alimentos y bebidas no alcohólicas",tipo_de_indicador:"v_m",tipo_de_indicador_descripcion:"Variación porcentual respecto del período anterior",region:"Nacional",unidad_de_medida:"Porcentaje"}},
 {id:"cba",titulo:"Canasta básica alimentaria",subtitulo:"GBA · adulto equivalente · pesos mensuales",unidad:"ARS",servicio:"valorizacion_canastas_cba_cbt",filtros:{clasificador:"CBA y CBT",nivel:"Adulto equivalente",codigo:"CBA",descripcion:"Canasta Basica Alimentaria",indicador:"Canasta",tipo_de_indicador:"CBA",tipo_de_indicador_descripcion:"Valores mensuales por adulto equivalente, expresados en pesos",region:"GBA",unidad_de_medida:"Pesos argentinos"}},
 {id:"canasta",titulo:"Canasta básica total",subtitulo:"GBA · adulto equivalente · pesos mensuales",unidad:"ARS",servicio:"valorizacion_canastas_cba_cbt",filtros:{clasificador:"CBA y CBT",nivel:"Adulto equivalente",codigo:"CBT",descripcion:"Canasta Basica Total",indicador:"Canasta",tipo_de_indicador:"CBT",tipo_de_indicador_descripcion:"Valores mensuales por adulto equivalente, expresados en pesos",region:"GBA",unidad_de_medida:"Pesos argentinos"}},
 {id:"emae",titulo:"Actividad económica",subtitulo:"EMAE · serie desestacionalizada · base 2004=100",unidad:"Índice",servicio:"estimador-mensual-de-actividad-economica-nivel-general",filtros:{tipo_de_indicador:"Índice base 2004=100",tipo_de_indicador_descripcion:"Índice serie desestacionalizada"}},
 {id:"industria",titulo:"Producción industrial",subtitulo:"IPI manufacturero · nivel general · serie original",unidad:"Índice",servicio:"ipi_manufacturero",filtros:{descripcion:"Nivel general",serie:"Original",tipo_de_indicador:"Índice"}},
 {id:"empleo",titulo:"Desocupación",subtitulo:"31 aglomerados urbanos · tasa trimestral",unidad:"%",servicio:"mercado_trabajo_eph",filtros:{area_geografica_nom:"T_31_A"},valor:"tasa_de_desocupacion",frecuencia:"trimestral"},
 {id:"pobreza",titulo:"Pobreza",subtitulo:"Personas · 31 aglomerados · tasa semestral",unidad:"%",servicio:"pobreza_eph",filtros:{area_geografica_nom:"T_31_A"},valor:"tasa_pobreza_personas",frecuencia:"semestral"},
];
const extras:Item[]=[
 {id:"expo",titulo:"Exportaciones de bienes",subtitulo:"Exportaciones FOB por países y rubros · requiere agregación exhaustiva",unidad:"Millones USD",fuente:"INDEC · Catálogo API-INDEC",puntos:[],estado:"sin_datos",aviso:"El servicio entrega países y rubros desagregados. La portada no publica un total calculado a partir de muestras parciales."},
 {id:"impo",titulo:"Importaciones de bienes",subtitulo:"Importaciones CIF por países y usos · requiere agregación exhaustiva",unidad:"Millones USD",fuente:"INDEC · Catálogo API-INDEC",puntos:[],estado:"sin_datos",aviso:"El servicio entrega países y usos desagregados. Falta validar la cobertura completa antes de sumar."},
];
function texto(v:unknown):string{return v==null?"":String(v).trim();}
function numero(v:unknown):number|null {
 if(typeof v==="number")return Number.isFinite(v)?v:null;
 if(typeof v!=="string"||!v.trim())return null;
 const n=Number(v.replace(",","."));
 return Number.isFinite(n)?n:null;
}
function fecha(row:Row,f:Def["frecuencia"]):string|null {
 const raw=texto(row.periodo);
 if(f==="trimestral")return /^\d{4}[1-4]T$/.test(raw)?raw.slice(0,4)+"-T"+raw[4]:null;
 if(f==="semestral")return /^\d{4}[12]S$/.test(raw)?raw.slice(0,4)+"-S"+raw[4]:null;
 return /^\d{4}(0[1-9]|1[0-2])$/.test(raw)?raw.slice(0,4)+"-"+raw.slice(4):null;
}
function sinDatos(d:Def,aviso:string):Item{
 return {id:d.id,titulo:d.titulo,subtitulo:d.subtitulo,unidad:d.unidad,fuente:"INDEC · Catálogo API-INDEC",puntos:[],estado:"sin_datos",aviso};
}
async function serie(d:Def):Promise<Item> {
 const token=process.env.INDEC_API_TOKEN;
 if(!token)return sinDatos(d,"La conexión con INDEC todavía no está configurada.");
 try{
   const url=new URL("https://api.indec.gob.ar/v1/"+d.servicio);
   url.searchParams.set("limit","48");
   url.searchParams.set("offset","0");
   url.searchParams.set("order","periodo.desc");
   for(const [key,value] of Object.entries(d.filtros))url.searchParams.set(key,"eq."+value);
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),10000);
   let res:Response;
   try{
     res=await fetch(url.toString(),{headers:{Authorization:"Bearer "+token,Accept:"application/json"},signal:controller.signal,next:{revalidate:3600}});
   }finally{clearTimeout(timer);}
   if(!res.ok)return sinDatos(d,"INDEC no entregó este indicador ("+res.status+").");
   const raw:unknown=await res.json();
   if(!Array.isArray(raw))return sinDatos(d,"La respuesta no tiene el formato esperado.");
   const points:Punto[]=[];const fechas=new Set<string>();
   for(const v of raw){
     if(!v||typeof v!=="object"||Array.isArray(v))continue;
     const row=v as Row;
     if(Object.entries(d.filtros).some(([key,value])=>texto(row[key])!==value))continue;
     const f=fecha(row,d.frecuencia),valor=numero(row[d.valor||"valor"]);
     if(f&&valor!==null){if(fechas.has(f))return sinDatos(d,"Hay registros duplicados para el período; no se publican agregaciones ambiguas.");points.push({fecha:f,valor});fechas.add(f);}
   }
   points.sort((a,b)=>a.fecha.localeCompare(b.fecha));
   if(points.length<2)return sinDatos(d,"El servicio no devolvió suficientes períodos comparables.");
   return {...sinDatos(d,""),puntos:points,estado:"ok",aviso:undefined};
 }catch{return sinDatos(d,"La consulta oficial no está disponible en este momento.");}
}
export async function GET(){
 const indicators=await Promise.all(defs.map(serie));
 return NextResponse.json({indicadores:[...indicators,...extras],actualizado:new Date().toISOString(),nota:"Los gráficos muestran series preseleccionadas y verificadas; los totales no se reconstruyen desde muestras incompletas."},
 {headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=7200"}});
}
