// Normaliza la respuesta de cada tipo de endpoint de /lib/seriesCatalogo.ts a una
// forma común {serie, ultimo, anterior}. Usado tanto por SeriesCard (una serie)
// como por useDescargaTodo (todas, para el CSV combinado) — una sola fuente de verdad.
import type { BcraSerie, Indicadores, Punto } from "./types";
import type { SerieDef } from "./seriesCatalogo";

export function normalizarSerie(tipo: SerieDef["tipo"], raw: unknown): { serie: Punto[]; ultimo: Punto | null; anterior: Punto | null } {
  if (tipo === "dolar" || tipo === "riesgo") {
    const serie = (raw as Punto[]) ?? [];
    return { serie, ultimo: serie.at(-1) ?? null, anterior: serie.at(-2) ?? null };
  }
  if (tipo === "bcra" || tipo === "icl") {
    const d = raw as BcraSerie;
    return { serie: d?.serie ?? [], ultimo: d?.ultimo ?? null, anterior: d?.anterior ?? null };
  }
  const d = raw as Indicadores;
  const serie = d?.inflacionSerie ?? [];
  return { serie, ultimo: serie.at(-1) ?? null, anterior: serie.at(-2) ?? null };
}
