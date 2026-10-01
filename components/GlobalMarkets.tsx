"use client";
// Mercados globales por grupo (Yahoo Finance)
import SectionTitle from "./SectionTitle";
import DataTable, { type Column } from "./DataTable";
import Change from "./Change";
import { useApi } from "@/lib/useApi";
import { fmtNum } from "@/lib/format";
import { GRUPOS_GLOBALES } from "@/lib/tickers";
import type { GlobalQuote } from "@/lib/types";

const cols: Column<GlobalQuote>[] = [
  {
    key: "n",
    header: "Activo",
    render: (r) => (
      <span>
        <span className="font-semibold">{r.nombre}</span>
        <span className="ml-2 font-mono text-xs text-tinta/45">{r.symbol}</span>
      </span>
    ),
    sortValue: (r) => r.nombre,
  },
  {
    key: "p",
    header: "Último",
    align: "right",
    render: (r) => <span className="font-mono tabular">{fmtNum(r.precio, r.decimales)}{r.sufijo ?? ""}</span>,
    sortValue: (r) => r.precio,
  },
  { key: "v", header: "Var. %", align: "right", render: (r) => <Change valor={r.variacionPct} />, sortValue: (r) => r.variacionPct },
];

export default function GlobalMarkets() {
  const { data, error, loading } = useApi<GlobalQuote[]>("/api/global", 120_000);
  return (
    <section aria-labelledby="global">
      <SectionTitle id="global" title="Mercados globales" subtitle="Índices, tasas del Tesoro, monedas, commodities, cripto y ADRs argentinos." />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {Object.keys(GRUPOS_GLOBALES).map((grupo) => (
          <article key={grupo} className="min-w-0 overflow-hidden rounded-2xl border border-crema-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 border-b border-crema-200 pb-3 font-serif text-xl text-tinta">{grupo}</h3>
            <DataTable
              columns={cols}
              rows={(data ?? []).filter((q) => q.grupo === grupo)}
              rowKey={(r) => r.symbol}
              pageSize={20}
              loading={loading}
              error={error}
              fuente="Yahoo Finance"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
