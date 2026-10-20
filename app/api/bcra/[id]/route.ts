// GET /api/bcra/:id — variables monetarias del BCRA (API Estadísticas v4.0)
// Catálogo completo de IDs: https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias
import { fetchJson, fetchJsonInsecure, ok, fail } from "@/lib/server";
import type { BcraSerie, Punto } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Lista blanca: evita que la ruta funcione como proxy abierto. */
const VARIABLES: Record<number, { nombre: string; unidad: string }> = {
  1: { nombre: "Reservas internacionales", unidad: "MM USD" },
  4: { nombre: "Tipo de cambio minorista", unidad: "$/USD" },
  5: { nombre: "Tipo de cambio mayorista (A3500)", unidad: "$/USD" },
  7: { nombre: "BADLAR bancos privados", unidad: "% TNA" },
  27: { nombre: "Inflación mensual", unidad: "%" },
  28: { nombre: "Inflación interanual", unidad: "%" },
  29: { nombre: "Inflación esperada (REM, 12 m)", unidad: "%" },
  30: { nombre: "CER", unidad: "índice" },
  31: { nombre: "UVA", unidad: "$" },
  32: { nombre: "UVI", unidad: "$" },
};

/** Recorre cualquier forma de respuesta (v3 plana o v4 con `detalle`) y junta {fecha, valor}. */
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
  const unica = new Map(out.map((p) => [p.fecha, p.valor]));
  return [...unica.entries()].map(([fecha, valor]) => ({ fecha, valor })).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const meta = VARIABLES[id];
  if (!meta) return fail(`Variable ${id} no habilitada`, 404);

  // desde/hasta son opcionales: por defecto trae los últimos 400 días (alcanza para
  // KPIGrid, que solo usa el último valor). /series pide un rango de hasta 6 años
  // para graficar el histórico, así que acepta overrides por query string.
  const { searchParams } = new URL(req.url);
  const hastaParam = searchParams.get("hasta");
  const desdeParam = searchParams.get("desde");
  const hasta = hastaParam && /^\d{4}-\d{2}-\d{2}$/.test(hastaParam) ? hastaParam : new Date().toISOString().slice(0, 10);
  const desde =
    desdeParam && /^\d{4}-\d{2}-\d{2}$/.test(desdeParam)
      ? desdeParam
      : new Date(Date.now() - 400 * 86_400_000).toISOString().slice(0, 10);
  const q = `desde=${desde}&hasta=${hasta}&limit=3000`;
  const url = `https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias/${id}?${q}`;

  try {
    let json: unknown;
    try {
      json = await fetchJson(url, { revalidate: 3600 });
    } catch (e) {
      // Cadena TLS incompleta del BCRA → reintento sin validar certificado (opt-in por env)
      if (process.env.BCRA_INSECURE_TLS === "1") json = await fetchJsonInsecure(url);
      else throw e;
    }
    const serie = extraerSerie(json);
    const data: BcraSerie = { id, ...meta, serie, ultimo: serie.at(-1) ?? null, anterior: serie.at(-2) ?? null };
    return ok(data, 3600);
  } catch (e) {
    return fail(e);
  }
}
