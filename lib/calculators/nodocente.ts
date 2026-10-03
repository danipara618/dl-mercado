export const BASICOS_REAL:Record<number,number>={1:2513751.46,2:2094792.88,3:1742867.68,4:1449596.68,5:1206600.70,6:1005500.58,7:837917.15};
export const BASICOS_LEY:Record<number,number>={1:3168686.43,2:2640572.03,3:2196955.92,4:1827275.84,5:1520969.49,6:1267474.57,7:1056228.81};
export const GRADO:Record<number,number>={1:150826.66,2:146637.27,3:139432.90,4:159459.89,5:168926.37,6:231265.13,7:226240.02};
export const GARANTIAS:Record<number,number>={1:0,2:0,3:0,4:70000,5:100000,6:150000,7:220000};
export type Titulo="0"|"secundario"|"0.10"|"0.20"|"0.25"|"0.30";
export interface NodocenteInput{categoria:number;antiguedad:number;titulo:Titulo;permanencia:number;asistencial:number;categoriaSuperior:number;aumento:number;grado:boolean;capacitacion:boolean;caja:boolean;riesgo:boolean;afiliado:boolean;sac:boolean}
export function calcularNodocente(i:NodocenteInput){
 const f=1+i.aumento/100,basico=BASICOS_REAL[i.categoria]*f,b7=BASICOS_REAL[7]*f;
 const antiguedad=basico*.02*i.antiguedad;
 const titulo=i.titulo==="secundario"?b7*.175:basico*Number(i.titulo);
 const grado=i.grado?GRADO[i.categoria]*f:0,capacitacion=i.capacitacion?basico*.10:0;
 const coef=i.permanencia>=8?.70:i.permanencia>=6?.45:i.permanencia>=4?.25:i.permanencia>=2?.10:0;
 const permanencia=coef?(i.categoria===1?basico*.37*coef:(BASICOS_REAL[i.categoria-1]*f-basico)*coef):0;
 const responsabilidad=i.categoriaSuperior>0&&i.categoriaSuperior<i.categoria?(BASICOS_REAL[i.categoriaSuperior]-BASICOS_REAL[i.categoria])*f:0;
 const caja=i.caja?b7*.25:0,riesgo=i.riesgo?basico*.10:0,asistencial=basico*i.asistencial,garantia=GARANTIAS[i.categoria];
 const remunerativo=basico+antiguedad+titulo+grado+capacitacion+permanencia+responsabilidad+caja+riesgo+asistencial,bruto=remunerativo+garantia;
 const jubilacion=remunerativo*.11,ley=remunerativo*.03,obra=remunerativo*.03,sindicato=i.afiliado?remunerativo*.02:0,seguro=3.80;
 const retenciones=jubilacion+ley+obra+sindicato+seguro;
 const sacBruto=i.sac?remunerativo/2:0,retSac=i.sac?sacBruto*(.17+(i.afiliado?.02:0)):0,sacNeto=sacBruto-retSac,neto=bruto-retenciones+sacNeto;
 return {basico,antiguedad,titulo,grado,capacitacion,permanencia,responsabilidad,caja,riesgo,asistencial,garantia,remunerativo,bruto,jubilacion,ley,obra,sindicato,seguro,retenciones,sacBruto,sacNeto,neto,basicoLey:BASICOS_LEY[i.categoria]*f};
}
export function ipcCompuesto(valores:number[]){return (valores.reduce((a,v)=>a*(1+v/100),1)-1)*100}
