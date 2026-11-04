// Cálculos con datos mensuales oficiales o derivados. Sin interpolar períodos faltantes.
export type DatoMensual = { mes: string; valor: number };
export function aMes(s: string): string | null {
  const t=s.trim();
  if (/^\d{6}$/.test(t)) return t.slice(0,4)+"-"+t.slice(4);
  if (/^\d{4}-\d{2}/.test(t)) return t.slice(0,7);
  return null;
}
export function validos(datos:DatoMensual[]):DatoMensual[] {
  return [...new Map(datos.filter(x=>/^\d{4}-\d{2}$/.test(x.mes)&&Number.isFinite(x.valor))
    .map(x=>[x.mes,x] as const)).values()].sort((a,b)=>a.mes.localeCompare(b.mes));
}
export function mesesEntre(inicial:string,final:string):string[] {
 const [a,m]=inicial.split("-").map(Number),[b,n]=final.split("-").map(Number);
 if(!a||!m||!b||!n||m>12||n>12||final<inicial)return [];
 const count=(b-a)*12+n-m;
 if(count>600)return [];
 return Array.from({length:count+1},(_,i)=>{const k=a*12+m-1+i;return String(Math.floor(k/12)).padStart(4,"0")+"-"+String(k%12+1).padStart(2,"0");});
}
export function factorInflacion(serie:DatoMensual[],desde:string,hasta:string):number|null {
 if(!desde||!hasta||hasta<desde)return null;
 if(desde===hasta)return 1;
 const rango=mesesEntre(desde,hasta).slice(1);
 const datos=new Map(validos(serie).map(x=>[x.mes,x.valor]));
 if(!rango.length||rango.some(m=>!datos.has(m)))return null;
 const f=rango.reduce((acc,mes)=>acc*(1+datos.get(mes)!/100),1);
 return f>0&&Number.isFinite(f)?f:null;
}
export function factorNiveles(serie:DatoMensual[],desde:string,hasta:string):number|null {
 const map=new Map(validos(serie).map(x=>[x.mes,x.valor]));
 const a=map.get(desde),b=map.get(hasta);
 return a!=null&&b!=null&&a>0&&b>0?b/a:null;
}
export function formatearNumero(n:number,d=1){return new Intl.NumberFormat("es-AR",{maximumFractionDigits:d,minimumFractionDigits:d}).format(n);}
export function moneda(n:number){return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n);}
export function leerFilasIndec(datos:unknown):Record<string,unknown>[] {
 const raw=datos as {rows?:unknown};
 return Array.isArray(raw?.rows)?raw.rows.filter((r):r is Record<string,unknown>=>!!r&&typeof r==="object"&&!Array.isArray(r)):[];
}
function texto(v:unknown){return v===null||v===undefined?"":String(v).trim();}
function num(v:unknown):number|null {if(typeof v==="number")return Number.isFinite(v)?v:null;if(typeof v==="string"&&v.trim()){const n=Number(v.replace(",","."));return Number.isFinite(n)?n:null;}return null;}
export type DatoCanasta={mes:string;valor:number;etiqueta:string};
export function canastasINDEC(rows:Record<string,unknown>[]):DatoCanasta[] {
 const candidates:DatoCanasta[]=[];
 for(const row of rows){
  const mes=aMes(texto(row.periodo||row.fecha));if(!mes)continue;
  const keys=["indicador","descripcion","tipo_de_indicador","concepto","canasta","hogar","tipo_hogar","region","unidad_de_medida"];
  const full=keys.map(k=>texto(row[k])).join(" ").toLowerCase();
  // Evitar mezclar variaciones con niveles de canasta y sumar hogares distintos.
  if(!/(cbt|canasta básica total|canasta basica total)/i.test(full))continue;
  if(/variaci[oó]n|porcentaje|índice|indice/i.test(full))continue;
  const hogar=texto(row.hogar||row.tipo_hogar||row.descripcion);
  if(hogar && !/hogar\s*2|tipo\s*2|familia\s*tipo\s*2|4\s*integrantes|cuatro\s*integrantes/i.test(hogar))continue;
  const valor=num(row.valor);if(valor==null||valor<=0)continue;
  candidates.push({mes,valor,etiqueta:full.slice(0,150)});
 }
 // Nunca escoger arbitrariamente una de varias observaciones del mismo mes.
 const groups=new Map<string,DatoCanasta[]>();for(const c of candidates)groups.set(c.mes,[...(groups.get(c.mes)||[]),c]);
 return [...groups.entries()].filter(([,v])=>v.length===1).map(([,v])=>v[0]).sort((a,b)=>a.mes.localeCompare(b.mes));
}
export type Regional={mes:string;region:string;division:string;variacion:number};
export function ipcRegional(rows:Record<string,unknown>[]):Regional[]{
 const out:Regional[]=[];
 for(const row of rows){
  const mes=aMes(texto(row.periodo||row.fecha));if(!mes)continue;
  const region=texto(row.region||row.región);
  const division=texto(row.division||row.división||row.descripcion)||"Nivel general";
  const meta=["indicador","tipo_de_indicador","serie","unidad_de_medida"].map(k=>texto(row[k])).join(" ").toLowerCase();
  // Solo tasas mensuales, nunca niveles, acumulados o variaciones interanuales.
  if(!/(mensual|intermensual)/i.test(meta)||/interanual|acumulad|anual/i.test(meta))continue;
  const v=num(row.valor);if(v===null||v<=-100||v>500||!region)continue;
  out.push({mes,region,division,variacion:v});
 }
 // Excluir pares duplicados en vez de deducir cuál es el correcto.
 const groups=new Map<string,Regional[]>();
 for(const x of out){const k=[x.mes,x.region,x.division].join("|");groups.set(k,[...(groups.get(k)||[]),x]);}
 return [...groups.values()].filter(v=>v.length===1).map(v=>v[0]);
}
