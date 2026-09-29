// ============================================================
//  Renta fija en pesos: clasificación por ticker y vencimiento
// ============================================================

const MESES: Record<string, number> = { E: 0, F: 1, M: 2, A: 3, Y: 4, J: 5, L: 6, G: 7, S: 8, O: 9, N: 10, D: 11 };

export type TipoPesos = "LECAP" | "BONCAP" | "CER" | "Dual" | "Dollar linked" | "Otros";

/** LECAP S31O5 → 31/10/2025 ; BONCAP T15E7 → 15/01/2027 */
export function vencimientoPorTicker(symbol: string): Date | null {
  const m = symbol.match(/^[ST](\d{2})([EFMAYJLGSOND])(\d)$/);
  if (!m) return null;
  let anio = 2020 + Number(m[3]);
  if (anio < new Date().getFullYear() - 2) anio += 10; // rollover de década
  return new Date(Date.UTC(anio, MESES[m[2]], Number(m[1])));
}

export function clasificar(symbol: string): TipoPesos | null {
  if (/^S\d{2}[A-Z]\d$/.test(symbol)) return "LECAP";
  if (/^T\d{2}[A-Z]\d$/.test(symbol)) return "BONCAP";
  if (/^(TX\d|TZX|T2X|DICP|PARP|CUAP|X\d)/.test(symbol)) return "CER";
  if (/^(TTM|TTJ|TTS|TTD)\d/.test(symbol)) return "Dual";
  if (/^(TZV|D\d{2}[A-Z]\d)/.test(symbol)) return "Dollar linked";
  return null;
}

export function diasAlVencimiento(v: Date | null): number | null {
  if (!v) return null;
  const hoy = new Date();
  const h = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((v.getTime() - h) / 86_400_000);
}
