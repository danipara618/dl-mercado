// ============================================================
//  Tipos compartidos entre API routes y componentes
// ============================================================

/** Respuesta estándar de todas las rutas internas /api/* */
export type ApiResponse<T> =
  | { ok: true; data: T; updatedAt: string }
  | { ok: false; error: string; updatedAt: string };

/** Punto de una serie diaria */
export interface Punto {
  fecha: string; // ISO yyyy-mm-dd
  valor: number;
}

/** Cotización de dólar (dolarapi.com) */
export interface Dolar {
  casa: string;
  nombre: string;
  compra: number | null;
  venta: number | null;
  fechaActualizacion: string;
}

/** Resumen de riesgo país con valor previo para calcular variación */
export interface RiesgoResumen {
  ultimo: Punto;
  anterior: Punto | null;
}

/** Serie del BCRA ya normalizada */
export interface BcraSerie {
  id: number;
  nombre: string;
  unidad: string;
  serie: Punto[];
  ultimo: Punto | null;
  anterior: Punto | null;
}

/** Cotización normalizada de data912 */
export interface Cotizacion {
  symbol: string;
  bid: number | null;
  ask: number | null;
  last: number | null;
  pctChange: number | null; // variación diaria en %
  volume: number | null;
  operaciones: number | null;
}

/** Indicadores macro de argentinadatos */
export interface Indicadores {
  inflacionMensual: Punto | null;
  inflacionInteranual: Punto | null;
  inflacionSerie: Punto[];
  plazoFijo: { promedioTna: number; bancos: { entidad: string; tna: number }[] } | null;
}

/** Cotización global de Yahoo Finance */
export interface GlobalQuote {
  symbol: string;
  nombre: string;
  grupo: string;
  precio: number | null;
  cierreAnterior: number | null;
  variacionPct: number | null;
  moneda: string | null;
  decimales: number;
  sufijo?: string;
}
