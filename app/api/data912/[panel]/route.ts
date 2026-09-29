// GET /api/data912/:panel — cotizaciones en vivo de data912.com (BYMA, con demora)
import { fetchJson, ok, fail, num } from "@/lib/server";
import type { Cotizacion } from "@/lib/types";

export const dynamic = "force-dynamic";

const PANELES = new Set(["arg_bonds", "arg_notes", "arg_corp", "arg_stocks", "arg_cedears", "usa_adrs", "usa_stocks"]);

interface Raw {
  symbol: string;
  px_bid?: unknown;
  px_ask?: unknown;
  c?: unknown;
  pct_change?: unknown;
  v?: unknown;
  q_op?: unknown;
}

export async function GET(_req: Request, { params }: { params: Promise<{ panel: string }> }) {
  const panel = (await params).panel;
  if (!PANELES.has(panel)) return fail(`Panel ${panel} no habilitado`, 404);
  try {
    const raw = await fetchJson<Raw[]>(`https://data912.com/live/${panel}`, { revalidate: 60 });
    const data: Cotizacion[] = raw
      .filter((r) => typeof r.symbol === "string")
      .map((r) => ({
        symbol: r.symbol,
        bid: num(r.px_bid),
        ask: num(r.px_ask),
        last: num(r.c),
        pctChange: num(r.pct_change),
        volume: num(r.v),
        operaciones: num(r.q_op),
      }));
    return ok(data, 60);
  } catch (e) {
    return fail(e);
  }
}
