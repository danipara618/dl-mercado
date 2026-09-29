// GET /api/dolares — cotizaciones de dolarapi.com (oficial, MEP, CCL, blue, mayorista, cripto, tarjeta)
import { fetchJson, ok, fail, num } from "@/lib/server";
import type { Dolar } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Raw { casa: string; nombre: string; compra: unknown; venta: unknown; fechaActualizacion: string }

export async function GET() {
  try {
    const raw = await fetchJson<Raw[]>("https://dolarapi.com/v1/dolares", { revalidate: 60 });
    const data: Dolar[] = raw.map((d) => ({
      casa: d.casa,
      nombre: d.nombre,
      compra: num(d.compra),
      venta: num(d.venta),
      fechaActualizacion: d.fechaActualizacion,
    }));
    return ok(data, 60);
  } catch (e) {
    return fail(e);
  }
}
