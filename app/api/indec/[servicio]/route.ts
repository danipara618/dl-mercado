import { NextRequest, NextResponse } from "next/server";
import { INDEC_DATASETS, INDEC_ALLOWED_FILTERS } from "@/lib/indecCatalogo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://api.indec.gob.ar/v1";
const MAX_ROWS = 500;

function apiError(message: string, status: number) {
  return NextResponse.json({ error: message, rows: [] }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: NextRequest, context: { params: Promise<{ servicio: string }> }) {
  const { servicio } = await context.params;
  if (!INDEC_DATASETS.some((d) => d.id === servicio)) return apiError("Servicio no disponible en el catálogo.", 404);

  const token = process.env.INDEC_API_TOKEN;
  if (!token) return apiError("La conexión oficial INDEC aún no está configurada. Falta INDEC_API_TOKEN en el servidor.", 503);

  const sp = req.nextUrl.searchParams;
  const limitRaw = Number(sp.get("limit") || 250);
  const offsetRaw = Number(sp.get("offset") || 0);
  if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > MAX_ROWS ||
      !Number.isInteger(offsetRaw) || offsetRaw < 0 || offsetRaw > 100000) {
    return apiError("Paginación inválida.", 400);
  }

  const upstream = new URL(`${BASE}/${servicio}`);
  upstream.searchParams.set("limit", String(limitRaw));
  upstream.searchParams.set("offset", String(offsetRaw));

  const order = sp.get("order");
  if (order) {
    const fields = order.split(",");
    if (fields.length > 6 || fields.some((field) => !/^[A-Za-z_][A-Za-z0-9_]*(\.(asc|desc))?$/.test(field))) {
      return apiError("Orden inválido.", 400);
    }
    upstream.searchParams.set("order", order);
  }

  for (const [key, value] of sp.entries()) {
    if (["limit", "offset", "order"].includes(key)) continue;
    if (!INDEC_ALLOWED_FILTERS.has(key) || !/^(eq|gte|lte|gt|lt|ilike)\.[^&]{1,90}$/.test(value)) {
      return apiError("Filtro no permitido.", 400);
    }
    upstream.searchParams.append(key, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(upstream.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || !Array.isArray(body)) {
      const message = response.status === 401 || response.status === 403
        ? "El token INDEC no tiene acceso a este servicio. Revisá INDEC_API_TOKEN."
        : response.status === 400
          ? "INDEC rechazó la consulta. Revisá los filtros de la serie."
          : "No se pudieron obtener datos de INDEC.";
      return apiError(message, response.status === 401 || response.status === 403 ? 502 : 503);
    }
    return NextResponse.json({
      fuente: "INDEC — Catálogo API-INDEC",
      servicio, rows: body, offset: offsetRaw, limit: limitRaw,
      actualizado: new Date().toISOString(),
    }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } });
  } catch {
    return apiError("No fue posible conectar con INDEC. Intentá nuevamente.", 503);
  } finally {
    clearTimeout(timeout);
  }
}
