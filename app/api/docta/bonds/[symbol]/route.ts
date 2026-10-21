import { doctaGet } from "@/lib/docta";
import { ok, fail } from "@/lib/server";
import type { Punto } from "@/lib/types";

export const dynamic = "force-dynamic";

interface HistoricalYieldsResponse {
  ticker: string;
  data: { date: string; tir: number }[];
}

// La API de Docta devuelve la TIR (rendimiento a vencimiento) como decimal
// (0.107148 = 10.7148%); se multiplica por 100 para mostrarla como % directo,
// igual convención que BADLAR/CER en el resto del sitio.
export async function GET(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const { searchParams } = new URL(req.url);
  const hastaParam = searchParams.get("hasta");
  const desdeParam = searchParams.get("desde");
  const hasta = hastaParam && /^\d{4}-\d{2}-\d{2}$/.test(hastaParam) ? hastaParam : new Date().toISOString().slice(0, 10);
  const desde =
    desdeParam && /^\d{4}-\d{2}-\d{2}$/.test(desdeParam)
      ? desdeParam
      : new Date(Date.now() - 400 * 86_400_000).toISOString().slice(0, 10);

  try {
    const json = await doctaGet<HistoricalYieldsResponse>(
      `/api/v1/bonds/yields/${encodeURIComponent(symbol.toUpperCase())}/historical?from_date=${desde}&to_date=${hasta}`,
    );
    const serie: Punto[] = (json.data ?? [])
      .filter((d) => typeof d.tir === "number")
      .map((d) => ({ fecha: d.date, valor: d.tir * 100 }));
    return ok({ serie, ultimo: serie.at(-1) ?? null }, 1800);
  } catch (e) {
    return fail(e);
  }
}
