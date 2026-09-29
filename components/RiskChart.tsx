"use client";
// Riesgo país: línea verde oscuro, grilla horizontal sutil, umbral punteado, último dato destacado
import { useMemo, useState } from "react";
import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useApi } from "@/lib/useApi";
import { fmtFecha, fmtNum } from "@/lib/format";
import type { Punto } from "@/lib/types";
import { ErrorNote, Skeleton } from "./States";
import Change from "./Change";

const UMBRAL = Number(process.env.NEXT_PUBLIC_UMBRAL_RIESGO ?? 500);
const RANGOS = [
  { label: "30 días", dias: 30 },
  { label: "90 días", dias: 90 },
  { label: "1 año", dias: 365 },
  { label: "Histórico", dias: 0 },
] as const;

/** Punto final: círculo rojo + etiqueta flotante blanca con borde verde (solo en el último índice) */
function UltimoPunto(props: { cx?: number; cy?: number; index?: number; total: number; valor: number }) {
  const { cx, cy, index, total, valor } = props;
  if (cx === undefined || cy === undefined || index !== total - 1) return <g />;
  const w = 88, h = 30;
  return (
    <g>
      <rect x={cx - w - 14} y={cy - h - 14} width={w} height={h} rx={8} fill="#FFFFFF" stroke="#2C3A22" strokeWidth={1.5} />
      <text x={cx - w / 2 - 14} y={cy - h / 2 - 14} dy={5} textAnchor="middle" fontFamily="var(--font-dm-mono)" fontSize={13} fill="#1A1A1A">
        {fmtNum(valor, 0)} pb
      </text>
      <circle cx={cx} cy={cy} r={6} fill="#EF4444" stroke="#FFFFFF" strokeWidth={2} />
    </g>
  );
}

/** Eje Y con marcas "redondas" (múltiplos de 50/100/250/500/1000) que incluyen el umbral */
function ejeY(min: number, max: number): { domain: [number, number]; ticks: number[] } {
  const lo0 = Math.min(min, UMBRAL), hi0 = Math.max(max, UMBRAL);
  const rango = Math.max(hi0 - lo0, 1);
  const paso = [25, 50, 100, 250, 500, 1000, 2000].find((p) => rango / p <= 6) ?? 2000;
  const lo = Math.max(0, Math.floor((lo0 - rango * 0.04) / paso) * paso);
  const hi = Math.ceil((hi0 + rango * 0.04) / paso) * paso;
  const ticks: number[] = [];
  for (let v = lo; v <= hi; v += paso) ticks.push(v);
  return { domain: [lo, hi], ticks };
}

function TooltipRiesgo({ active, payload }: { active?: boolean; payload?: { payload: Punto }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-oliva/30 bg-white px-3 py-2 shadow-md">
      <p className="text-xs text-tinta/60">{fmtFecha(p.fecha)}</p>
      <p className="font-mono text-sm text-tinta">{fmtNum(p.valor, 0)} pb</p>
    </div>
  );
}

export default function RiskChart() {
  const { data, error, loading } = useApi<Punto[]>("/api/riesgo-pais/historico", 300_000);
  const [dias, setDias] = useState<number>(365);

  const serie = useMemo(() => {
    if (!data?.length) return [];
    if (dias === 0) return data;
    const corte = new Date(Date.now() - dias * 86_400_000).toISOString().slice(0, 10);
    return data.filter((p) => p.fecha >= corte);
  }, [data, dias]);

  const stats = useMemo(() => {
    if (!serie.length) return null;
    const v = serie.map((p) => p.valor);
    const primero = serie[0].valor, ultimo = serie.at(-1)!;
    return {
      ultimo,
      varAbs: ultimo.valor - primero,
      varPct: (ultimo.valor / primero - 1) * 100,
      max: Math.max(...v),
      min: Math.min(...v),
      eje: ejeY(Math.min(...v), Math.max(...v)),
    };
  }, [serie]);

  const denso = serie.length > 400;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-md ring-1 ring-black/5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Rango temporal" className="flex flex-wrap gap-2">
          {RANGOS.map((r) => (
            <button
              key={r.dias}
              type="button"
              onClick={() => setDias(r.dias)}
              aria-pressed={dias === r.dias}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                dias === r.dias ? "border-oliva bg-oliva text-white" : "border-oliva/60 text-oliva hover:bg-oliva-100"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {stats && (
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div className="flex gap-1.5"><dt className="text-tinta/55">Var. período</dt><dd><Change valor={stats.varAbs} tipo="abs" dec={0} sufijo=" pb" invertir /></dd></div>
            <div className="flex gap-1.5"><dt className="text-tinta/55">Máx.</dt><dd className="font-mono tabular">{fmtNum(stats.max, 0)}</dd></div>
            <div className="flex gap-1.5"><dt className="text-tinta/55">Mín.</dt><dd className="font-mono tabular">{fmtNum(stats.min, 0)}</dd></div>
          </dl>
        )}
      </div>

      {error && !data ? (
        <ErrorNote mensaje={error} fuente="argentinadatos.com" />
      ) : loading && !data ? (
        <Skeleton className="h-[380px] w-full" />
      ) : (
        <div className="h-[380px] w-full">
          <ResponsiveContainer>
            <LineChart data={serie} margin={{ top: 48, right: 24, bottom: 4, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#E7DECD" strokeDasharray="0" />
              <XAxis
                dataKey="fecha"
                tickFormatter={(f: string) => fmtFecha(f, true)}
                minTickGap={48}
                tick={{ fontSize: 12, fill: "#1A1A1A99", fontFamily: "var(--font-dm-mono)" }}
                axisLine={{ stroke: "#E7DECD" }}
                tickLine={false}
              />
              <YAxis
                width={60}
                domain={stats?.eje.domain ?? ["auto", "auto"]}
                ticks={stats?.eje.ticks}
                tickFormatter={(v: number) => fmtNum(v, 0)}
                tick={{ fontSize: 12, fill: "#1A1A1A99", fontFamily: "var(--font-dm-mono)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<TooltipRiesgo />} cursor={{ stroke: "#2C3A22", strokeOpacity: 0.25 }} />
              <ReferenceLine
                y={UMBRAL}
                stroke="#EF4444"
                strokeOpacity={0.55}
                strokeDasharray="6 6"
                label={{ value: `Umbral ${fmtNum(UMBRAL, 0)} pb`, position: "insideBottomLeft", fill: "#B91C1C", fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="valor"
                stroke="#2C3A22"
                strokeWidth={denso ? 1.6 : 2.4}
                dot={(p: { cx?: number; cy?: number; index?: number; key?: string }) => (
                  <UltimoPunto key={p.key ?? p.index} cx={p.cx} cy={p.cy} index={p.index} total={serie.length} valor={stats?.ultimo.valor ?? 0} />
                )}
                activeDot={{ r: 5, fill: "#2C3A22", stroke: "#fff", strokeWidth: 2 }}
                isAnimationActive={!denso}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {stats && (
        <p className="mt-3 text-xs text-tinta/50">
          Último dato: {fmtFecha(stats.ultimo.fecha)} · Fuente: argentinadatos.com (EMBI, J.P. Morgan)
        </p>
      )}
    </div>
  );
}
