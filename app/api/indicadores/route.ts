// GET /api/indicadores — inflación (INDEC) y tasas de plazo fijo (argentinadatos.com)
import { fetchJson, ok, fail, num } from "@/lib/server";
import type { Indicadores, Punto } from "@/lib/types";

export const dynamic = "force-dynamic";

const AD = "https://api.argentinadatos.com/v1/finanzas";

function serie(raw: { fecha: string; valor: unknown }[]): Punto[] {
  return raw
    .map((p) => ({ fecha: p.fecha.slice(0, 10), valor: num(p.valor) }))
    .filter((p): p is Punto => p.valor !== null)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export async function GET() {
  const [mensual, interanual, pf] = await Promise.allSettled([
    fetchJson<{ fecha: string; valor: unknown }[]>(`${AD}/indices/inflacion`, { revalidate: 21600 }),
    fetchJson<{ fecha: string; valor: unknown }[]>(`${AD}/indices/inflacionInteranual`, { revalidate: 21600 }),
    fetchJson<{ entidad: string; tnaClientes: unknown }[]>(`${AD}/tasas/plazoFijo`, { revalidate: 3600 }),
  ]);

  if ([mensual, interanual, pf].every((r) => r.status === "rejected")) return fail("argentinadatos no respondió");

  const sMensual = mensual.status === "fulfilled" ? serie(mensual.value) : [];
  const sInteranual = interanual.status === "fulfilled" ? serie(interanual.value) : [];

  let plazoFijo: Indicadores["plazoFijo"] = null;
  if (pf.status === "fulfilled") {
    const bancos = pf.value
      .map((b) => {
        const t = num(b.tnaClientes);
        return t === null ? null : { entidad: b.entidad, tna: t < 1 ? t * 100 : t }; // la API informa decimales
      })
      .filter((b): b is { entidad: string; tna: number } => b !== null)
      .sort((a, b) => b.tna - a.tna);
    if (bancos.length) plazoFijo = { promedioTna: bancos.reduce((s, b) => s + b.tna, 0) / bancos.length, bancos };
  }

  const data: Indicadores = {
    inflacionMensual: sMensual.at(-1) ?? null,
    inflacionInteranual: sInteranual.at(-1) ?? null,
    inflacionSerie: sMensual,
    plazoFijo,
  };
  return ok(data, 3600);
}
