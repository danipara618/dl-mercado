// GET /api/riesgo-pais/historico — serie diaria completa (EMBI Argentina, pb), orden cronológico
import { fetchJson, ok, fail, num } from "@/lib/server";
import type { Punto } from "@/lib/types";

export const dynamic = "force-dynamic";

const BASE = "https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais";

export async function GET() {
  try {
    const [historico, ultimo] = await Promise.all([
      fetchJson<{ fecha: string; valor: unknown }[]>(BASE, { revalidate: 3600 }),
      fetchJson<{ fecha: string; valor: unknown }>(`${BASE}/ultimo`, { revalidate: 60 }).catch(() => null),
    ]);

    // Deduplica por fecha (el último dato gana) y ordena ascendente
    const mapa = new Map<string, number>();
    for (const p of historico) {
      const v = num(p.valor);
      if (v !== null) mapa.set(p.fecha.slice(0, 10), v);
    }
    // El histórico se cachea 1 h: se le suma el último dato intradiario
    if (ultimo) {
      const v = num(ultimo.valor);
      if (v !== null) mapa.set(ultimo.fecha.slice(0, 10), v);
    }
    const data: Punto[] = [...mapa.entries()]
      .map(([fecha, valor]) => ({ fecha, valor }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    return ok(data, 300);
  } catch (e) {
    return fail(e);
  }
}
