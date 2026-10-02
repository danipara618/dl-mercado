import { fetchJson, ok, fail, num } from "@/lib/server";

export const dynamic = "force-dynamic";

type YahooChart = {
  chart: {
    result: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
      meta?: { currency?: string };
    }> | null;
  };
};

const RANGOS: Record<string,{range:string;interval:string}> = {
  "1m": {range:"1mo", interval:"1d"},
  "6m": {range:"6mo", interval:"1d"},
  "1y": {range:"1y", interval:"1d"},
  "5y": {range:"5y", interval:"1wk"},
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = (searchParams.get("symbol") ?? "").trim().toUpperCase();
    const market = searchParams.get("market") ?? "arg_stocks";
    const rango = searchParams.get("range") ?? "6m";
    if (!raw || !/^[A-Z0-9.\-^=]+$/.test(raw)) return fail("Símbolo inválido", 400);
    const cfg = RANGOS[rango] ?? RANGOS["6m"];
    const symbol = market === "arg_stocks" || market === "arg_cedears" ? `${raw}.BA` : raw;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${cfg.range}&interval=${cfg.interval}&events=history`;
    const j = await fetchJson<YahooChart>(url,{revalidate:300,timeoutMs:8000});
    const r = j.chart.result?.[0];
    if (!r) throw new Error("Sin historial");
    const ts=r.timestamp??[], close=r.indicators?.quote?.[0]?.close??[];
    const serie=ts.map((t,i)=>({fecha:new Date(t*1000).toISOString().slice(0,10),valor:num(close[i])})).filter(x=>x.valor!==null);
    return ok({symbol:raw,yahooSymbol:symbol,currency:r.meta?.currency??null,serie},300);
  } catch(e){ return fail(e); }
}
