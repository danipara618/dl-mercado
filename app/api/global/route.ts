// GET /api/global — mercados globales vía Yahoo Finance (endpoint v8 /chart, no requiere crumb)
import { fetchJson, ok, fail, num } from "@/lib/server";
import { GRUPOS_GLOBALES } from "@/lib/tickers";
import type { GlobalQuote } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ChartResp {
  chart: { result: { meta: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number; currency?: string } }[] | null };
}

async function cotizar(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
  const j = await fetchJson<ChartResp>(url, { revalidate: 120, timeoutMs: 8000 });
  const meta = j.chart.result?.[0]?.meta;
  if (!meta) throw new Error(`Sin datos para ${symbol}`);
  return {
    precio: num(meta.regularMarketPrice),
    prev: num(meta.chartPreviousClose ?? meta.previousClose),
    moneda: meta.currency ?? null,
  };
}

export async function GET() {
  try {
    const defs = Object.entries(GRUPOS_GLOBALES).flatMap(([grupo, lista]) => lista.map((t) => ({ ...t, grupo })));
    const res = await Promise.allSettled(defs.map((d) => cotizar(d.symbol)));
    const data: GlobalQuote[] = defs.map((d, i) => {
      const r = res[i];
      const q = r.status === "fulfilled" ? r.value : { precio: null, prev: null, moneda: null };
      return {
        symbol: d.symbol,
        nombre: d.nombre,
        grupo: d.grupo,
        precio: q.precio,
        cierreAnterior: q.prev,
        variacionPct: q.precio !== null && q.prev ? (q.precio / q.prev - 1) * 100 : null,
        moneda: q.moneda,
        decimales: d.decimales ?? 2,
        sufijo: d.sufijo,
      };
    });
    if (data.every((d) => d.precio === null)) throw new Error("Yahoo Finance no respondió");
    return ok(data, 120);
  } catch (e) {
    return fail(e);
  }
}
