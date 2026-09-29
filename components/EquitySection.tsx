"use client";
// Renta variable y corporativos: acciones BYMA, CEDEARs y obligaciones negociables
import { useState } from "react";
import SectionTitle from "./SectionTitle";
import DataTable, { type Column } from "./DataTable";
import Change from "./Change";
import { useApi } from "@/lib/useApi";
import { fmtCompact, fmtNum } from "@/lib/format";
import type { Cotizacion } from "@/lib/types";

const PANELES = [
  { id: "arg_stocks", label: "Acciones" },
  { id: "arg_cedears", label: "CEDEARs" },
  { id: "arg_corp", label: "Obligaciones negociables" },
] as const;

const cols: Column<Cotizacion>[] = [
  { key: "s", header: "Especie", render: (r) => <span className="font-semibold">{r.symbol}</span>, sortValue: (r) => r.symbol },
  { key: "p", header: "Último", align: "right", render: (r) => <span className="font-mono tabular">{fmtNum(r.last, 2)}</span>, sortValue: (r) => r.last },
  { key: "v", header: "Var. %", align: "right", render: (r) => <Change valor={r.pctChange} />, sortValue: (r) => r.pctChange },
  { key: "b", header: "Compra", align: "right", render: (r) => <span className="font-mono tabular">{fmtNum(r.bid, 2)}</span> },
  { key: "a", header: "Venta", align: "right", render: (r) => <span className="font-mono tabular">{fmtNum(r.ask, 2)}</span> },
  { key: "op", header: "Operaciones", align: "right", render: (r) => <span className="font-mono tabular">{fmtCompact(r.operaciones)}</span>, sortValue: (r) => r.operaciones },
  { key: "vol", header: "Volumen", align: "right", render: (r) => <span className="font-mono tabular">{fmtCompact(r.volume)}</span>, sortValue: (r) => r.volume },
];

function Panel({ id }: { id: string }) {
  const { data, error, loading } = useApi<Cotizacion[]>(`/api/data912/${id}`, 60_000);
  return (
    <DataTable
      columns={cols}
      rows={(data ?? []).filter((r) => r.last !== null)}
      rowKey={(r) => r.symbol}
      initialSort={{ key: "vol", dir: "desc" }}
      pageSize={15}
      loading={loading}
      error={error}
      fuente="data912.com"
    />
  );
}

export default function EquitySection() {
  const [tab, setTab] = useState<string>(PANELES[0].id);
  return (
    <section aria-labelledby="equity">
      <SectionTitle
        id="equity"
        title="Acciones, CEDEARs y ONs"
        subtitle="Ordenado por volumen operado. Cotizaciones en pesos de BYMA con demora."
        right={
          <div role="tablist" aria-label="Panel" className="flex rounded-full border border-oliva/50 p-1">
            {PANELES.map((p) => (
              <button
                key={p.id}
                role="tab"
                type="button"
                aria-selected={tab === p.id}
                onClick={() => setTab(p.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${tab === p.id ? "bg-oliva text-white" : "text-oliva hover:bg-oliva-100"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />
      <div role="tabpanel">
        <Panel key={tab} id={tab} />
      </div>
    </section>
  );
}
