// GET /api/riesgo-pais — último valor + valor previo (para la variación diaria)
import { fetchJson, ok, fail, num } from "@/lib/server";
import type { Punto, RiesgoResumen } from "@/lib/types";

export const dynamic = "force-dynamic";

const BASE = "https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais";

export async function GET() {
  try {
    const [ultimoRaw, historico] = await Promise.all([
      fetchJson<{ fecha: string; valor: unknown }>(`${BASE}/ultimo`, { revalidate: 60 }),
      fetchJson<{ fecha: string; valor: unknown }[]>(BASE, { revalidate: 3600 }),
    ]);
    const ultimo: Punto = { fecha: ultimoRaw.fecha.slice(0, 10), valor: num(ultimoRaw.valor) ?? NaN };
    const previos = historico
      .map((p) => ({ fecha: p.fecha.slice(0, 10), valor: num(p.valor) }))
      .filter((p): p is Punto => p.valor !== null && p.fecha < ultimo.fecha)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    const data: RiesgoResumen = { ultimo, anterior: previos.at(-1) ?? null };
    return ok(data, 60);
  } catch (e) {
    return fail(e);
  }
}
