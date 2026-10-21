// ============================================================
//  Cliente para la API de Docta Capital (bonos, FCI, CEDEARs).
//  Mismo principio que BCRA/ICL: todo pasa por el servidor, el
//  client_id/client_secret nunca llega al navegador ni al repo
//  (viven en DOCTA_CLIENT_ID / DOCTA_CLIENT_SECRET, variables de
//  entorno en Vercel — ver .env.local para desarrollo local).
// ============================================================
import "server-only";
import { fetchJson } from "./server";

const DOCTA_BASE = "https://api.doctacapital.com.ar";

interface DoctaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  plan?: string;
}

let cache: { token: string; exp: number } | null = null;

/**
 * OAuth2 client_credentials: pide un access_token y lo cachea en memoria del
 * proceso hasta 5s antes de que expire. En un entorno serverless (Vercel) esto
 * solo ahorra el roundtrip cuando el mismo lambda atiende varios requests
 * seguidos — no es crítico si se pide de nuevo en cada invocación fría.
 */
async function obtenerToken(): Promise<string> {
  if (cache && cache.exp > Date.now() + 5_000) return cache.token;

  const clientId = process.env.DOCTA_CLIENT_ID;
  const clientSecret = process.env.DOCTA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Docta: faltan DOCTA_CLIENT_ID/DOCTA_CLIENT_SECRET en las variables de entorno");
  }

  const res = await fetch(`${DOCTA_BASE}/api/v1/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Docta auth HTTP ${res.status}`);
  const data = (await res.json()) as DoctaTokenResponse;
  cache = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return cache.token;
}

/**
 * GET autenticado contra la API de Docta Capital. `path` incluye query string
 * si aplica (ej. "/api/v1/bonds/yields/AL30/historical?from_date=...").
 * Si el token cacheado quedó inválido (401), reintenta una sola vez con uno nuevo.
 */
export async function doctaGet<T = unknown>(path: string): Promise<T> {
  const token = await obtenerToken();
  try {
    return await fetchJson<T>(`${DOCTA_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      revalidate: 1800,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("HTTP 401")) throw e;
    cache = null;
    const fresco = await obtenerToken();
    return fetchJson<T>(`${DOCTA_BASE}${path}`, {
      headers: { Authorization: `Bearer ${fresco}` },
      revalidate: 1800,
    });
  }
}
