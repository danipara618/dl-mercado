// ============================================================
//  Soberanos hard-dollar (canje 2020): flujos, TIR (Newton-Raphson),
//  duration modificada, valor técnico y paridad.
//
//  Los Bonares (AL/AE, ley local) y Globales (GD, ley NY) NO son bullets
//  a cupón fijo: tienen cupón step-up y amortizan semestralmente.
//  Por eso se modela el cronograma completo (fechas 9/1 y 9/7).
//  Precio: cotización por cada 100 VN ORIGINALES en USD (especie "D").
// ============================================================
import { parseISODate, toISODate } from "./format";

export interface BondSpec {
  ticker: string;           // especie en pesos (AL30); la especie USD MEP es ticker+"D", CCL ticker+"C"
  ley: "Local" | "NY";
  vencimiento: string;      // ISO
  /** [fechaDesde, tasa anual %]: la tasa aplica a cupones pagados DESPUÉS de fechaDesde */
  steps: [string, number][];
  /** [fecha de pago ISO, % del VN original amortizado] */
  amort: [string, number][];
}

export interface Flujo {
  fecha: Date;
  cupon: number;
  amort: number;
  total: number;
}

export interface AnalisisBono {
  tir: number | null;           // efectiva anual, en %
  durationMod: number | null;   // años
  paridad: number | null;       // %
  valorTecnico: number;         // por 100 VN originales
  residual: number;             // % VN original en circulación
  cuponVigente: number;         // % anual
  flujos: Flujo[];
}

// ---------- Construcción de cronogramas ----------

/** n pagos semestrales iguales de `pct` a partir de `primera` (ISO). */
function semestral(primera: string, n: number, pct: number): [string, number][] {
  const [y, m, d] = primera.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const mm = m - 1 + 6 * i;
    return [toISODate(new Date(Date.UTC(y + Math.floor(mm / 12), mm % 12, d))), pct] as [string, number];
  });
}

const EMISION = "2020-09-04";

/** Cronogramas por familia (idénticos entre Bonar y Global de igual vencimiento). */
const FAMILIAS = {
  "29": {
    vencimiento: "2029-07-09",
    steps: [[EMISION, 1]] as [string, number][],
    amort: semestral("2025-01-09", 10, 10),
  },
  "30": {
    vencimiento: "2030-07-09",
    steps: [[EMISION, 0.125], ["2021-07-09", 0.5], ["2023-07-09", 0.75], ["2027-07-09", 1.75]] as [string, number][],
    amort: [["2024-07-09", 4], ...semestral("2025-01-09", 12, 8)] as [string, number][],
  },
  "35": {
    vencimiento: "2035-07-09",
    steps: [[EMISION, 0.125], ["2021-07-09", 1.125], ["2022-07-09", 1.5], ["2023-07-09", 3.625], ["2024-07-09", 4.125], ["2027-07-09", 4.75], ["2028-07-09", 5]] as [string, number][],
    amort: semestral("2031-01-09", 10, 10),
  },
  "38": {
    vencimiento: "2038-01-09",
    steps: [[EMISION, 0.125], ["2021-07-09", 2], ["2022-07-09", 3.875], ["2023-07-09", 4.25], ["2024-07-09", 5]] as [string, number][],
    amort: semestral("2027-07-09", 22, 100 / 22),
  },
  "41": {
    vencimiento: "2041-07-09",
    steps: [[EMISION, 0.125], ["2021-07-09", 2.5], ["2022-07-09", 3.5], ["2029-07-09", 4.875]] as [string, number][],
    amort: semestral("2028-01-09", 28, 100 / 28),
  },
} as const;

const BASE_USD: { ticker: string; ley: BondSpec["ley"]; fam: keyof typeof FAMILIAS }[] = [
  { ticker: "AL29", ley: "Local", fam: "29" },
  { ticker: "GD29", ley: "NY", fam: "29" },
  { ticker: "AL30", ley: "Local", fam: "30" },
  { ticker: "GD30", ley: "NY", fam: "30" },
  { ticker: "AL35", ley: "Local", fam: "35" },
  { ticker: "GD35", ley: "NY", fam: "35" },
  { ticker: "AE38", ley: "Local", fam: "38" },
  { ticker: "GD38", ley: "NY", fam: "38" },
  { ticker: "AL41", ley: "Local", fam: "41" },
  { ticker: "GD41", ley: "NY", fam: "41" },
];

export const BONOS_USD: BondSpec[] = BASE_USD.map(({ ticker, ley, fam }) => ({
  ticker,
  ley,
  vencimiento: FAMILIAS[fam].vencimiento,
  steps: [...FAMILIAS[fam].steps],
  amort: [...FAMILIAS[fam].amort],
}));

// ---------- Fechas ----------

/** Liquidación T+1 hábil (sin feriados; aproximación suficiente para TIR). */
export function fechaLiquidacion(hoy = new Date()): Date {
  const d = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
  do d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d;
}

/** Fechas de pago semestrales 9/1 y 9/7 desde el primer cupón hasta el vencimiento. */
function fechasDePago(vencimiento: string): Date[] {
  const fin = parseISODate(vencimiento);
  const out: Date[] = [];
  for (let y = 2021; y <= fin.getUTCFullYear(); y++) {
    for (const m of [0, 6]) {
      const f = new Date(Date.UTC(y, m, 9));
      if (f <= fin) out.push(f);
    }
  }
  return out;
}

function tasaVigente(steps: [string, number][], fechaPago: Date): number {
  let tasa = steps[0][1];
  for (const [desde, t] of steps) if (parseISODate(desde) < fechaPago) tasa = t;
  return tasa;
}

/** Días 30/360 (convención de los bonos del canje). */
function dias30360(a: Date, b: Date): number {
  const d1 = Math.min(a.getUTCDate(), 30);
  const d2 = b.getUTCDate() === 31 && d1 === 30 ? 30 : b.getUTCDate();
  return 360 * (b.getUTCFullYear() - a.getUTCFullYear()) + 30 * (b.getUTCMonth() - a.getUTCMonth()) + (d2 - d1);
}

// ---------- Flujos ----------

export function flujosFuturos(spec: BondSpec, liq: Date) {
  const amort = new Map(spec.amort);
  let residual = 100;
  let residualLiq = 100;
  let ultimoPago = parseISODate(EMISION);
  let cuponVigente = 0;
  const flujos: Flujo[] = [];

  for (const f of fechasDePago(spec.vencimiento)) {
    const tasa = tasaVigente(spec.steps, f);
    const cupon = (residual * tasa) / 200; // semestral sobre saldo residual
    const am = amort.get(toISODate(f)) ?? 0;
    if (f <= liq) {
      ultimoPago = f;
    } else {
      if (!flujos.length) cuponVigente = tasa;
      if (cupon + am > 0) flujos.push({ fecha: f, cupon, amort: am, total: cupon + am });
    }
    residual -= am;
    if (f <= liq) residualLiq = residual;
  }

  // Interés corrido desde el último pago (30/360)
  const corrido = (residualLiq * cuponVigente) / 100 * (dias30360(ultimoPago, liq) / 360);
  return { flujos, residual: residualLiq, corrido, cuponVigente };
}

// ---------- TIR por Newton-Raphson ----------

/**
 * Resuelve  P = Σ CF_i · (1+r)^(-t_i),  t_i = días/365.
 *   f(r)  = Σ CF_i (1+r)^(-t_i) − P
 *   f'(r) = −Σ t_i CF_i (1+r)^(−t_i−1)
 *   r_{k+1} = r_k − f(r_k)/f'(r_k)
 * Si Newton no converge, cae a bisección en [−50%, 500%].
 */
export function tirNewton(precio: number, flujos: { t: number; cf: number }[], semilla = 0.1): number | null {
  if (!(precio > 0) || !flujos.length) return null;
  const f = (r: number) => flujos.reduce((s, { t, cf }) => s + cf * Math.pow(1 + r, -t), -precio);
  const df = (r: number) => flujos.reduce((s, { t, cf }) => s - t * cf * Math.pow(1 + r, -t - 1), 0);

  let r = semilla;
  for (let i = 0; i < 100; i++) {
    const d = df(r);
    if (Math.abs(d) < 1e-14) break;
    const nr = r - f(r) / d;
    if (!Number.isFinite(nr)) break;
    if (Math.abs(nr - r) < 1e-10) return nr;
    r = Math.max(nr, -0.99);
  }
  // Bisección de respaldo (f es decreciente en r)
  let lo = -0.5, hi = 5;
  if (f(lo) * f(hi) > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-10) break;
  }
  return (lo + hi) / 2;
}

export function analizarBono(spec: BondSpec, precio: number | null, liq = fechaLiquidacion()): AnalisisBono {
  const { flujos, residual, corrido, cuponVigente } = flujosFuturos(spec, liq);
  const valorTecnico = residual + corrido;
  const base: AnalisisBono = { tir: null, durationMod: null, paridad: null, valorTecnico, residual, cuponVigente, flujos };
  if (precio === null || !(precio > 0)) return base;

  const ts = flujos.map((x) => ({ t: (x.fecha.getTime() - liq.getTime()) / 86_400_000 / 365, cf: x.total }));
  const r = tirNewton(precio, ts);
  if (r === null) return { ...base, paridad: (precio / valorTecnico) * 100 };

  // Duration de Macaulay y modificada
  const pv = ts.map(({ t, cf }) => ({ t, v: cf * Math.pow(1 + r, -t) }));
  const pvTotal = pv.reduce((s, x) => s + x.v, 0);
  const macaulay = pv.reduce((s, x) => s + x.t * x.v, 0) / pvTotal;

  return {
    ...base,
    tir: r * 100,
    durationMod: macaulay / (1 + r),
    paridad: (precio / valorTecnico) * 100,
  };
}

/** Algunos feeds cotizan por 1 VN (0,63) y otros por 100 VN (63): se normaliza a 100 VN. */
export function precioPor100(p: number | null): number | null {
  if (p === null || !(p > 0)) return null;
  return p < 2 ? p * 100 : p;
}

// ---------- Umbrales de la etiqueta de TIR ----------
export const TIR_BAJA = 9;   // < 9 %  → pill verde
export const TIR_ALTA = 12;  // > 12 % → pill roja
