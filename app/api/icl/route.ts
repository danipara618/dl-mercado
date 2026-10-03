import { fetchJson, fetchJsonInsecure, ok, fail } from "@/lib/server";
import type { Punto } from "@/lib/types";

export const dynamic = "force-dynamic";

function extraerSerie(json: unknown): Punto[] {
  const out: Punto[] = [];
  const walk = (n: unknown) => {
    if (Array.isArray(n)) n.forEach(walk);
    else if (n && typeof n === "object") {
      const o = n as Record<string, unknown>;
      if (typeof o.fecha === "string" && typeof o.valor === "number") out.push({ fecha: o.fecha.slice(0, 10), valor: o.valor });
      else Object.values(o).forEach(walk);
    }
  };
  walk((json as { results?: unknown })?.results ?? json);
  return [...new Map(out.map(p => [p.fecha, p.valor])).entries()].map(([fecha, valor]) => ({ fecha, valor })).sort((a,b)=>a.fecha.localeCompare(b.fecha));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  if (!desde || !hasta || !/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta) || desde > hasta)
    return fail("Fechas inválidas", 400);
  const url = `https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias/40?desde=${desde}&hasta=${hasta}&limit=5000`;
  try {
    let json: unknown;
    try { json = await fetchJson(url, { revalidate: 3600 }); }
    catch (e) { if (process.env.BCRA_INSECURE_TLS === "1") json = await fetchJsonInsecure(url); else throw e; }
    const serie = extraerSerie(json);
    return ok({ nombre:"Índice para Contratos de Locación", unidad:"índice", serie, ultimo:serie.at(-1)??null }, 3600);
  } catch(e) { return fail(e); }
}
