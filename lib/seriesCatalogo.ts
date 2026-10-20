// ============================================================
//  Catálogo de /series — qué indicadores se muestran, de dónde salen
//  y con qué color/unidad. Agregar una serie nueva es sumar una entrada acá.
// ============================================================

export type CategoriaSerie = "dolar" | "tasas" | "precios" | "riesgo";

/** Cómo se interpreta la respuesta JSON del endpoint para sacar la serie de puntos. */
export type TipoSerie = "bcra" | "dolar" | "riesgo" | "icl" | "inflacion";

export interface SerieDef {
  slug: string;
  categoria: CategoriaSerie;
  titulo: string;
  unidad: string;
  tipo: TipoSerie;
  endpoint: string;
  decimales?: number;
  /** Intervalo de refresco en el cliente (ms). 0 = solo al montar. */
  refreshMs: number;
}

export const CATEGORIAS: Record<CategoriaSerie, { titulo: string; color: string; subtitulo: string }> = {
  dolar: {
    titulo: "Dólar",
    color: "var(--color-serie-dolar)",
    subtitulo: "Cotizaciones diarias por tipo de cambio.",
  },
  tasas: {
    titulo: "Tasas y reservas (BCRA)",
    color: "var(--color-serie-tasas)",
    subtitulo: "Variables monetarias publicadas por el BCRA — API Estadísticas v4.0.",
  },
  precios: {
    titulo: "Precios y expectativas",
    color: "var(--color-serie-precios)",
    subtitulo: "Inflación observada y esperada, y tasas de plazo fijo.",
  },
  riesgo: {
    titulo: "Riesgo país",
    color: "var(--color-serie-riesgo)",
    subtitulo: "Spread EMBI Argentina, serie diaria completa.",
  },
};

export const CATALOGO: SerieDef[] = [
  // --- Dólar ---------------------------------------------------
  { slug: "dolar-oficial", categoria: "dolar", titulo: "Dólar oficial (BNA)", unidad: "$", tipo: "dolar", endpoint: "/api/dolares/historico/oficial", refreshMs: 300_000 },
  { slug: "dolar-blue", categoria: "dolar", titulo: "Dólar blue", unidad: "$", tipo: "dolar", endpoint: "/api/dolares/historico/blue", refreshMs: 300_000 },
  { slug: "dolar-mep", categoria: "dolar", titulo: "Dólar MEP", unidad: "$", tipo: "dolar", endpoint: "/api/dolares/historico/bolsa", refreshMs: 300_000 },
  { slug: "dolar-ccl", categoria: "dolar", titulo: "Dólar CCL", unidad: "$", tipo: "dolar", endpoint: "/api/dolares/historico/contadoconliqui", refreshMs: 300_000 },
  { slug: "dolar-mayorista", categoria: "dolar", titulo: "Dólar mayorista", unidad: "$", tipo: "dolar", endpoint: "/api/dolares/historico/mayorista", refreshMs: 300_000 },
  { slug: "dolar-cripto", categoria: "dolar", titulo: "Dólar cripto", unidad: "$", tipo: "dolar", endpoint: "/api/dolares/historico/cripto", refreshMs: 300_000 },

  // --- Tasas y reservas (BCRA) -----------------------------------
  { slug: "reservas", categoria: "tasas", titulo: "Reservas internacionales", unidad: "MM USD", tipo: "bcra", endpoint: "/api/bcra/1", decimales: 0, refreshMs: 1_800_000 },
  { slug: "tc-minorista", categoria: "tasas", titulo: "Tipo de cambio minorista (BCRA)", unidad: "$/USD", tipo: "bcra", endpoint: "/api/bcra/4", refreshMs: 1_800_000 },
  { slug: "tc-mayorista", categoria: "tasas", titulo: "Tipo de cambio mayorista (A3500)", unidad: "$/USD", tipo: "bcra", endpoint: "/api/bcra/5", refreshMs: 1_800_000 },
  { slug: "badlar", categoria: "tasas", titulo: "BADLAR bancos privados", unidad: "% TNA", tipo: "bcra", endpoint: "/api/bcra/7", refreshMs: 1_800_000 },
  { slug: "cer", categoria: "tasas", titulo: "CER", unidad: "índice", tipo: "bcra", endpoint: "/api/bcra/30", decimales: 4, refreshMs: 1_800_000 },
  { slug: "uva", categoria: "tasas", titulo: "UVA", unidad: "$", tipo: "bcra", endpoint: "/api/bcra/31", decimales: 4, refreshMs: 1_800_000 },
  { slug: "uvi", categoria: "tasas", titulo: "UVI", unidad: "$", tipo: "bcra", endpoint: "/api/bcra/32", decimales: 4, refreshMs: 1_800_000 },
  { slug: "icl", categoria: "tasas", titulo: "ICL (índice de contratos de locación)", unidad: "índice", tipo: "icl", endpoint: `/api/icl?desde=${isoHace(400)}&hasta=${isoHoy()}`, decimales: 4, refreshMs: 1_800_000 },

  // --- Precios y expectativas -----------------------------------
  { slug: "inflacion-mensual", categoria: "precios", titulo: "Inflación mensual (IPC)", unidad: "%", tipo: "inflacion", endpoint: "/api/indicadores", refreshMs: 1_800_000 },
  { slug: "inflacion-interanual", categoria: "precios", titulo: "Inflación interanual", unidad: "%", tipo: "bcra", endpoint: "/api/bcra/28", refreshMs: 1_800_000 },
  { slug: "inflacion-esperada", categoria: "precios", titulo: "Inflación esperada (REM, 12 m)", unidad: "%", tipo: "bcra", endpoint: "/api/bcra/29", refreshMs: 1_800_000 },

  // --- Riesgo país ------------------------------------------------
  { slug: "riesgo-pais", categoria: "riesgo", titulo: "Riesgo país (EMBI)", unidad: "pb", tipo: "riesgo", endpoint: "/api/riesgo-pais/historico", decimales: 0, refreshMs: 300_000 },
];

function isoHoy(): string {
  return new Date().toISOString().slice(0, 10);
}
function isoHace(dias: number): string {
  return new Date(Date.now() - dias * 86_400_000).toISOString().slice(0, 10);
}
