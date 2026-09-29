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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const meta = VARIABLES[id];
  if (!meta) return fail(`Variable ${id} no habilitada`, 404);

  const hasta = new Date();
  const desde = new Date(hasta.getTime() - 400 * 86_400_000);
  const q = `desde=${desde.toISOString().slice(0, 10)}&hasta=${hasta.toISOString().slice(0, 10)}&limit=1000`;
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
