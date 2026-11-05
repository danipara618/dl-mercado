// Población proyectada total del país a partir de edades individuales y sexos.
// Se suman sólo años cuya cobertura haya sido auditada.
import {NextResponse} from "next/server";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Row={edad?:unknown;sexo_cod?:unknown;sexo_nom?:unknown;poblacion?:unknown;fecha?:unknown};
type Punto={fecha:string;valor:number};
const notConfigured=NextResponse.json({puntos:[],fuente:"INDEC",error:"Token no configurado"},{status:503});
async function poblacionAnio(anio:number,token:string):Promise<Punto|null>{
 const url=new URL("https://api.indec.gob.ar/v1/proyecciones_poblacion_nacional_2022_2040");
 url.searchParams.set("fecha","eq."+anio);url.searchParams.set("limit","1000");url.searchParams.set("offset","0");
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 let res:Response;
 try{res=await fetch(url.toString(),{headers:{Authorization:"Bearer "+token,Accept:"application/json"},signal:controller.signal,next:{revalidate:86400}});}
 finally{clearTimeout(timer);}
 if(!res.ok)return null;
 const raw:unknown=await res.json();
 // Si los datos exceden una página, está incompleto. No se suman muestras truncadas.
 if(!Array.isArray(raw)||raw.length===0||raw.length>=1000)return null;
 const sexo=new Map<string,Map<number,number>>();
 for(const x of raw){
  if(!x||typeof x!=="object"||Array.isArray(x))return null;
  const r=x as Row;
  const cod=String(r.sexo_cod??r.sexo_nom??"");
  const edad=Number(r.edad),n=Number(r.poblacion);
  if(!cod||!Number.isInteger(edad)||edad<0||edad>120||!Number.isFinite(n)||n<0||Number(r.fecha)!==anio)return null;
  const grupo=sexo.get(cod)||new Map<number,number>();
  if(grupo.has(edad))return null;
  grupo.set(edad,n);sexo.set(cod,grupo);
 }
 if(sexo.size!==2)return null;
 const counts=[...sexo.values()];
 const edadMax=Math.min(...counts.map(g=>Math.max(...g.keys())));
 // Sin la totalidad de edades (incluida la última categoría de edad avanzada), no se suma.
 if(edadMax<100||counts.some(g=>Array.from({length:101},(_,i)=>i).some(age=>!g.has(age))))return null;
 const total=counts.reduce((sum,g)=>sum+[...g.values()].reduce((a,b)=>a+b,0),0);
 return {fecha:String(anio),valor:Math.round(total)};
}
export async function GET(){
 const token=process.env.INDEC_API_TOKEN;
 if(!token)return notConfigured;
 try{
  const all=await Promise.all([2022,2023,2024,2025,2026].map(y=>poblacionAnio(y,token).catch(()=>null)));
  const puntos=all.filter((p):p is Punto=>!!p);
  return NextResponse.json({puntos: puntos.length>=2?puntos:[],fuente:"INDEC — Proyecciones nacionales de población, base Censo 2022",unidad:"personas",cobertura:"Total país · población por sexo y edad",aviso:puntos.length<2?"No se validó la cobertura de todas las edades.":undefined},{headers:{"Cache-Control":"public, s-maxage=86400, stale-while-revalidate=172800"}});
 }catch{return NextResponse.json({puntos:[],fuente:"INDEC",error:"Datos de población temporalmente no disponibles"},{status:503});}
}
