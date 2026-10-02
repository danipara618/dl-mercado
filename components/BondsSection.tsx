"use client";
// Soberanos del canje 2020: especie en dólares (TIR, MD, paridad + curva) y especie en pesos (MEP/CCL implícitos)
import { useMemo } from "react";
import { CartesianGrid, Legend, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import SectionTitle from "./SectionTitle";
import DataTable, { type Column } from "./DataTable";
import TirPill from "./TirPill";
import Change from "./Change";
import { useApi } from "@/lib/useApi";
import { BONOS_USD, analizarBono, fechaLiquidacion, precioPor100, type AnalisisBono, type BondSpec } from "@/lib/bonds";
import { fmtCompact, fmtFecha, fmtNum } from "@/lib/format";
import type { Cotizacion } from "@/lib/types";

interface FilaUSD extends AnalisisBono {
  spec: BondSpec;
  precio: number | null;
  varPct: number | null;
  volumen: number | null;
}

interface FilaARS {
  ticker: string;
  ley: string;
  precio: number | null;
  varPct: number | null;
  mep: number | null;
  ccl: number | null;
  volumen: number | null;
}

/** Último operado; si no hubo operaciones, punto medio bid/ask. */
const precioDe = (q?: Cotizacion) =>
  q ? (q.last && q.last > 0 ? q.last : q.bid && q.ask ? (q.bid + q.ask) / 2 : null) : null;

export default function BondsSection() {
  const { data, error, loading } = useApi<Cotizacion[]>("/api/data912/arg_bonds", 60_000);

  const { filasUSD, filasARS } = useMemo(() => {
    const mapa = new Map((data ?? []).map((q) => [q.symbol, q]));
    const liq = fechaLiquidacion();
    const filasUSD: FilaUSD[] = BONOS_USD.map((spec) => {
      const q = mapa.get(`${spec.ticker}D`);
      const precio = precioPor100(precioDe(q));
      return { spec, precio, varPct: q?.pctChange ?? null, volumen: q?.volume ?? null, ...analizarBono(spec, precio, liq) };
    });
    const filasARS: FilaARS[] = BONOS_USD.map((spec) => {
      const ars = precioPor100(precioDe(mapa.get(spec.ticker)));
      const usdMep = precioPor100(precioDe(mapa.get(`${spec.ticker}D`)));
      const usdCcl = precioPor100(precioDe(mapa.get(`${spec.ticker}C`)));
      return {
        ticker: spec.ticker,
        ley: spec.ley,
        precio: ars,
        varPct: mapa.get(spec.ticker)?.pctChange ?? null,
        mep: ars && usdMep ? ars / usdMep : null,
        ccl: ars && usdCcl ? ars / usdCcl : null,
        volumen: mapa.get(spec.ticker)?.volume ?? null,
      };
    });
    return { filasUSD, filasARS };
  }, [data]);

  const colsUSD: Column<FilaUSD>[] = [
    { key: "t", header: "Bono", render: (r) => <span className="font-semibold">{r.spec.ticker}D</span>, sortValue: (r) => r.spec.ticker },
    { key: "ley", header: "Ley", render: (r) => r.spec.ley, sortValue: (r) => r.spec.ley },
    { key: "vto", header: "Vencimiento", render: (r) => <span className="font-mono">{fmtFecha(r.spec.vencimiento)}</span>, sortValue: (r) => r.spec.vencimiento },
    { key: "p", header: "Precio (USD)", align: "right", render: (r) => <span className="font-mono tabular">{fmtNum(r.precio, 2)}</span>, sortValue: (r) => r.precio },
    { key: "v", header: "Var. %", align: "right", render: (r) => <Change valor={r.varPct} />, sortValue: (r) => r.varPct },
    { key: "tir", header: "TIR", align: "center", render: (r) => <TirPill tir={r.tir} />, sortValue: (r) => r.tir },
    { key: "md", header: "Duration mod.", align: "right", render: (r) => <span className="font-mono tabular">{fmtNum(r.durationMod, 2)}</span>, sortValue: (r) => r.durationMod },
    { key: "par", header: "Paridad", align: "right", render: (r) => <span className="font-mono tabular">{fmtNum(r.paridad, 1)}%</span>, sortValue: (r) => r.paridad },
    { key: "cup", header: "Cupón vigente", align: "right", render: (r) => <span className="font-mono tabular">{fmtNum(r.cuponVigente, Number.isInteger(r.cuponVigente * 100) ? 2 : 3)}%</span>, sortValue: (r) => r.cuponVigente },
    { key: "res", header: "Residual", align: "right", render: (r) => <span className="font-mono tabular">{fmtNum(r.residual, 1)}%</span>, sortValue: (r) => r.residual },
    { key: "vol", header: "Volumen", align: "right", render: (r) => <span className="font-mono tabular">{fmtCompact(r.volumen)}</span>, sortValue: (r) => r.volumen },
  ];

  const colsARS: Column<FilaARS>[] = [
    { key: "t", header: "Bono", render: (r) => <span className="font-semibold">{r.ticker}</span>, sortValue: (r) => r.ticker },
    { key: "ley", header: "Ley", render: (r) => r.ley, sortValue: (r) => r.ley },
    { key: "p", header: "Precio (ARS)", align: "right", render: (r) => <span className="font-mono tabular">{fmtNum(r.precio, 2)}</span>, sortValue: (r) => r.precio },
    { key: "v", header: "Var. %", align: "right", render: (r) => <Change valor={r.varPct} />, sortValue: (r) => r.varPct },
    { key: "mep", header: "MEP implícito", align: "right", render: (r) => <span className="font-mono tabular">{fmtNum(r.mep, 2)}</span>, sortValue: (r) => r.mep },
    { key: "ccl", header: "CCL implícito", align: "right", render: (r) => <span className="font-mono tabular">{fmtNum(r.ccl, 2)}</span>, sortValue: (r) => r.ccl },
    { key: "vol", header: "Volumen", align: "right", render: (r) => <span className="font-mono tabular">{fmtCompact(r.volumen)}</span>, sortValue: (r) => r.volumen },
  ];

  const curva = (ley: string) =>
    filasUSD
      .filter((r) => r.spec.ley === ley && r.tir !== null && r.durationMod !== null)
      .map((r) => ({ md: r.durationMod!, tir: r.tir!, ticker: r.spec.ticker }))
      .sort((a, b) => a.md - b.md);

  const puntosCurva = [...curva("Local"), ...curva("NY")];
  const dominioX: [number, number] = puntosCurva.length
    ? [Math.max(0, Math.floor(Math.min(...puntosCurva.map((p) => p.md)) - 0.5)), Math.ceil(Math.max(...puntosCurva.map((p) => p.md)) + 0.5)]
    : [0, 10];
  const dominioY: [number, number] = puntosCurva.length
    ? [Math.floor(Math.min(...puntosCurva.map((p) => p.tir)) - 1), Math.ceil(Math.max(...puntosCurva.map((p) => p.tir)) + 1)]
    : [0, 20];
  const PuntoCurva = ({ cx, cy, payload, fill }: any) => (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={fill} stroke="white" strokeWidth={2} />
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={10} fontWeight={700} fill="#2C3A22">{payload.ticker}</text>
    </g>
  );

  return (
    <>
      <section aria-labelledby="usd">
        <SectionTitle
          id="usd"
          title="Soberanos en dólares"
          subtitle="Bonares y Globales, especie D (USD MEP). TIR efectiva anual sobre el cronograma real de cupones step-up y amortizaciones."
        />
        <DataTable
          columns={colsUSD}
          rows={loading && !data ? [] : filasUSD}
          rowKey={(r) => r.spec.ticker}
          initialSort={{ key: "vto", dir: "asc" }}
          loading={loading}
          error={error}
          fuente="data912.com"
          caption="Bonos soberanos en dólares"
        />

        {!!curva("Local").length && (
          <div className="mt-6 rounded-2xl border border-crema-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.14em] text-oliva">Curva soberana</p>
                <h3 className="mt-1 font-serif text-2xl">TIR vs. duration modificada</h3>
                <p className="mt-1 text-sm text-tinta/55">Cada punto es un bono. Compará nivel de rendimiento y sensibilidad entre ley local y Nueva York.</p>
              </div>
              <span className="rounded-full bg-crema-50 px-3 py-1 text-xs font-semibold text-tinta/55">Eje X: años · Eje Y: TIR %</span>
            </div>
            <div className="h-[360px]">
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="#E7DECD" />
                  <XAxis type="number" dataKey="md" name="Duration" unit=" a" tick={{ fontSize: 12 }} domain={dominioX} allowDecimals={false} tickFormatter={(v: number) => fmtNum(v, 0)} />
                  <YAxis type="number" dataKey="tir" name="TIR" unit="%" tick={{ fontSize: 12 }} width={56} domain={dominioY} tickFormatter={(v: number) => fmtNum(v, 1)} />
                  <ZAxis range={[90, 90]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "4 4" }}
                    formatter={(v: number, n: string) => [n === "TIR" ? `${fmtNum(v, 2)}%` : `${fmtNum(v, 2)} años`, n]}
                    labelFormatter={() => ""}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Scatter name="Bonares (ley local)" data={curva("Local")} fill="#2C3A22" line={{ stroke: "#2C3A22", strokeWidth: 2 }} shape={<PuntoCurva />} />
                  <Scatter name="Globales (ley NY)" data={curva("NY")} fill="#9AA36B" line={{ stroke: "#9AA36B", strokeWidth: 2 }} shape={<PuntoCurva />} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="ars">
        <SectionTitle
          id="ars"
          title="Soberanos en pesos"
          subtitle="Mismos bonos cotizando en ARS. El cociente ARS/D da el dólar MEP implícito y ARS/C el contado con liquidación."
        />
        <DataTable
          columns={colsARS}
          rows={loading && !data ? [] : filasARS}
          rowKey={(r) => r.ticker}
          initialSort={{ key: "vol", dir: "desc" }}
          loading={loading}
          error={error}
          fuente="data912.com"
          caption="Bonos soberanos en pesos"
        />
      </section>
    </>
  );
}
