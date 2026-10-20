// GET /api/dolares/historico/:casa — serie histórica diaria por casa (argentinadatos.com)
// Complementa /api/dolares (que solo trae el valor del día) para poder graficar la evolución.
import { fetchJson, ok, fail, num } from "@/lib/server";
import type { Punto } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Lista blanca: mismas casas que ya se muestran en KPIGrid/dolares. */
const CASAS = new Set(["oficial", "blue", "bolsa", "contadoconliqui", "mayorista", "cripto"]);

interface Raw {
  moneda: string;
  casa: string;
  fecha: string;
  compra: unknown;
  venta: unknown;
}

export async function GET(_req: Request, { params }: { params: Promise<{ casa: string }> }) {
  const casa = (await params).casa;
  if (!CASAS.has(casa)) return fail(`Casa "${casa}" no habilitada`, 404);

  const url = `https://api.argentinadatos.com/v1/cotizaciones/dolares/${casa}`;
  try {
    const raw = await fetchJson<Raw[]>(url, { revalidate: 1800 });
    const serie: Punto[] = raw
      .map((r) => ({ fecha: r.fecha.slice(0, 10), valor: num(r.venta) }))
      .filter((p): p is Punto => p.valor !== null)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    return ok(serie, 1800);
  } catch (e) {
    return fail(e);
  }
}
