export interface CompoundInput { capitalInicial:number; aporteMensual:number; tasaAnual:number; inflacionAnual:number; anios:number; }
export function interesCompuesto(i: CompoundInput) {
  const meses=Math.max(0,Math.round(i.anios*12));
  const r=Math.pow(1+i.tasaAnual/100,1/12)-1;
  let saldo=i.capitalInicial;
  const serie=[{mes:0,saldo,aportes:i.capitalInicial}];
  for(let m=1;m<=meses;m++){ saldo=saldo*(1+r)+i.aporteMensual; if(m%12===0||m===meses) serie.push({mes:m,saldo,aportes:i.capitalInicial+i.aporteMensual*m}); }
  const aportes=i.capitalInicial+i.aporteMensual*meses;
  const factorInflacion=Math.pow(1+i.inflacionAnual/100,i.anios);
  return {saldo,aportes,ganancia:saldo-aportes,saldoReal:factorInflacion>0?saldo/factorInflacion:saldo,serie};
}
export interface RetirementInput extends CompoundInput { edadActual:number; edadRetiro:number; capitalObjetivo:number; }
export function retiro(i: RetirementInput) {
  const anios=Math.max(0,i.edadRetiro-i.edadActual);
  const base=interesCompuesto({...i,anios});
  const cumplimiento=i.capitalObjetivo>0?base.saldoReal/i.capitalObjetivo*100:0;
  return {...base,anios,cumplimiento,brechaReal:Math.max(0,i.capitalObjetivo-base.saldoReal)};
}
