import type { Punto } from "@/lib/types";
export type RentIndex="ipc"|"porcentaje";
export function ajusteIPC(monto:number,desde:string,hasta:string,serie:Punto[]){
 const puntos=serie.filter(p=>p.fecha.slice(0,7)>desde&&p.fecha.slice(0,7)<=hasta).sort((a,b)=>a.fecha.localeCompare(b.fecha));
 if(!monto||desde>hasta||(desde!==hasta&&!puntos.length)) return null;
 const factor=puntos.reduce((a,p)=>a*(1+p.valor/100),1);
 return {montoNuevo:monto*factor,aumento:(factor-1)*100,factor};
}
export function ajustePorcentaje(monto:number,porcentaje:number){
 const factor=1+porcentaje/100; return {montoNuevo:monto*factor,aumento:porcentaje,factor};
}
