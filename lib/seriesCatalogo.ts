// ============================================================
//  Catálogo de /series — qué indicadores se muestran, de dónde salen
//  y con qué color/unidad. Agregar una serie nueva es sumar una entrada acá.
// ============================================================

export type CategoriaSerie = "dolar" | "tasas" | "precios" | "riesgo" | "bonos";

/** Cómo se interpreta la respuesta JSON del endpoint para sacar la serie de puntos. */
export type TipoSerie = "bcra" | "dolar" | "riesgo" | "icl" | "inflacion" | "docta-bono" | "docta-fci";

export interface SerieDef {
  slug: string;
  categoria: CategoriaSerie;
  titulo: string;
  unidad: string;
  tipo: TipoSerie;
  endpoint: string;
  color: string;
  decimales?: number;
  /** Intervalo de refresco en el cliente (ms). 0 = solo al montar. */
  refreshMs: number;
}

export const CATEGORIAS: Record<CategoriaSerie, { titulo: string; color: string; subtitulo: string }> = {
  dolar: { titulo: "Dólar", color: "#2a78d6", subtitulo: "Cotizaciones diarias por tipo de cambio — últimos 6 años." },
  tasas: { titulo: "Tasas y reservas (BCRA)", color: "#eb6834", subtitulo: "Variables monetarias del BCRA (API Estadísticas v4.0) — últimos 6 años." },
  precios: { titulo: "Precios y expectativas", color: "#1baf7a", subtitulo: "Inflación observada y esperada, y tasas de plazo fijo." },
  riesgo: { titulo: "Riesgo país", color: "#008300", subtitulo: "Spread EMBI Argentina — últimos 6 años." },
  bonos: { titulo: "Bonos y FCI (Docta)", color: "#7c4fb0", subtitulo: "Rendimiento de bonos soberanos y valor de cuotaparte de fondos — vía Docta Capital." },
};

/**
 * Rampas de un solo matiz por categoría (más oscuro = más abajo en la lista de esa
 * categoría), para que las tarjetas de una misma sección se distingan entre sí sin
 * dejar de leerse como "la misma familia". Calculadas mezclando el color de anchor
 * de la categoría hacia la tinta de marca (#1A1A1A) en espacio OKLCH y validadas con
 * el validador de paletas del skill de dataviz (--ordinal): luminosidad monótona,
 * salto >= 0.06 entre pasos contiguos, matiz estable (spread <= 5°) y el paso más
 * claro (el anchor) con contraste >= 2:1 contra la tarjeta blanca. No son valores
 * "a ojo": node scripts/validate_palette.js "<rampa>" --ordinal --surface "#ffffff".
 */
const RAMPA_DOLAR = ["#2a78d6", "#2a65af", "#295389", "#264266", "#223044", "#1c1f24"];
const RAMPA_TASAS = ["#eb6834", "#c05932", "#964b2f", "#6e3c2a", "#492e24", "#251f1d"];
const RAMPA_PRECIOS = ["#1baf7a", "#298660", "#2a6047"];
const RAMPA_BONOS = ["#7c4fb0", "#614287", "#483560"];

function colorRampa(rampa: string[], i: number): string {
  return rampa[i % rampa.length];
}

/** Ventana de tiempo uniforme para todas las series de /series — ver SeriesCard. */
export const SEIS_ANIOS_DIAS = 365 * 6;

function isoHoy(): string {
  return new Date().toISOString().slice(0, 10);
}
function isoHace(dias: number): string {
  return new Date(Date.now() - dias * 86_400_000).toISOString().slice(0, 10);
}
function bcraUrl(id: number): string {
  return `/api/bcra/${id}?desde=${isoHace(SEIS_ANIOS_DIAS)}&hasta=${isoHoy()}`;
}
function doctaBonoUrl(symbol: string): string {
  return `/api/docta/bonds/${symbol}?desde=${isoHace(SEIS_ANIOS_DIAS)}&hasta=${isoHoy()}`;
}
function doctaFciUrl(fondo: string): string {
  return `/api/docta/fci/${encodeURIComponent(fondo)}?desde=${isoHace(SEIS_ANIOS_DIAS)}&hasta=${isoHoy()}`;
}

export const CATALOGO: SerieDef[] = [
  // --- Dólar (histórico diario completo, argentinadatos.com) ------
  { slug: "dolar-oficial", categoria: "dolar", titulo: "Dólar oficial (BNA)", unidad: "$", tipo: "dolar", endpoint: "/api/dolares/historico/oficial", color: colorRampa(RAMPA_DOLAR, 0), refreshMs: 300_000 },
  { slug: "dolar-blue", categoria: "dolar", titulo: "Dólar blue", unidad: "$", tipo: "dolar", endpoint: "/api/dolares/historico/blue", color: colorRampa(RAMPA_DOLAR, 1), refreshMs: 300_000 },
  { slug: "dolar-mep", categoria: "dolar", titulo: "Dólar MEP", unidad: "$", tipo: "dolar", endpoint: "/api/dolares/historico/bolsa", color: colorRampa(RAMPA_DOLAR, 2), refreshMs: 300_000 },
  { slug: "dolar-ccl", categoria: "dolar", titulo: "Dólar CCL", unidad: "$", tipo: "dolar", endpoint: "/api/dolares/historico/contadoconliqui", color: colorRampa(RAMPA_DOLAR, 3), refreshMs: 300_000 },
  { slug: "dolar-mayorista", categoria: "dolar", titulo: "Dólar mayorista", unidad: "$", tipo: "dolar", endpoint: "/api/dolares/historico/mayorista", color: colorRampa(RAMPA_DOLAR, 4), refreshMs: 300_000 },
  { slug: "dolar-cripto", categoria: "dolar", titulo: "Dólar cripto", unidad: "$", tipo: "dolar", endpoint: "/api/dolares/historico/cripto", color: colorRampa(RAMPA_DOLAR, 5), refreshMs: 300_000 },

  // --- Tasas y reservas (BCRA) — 6 años vía ?desde=&hasta= ---------
  { slug: "reservas", categoria: "tasas", titulo: "Reservas internacionales", unidad: "MM USD", tipo: "bcra", endpoint: bcraUrl(1), color: colorRampa(RAMPA_TASAS, 0), decimales: 0, refreshMs: 1_800_000 },
  { slug: "tc-minorista", categoria: "tasas", titulo: "Tipo de cambio minorista (BCRA)", unidad: "$/USD", tipo: "bcra", endpoint: bcraUrl(4), color: colorRampa(RAMPA_TASAS, 1), refreshMs: 1_800_000 },
  { slug: "tc-mayorista", categoria: "tasas", titulo: "Tipo de cambio mayorista (A3500)", unidad: "$/USD", tipo: "bcra", endpoint: bcraUrl(5), color: colorRampa(RAMPA_TASAS, 2), refreshMs: 1_800_000 },
  { slug: "badlar", categoria: "tasas", titulo: "BADLAR bancos privados", unidad: "% TNA", tipo: "bcra", endpoint: bcraUrl(7), color: colorRampa(RAMPA_TASAS, 3), refreshMs: 1_800_000 },
  { slug: "cer", categoria: "tasas", titulo: "CER", unidad: "índice", tipo: "bcra", endpoint: bcraUrl(30), color: colorRampa(RAMPA_TASAS, 4), decimales: 4, refreshMs: 1_800_000 },
  { slug: "uva", categoria: "tasas", titulo: "UVA", unidad: "$", tipo: "bcra", endpoint: bcraUrl(31), color: colorRampa(RAMPA_TASAS, 5), decimales: 4, refreshMs: 1_800_000 },
  { slug: "uvi", categoria: "tasas", titulo: "UVI", unidad: "$", tipo: "bcra", endpoint: bcraUrl(32), color: colorRampa(RAMPA_TASAS, 0), decimales: 4, refreshMs: 1_800_000 },
  { slug: "icl", categoria: "tasas", titulo: "ICL (índice de contratos de locación)", unidad: "índice", tipo: "icl", endpoint: `/api/icl?desde=${isoHace(SEIS_ANIOS_DIAS)}&hasta=${isoHoy()}`, color: colorRampa(RAMPA_TASAS, 1), decimales: 4, refreshMs: 1_800_000 },

  // --- Precios y expectativas ---------------------------------------
  { slug: "inflacion-mensual", categoria: "precios", titulo: "Inflación mensual (IPC)", unidad: "%", tipo: "inflacion", endpoint: "/api/indicadores", color: colorRampa(RAMPA_PRECIOS, 0), refreshMs: 1_800_000 },
  { slug: "inflacion-interanual", categoria: "precios", titulo: "Inflación interanual", unidad: "%", tipo: "bcra", endpoint: bcraUrl(28), color: colorRampa(RAMPA_PRECIOS, 1), refreshMs: 1_800_000 },
  { slug: "inflacion-esperada", categoria: "precios", titulo: "Inflación esperada (REM, 12 m)", unidad: "%", tipo: "bcra", endpoint: bcraUrl(29), color: colorRampa(RAMPA_PRECIOS, 2), refreshMs: 1_800_000 },

  // --- Riesgo país (histórico diario completo, argentinadatos.com) --
  { slug: "riesgo-pais", categoria: "riesgo", titulo: "Riesgo país (EMBI)", unidad: "pb", tipo: "riesgo", endpoint: "/api/riesgo-pais/historico", color: CATEGORIAS.riesgo.color, decimales: 0, refreshMs: 300_000 },

  // --- Bonos y FCI (Docta Capital) ------------------------------------
  { slug: "bono-gd30", categoria: "bonos", titulo: "Bono GD30 (rendimiento)", unidad: "% TIR", tipo: "docta-bono", endpoint: doctaBonoUrl("GD30"), color: colorRampa(RAMPA_BONOS, 0), decimales: 2, refreshMs: 1_800_000 },
  { slug: "bono-al30", categoria: "bonos", titulo: "Bono AL30 (rendimiento)", unidad: "% TIR", tipo: "docta-bono", endpoint: doctaBonoUrl("AL30"), color: colorRampa(RAMPA_BONOS, 1), decimales: 2, refreshMs: 1_800_000 },
  { slug: "fci-mercado-fondo", categoria: "bonos", titulo: "Mercado Fondo - Clase A (FCI)", unidad: "$ VCP", tipo: "docta-fci", endpoint: doctaFciUrl("Mercado Fondo - Clase A"), color: colorRampa(RAMPA_BONOS, 2), decimales: 2, refreshMs: 1_800_000 },
];
