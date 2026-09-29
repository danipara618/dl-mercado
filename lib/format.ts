// ============================================================
//  Formateo es-AR (compartido cliente/servidor)
// ============================================================

export function fmtNum(n: number | null | undefined, dec = 2): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function fmtPct(n: number | null | undefined, dec = 2, signo = true): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const s = signo && n > 0 ? "+" : "";
  return `${s}${fmtNum(n, dec)}%`;
}

export function fmtCompact(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/** yyyy-mm-dd → Date en UTC (evita corrimientos por huso horario). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** yyyy-mm-dd o Date → dd/mm/aaaa (o dd/mm/aa si corto) */
export function fmtFecha(v: string | Date | null | undefined, corto = false): string {
  if (!v) return "—";
  const d = typeof v === "string" ? parseISODate(v) : v;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = corto ? String(d.getUTCFullYear()).slice(2) : String(d.getUTCFullYear());
  return `${dd}/${mm}/${yy}`;
}
