// Normaliza la respuesta de cada tipo de endpoint de /lib/seriesCatalogo.ts a una
// forma común {serie, ultimo, anterior}. Usado tanto por SeriesCard (una serie)
// como por useDescargaTodo (todas, para el CSV combinado) — una sola fuente de verdad.
import type { BcraSerie, Indicadores, Punto } from "./types";
import type { SerieDef } from "./seriesCatalogo";
import { SEIS_ANIOS_DIAS } from "./seriesCatalogo";

/**
 * /api/dolares/historico y /api/riesgo-pais/historico devuelven TODO el histórico
 * disponible (no aceptan desde/hasta), a diferencia de /api/bcra/:id e /api/icl que
 * ya piden solo 6 años por query string. Este recorte homogeneiza la ventana que se
 * ve en /series sin importar de dónde vino el dato.
 */
function recortarAUltimosAnios(serie: Punto[]): Punto[] {
  if (!serie.length) return serie;
  const corte = new Date(Date.now() - SEIS_ANIOS_DIAS * 86_400_000).toISOString().slice(0, 10);
  const recortada = serie.filter((p) => p.fecha >= corte);
  return recortada.length ? recortada : serie;
}

export function normalizarSerie(tipo: SerieDef["tipo"], raw: unknown): { serie: Punto[]; ultimo: Punto | null; anterior: Punto | null } {
  let serie: Punto[];
  if (tipo === "dolar" || tipo === "riesgo") {
    serie = (raw as Punto[]) ?? [];
  } else if (tipo === "bcra" || tipo === "icl" || tipo === "docta-bono" || tipo === "docta-fci") {
    serie = (raw as BcraSerie)?.serie ?? [];
  } else {
    serie = (raw as Indicadores)?.inflacionSerie ?? [];
  }
  serie = recortarAUltimosAnios(serie);
  return { serie, ultimo: serie.at(-1) ?? null, anterior: serie.at(-2) ?? null };
}
