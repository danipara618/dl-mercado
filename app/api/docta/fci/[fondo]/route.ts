import { doctaGet } from "@/lib/docta";
import { ok, fail } from "@/lib/server";
import type { Punto } from "@/lib/types";

export const dynamic = "force-dynamic";

interface FciSerieResponse {
  fund_name: string;
  series: { date: string; vcp: number }[];
}

// Requiere que el token de Docta tenga el scope fci:read (depende del plan
// contratado — si el plan no lo incluye, esto devuelve 403 y la tarjeta
// muestra el error en vez de romper la página).
export async function GET(req: Request, { params }: { params: Promise<{ fondo: string }> }) {
  const { fondo } = await params;
  const { searchParams } = new URL(req.url);
  const hastaParam = searchParams.get("hasta");
  const desdeParam = searchParams.get("desde");
  const hasta = hastaParam && /^\d{4}-\d{2}-\d{2}$/.test(hastaParam) ? hastaParam : new Date().toISOString().slice(0, 10);
  const desde =
    desdeParam && /^\d{4}-\d{2}-\d{2}$/.test(desdeParam)
      ? desdeParam
      : new Date(Date.now() - 400 * 86_400_000).toISOString().slice(0, 10);

  try {
    const json = await doctaGet<FciSerieResponse>(
      `/api/v1/fci/instruments/${encodeURIComponent(fondo)}/series?date_from=${desde}&date_to=${hasta}`,
    );
    const serie: Punto[] = (json.series ?? [])
      .filter((d) => typeof d.vcp === "number")
      .map((d) => ({ fecha: d.date, valor: d.vcp }));
    return ok({ serie, ultimo: serie.at(-1) ?? null }, 1800);
  } catch (e) {
    return fail(e);
  }
}
