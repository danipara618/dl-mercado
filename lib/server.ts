// ============================================================
//  Utilidades SOLO de servidor (API routes)
// ============================================================
import "server-only";
import { NextResponse } from "next/server";
import https from "node:https";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

interface FetchOpts {
  revalidate?: number; // segundos de caché en el Data Cache de Next
  timeoutMs?: number;
  headers?: Record<string, string>;
}

/** fetch JSON con timeout, User-Agent de navegador y caché de Next. */
export async function fetchJson<T = unknown>(url: string, opts: FetchOpts = {}): Promise<T> {
  const { revalidate = 60, timeoutMs = 12_000, headers = {} } = opts;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json", ...headers },
      next: { revalidate },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${new URL(url).host}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET JSON con node:https ignorando la validación TLS.
 * Uso exclusivo: api.bcra.gob.ar, que publica una cadena de certificados incompleta.
 */
export function fetchJsonInsecure<T = unknown>(url: string, timeoutMs = 12_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { agent: new https.Agent({ rejectUnauthorized: false }), headers: { "User-Agent": UA, Accept: "application/json" }, timeout: timeoutMs },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          if ((res.statusCode ?? 500) >= 400) return reject(new Error(`HTTP ${res.statusCode} en BCRA`));
          try {
            resolve(JSON.parse(body) as T);
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("Timeout BCRA")));
    req.on("error", reject);
  });
}

/** Respuesta OK con caché CDN de Vercel (s-maxage) y stale-while-revalidate. */
export function ok<T>(data: T, sMaxAge = 60) {
  return NextResponse.json(
    { ok: true, data, updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${sMaxAge * 5}` } },
  );
}

export function fail(error: unknown, status = 502) {
  const msg = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ ok: false, error: msg, updatedAt: new Date().toISOString() }, { status });
}

/** Convierte a número o null (acepta strings con coma decimal). */
export function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
