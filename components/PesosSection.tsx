"use client";
// Renta fija en pesos: LECAP/BONCAP (arg_notes) + CER, duales y dollar linked (arg_bonds)
import { useMemo, useState } from "react";
import SectionTitle from "./SectionTitle";
import DataTable, { type Column } from "./DataTable";
import Change from "./Change";
import { useApi } from "@/lib/useApi";
import { clasificar, diasAlVencimiento, vencimientoPorTicker, type TipoPesos } from "@/lib/letras";
import { fmtCompact, fmtNum } from "@/lib/format";
import type { Cotizacion } from "@/lib/types";

interface Fila extends Cotizacion {
  tipo: TipoPesos;
  vto: Date | null;
  dias: number | null;
}

const FILTROS: (TipoPesos | "Todos")[] = ["Todos", "LECAP", "BONCAP", "CER", "Dual", "Dollar linked"];

export default function PesosSection() {
  const notas = useApi<Cotizacion[]>("/api/data912/arg_notes", 60_000);
  const bonos = useApi<Cotizacion[]>("/api/data912/arg_bonds", 60_000);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("Todos");

  const filas = useMemo<Fila[]>(() => {
    const out: Fila[] = [];
    for (const q of notas.data ?? []) {
      const tipo = clasificar(q.symbol);
      if (/[DC]$/.test(q.symbol) && !tipo) continue; // especies en dólares de letras
      const vto = vencimientoPorTicker(q.symbol);
      out.push({ ...q, tipo: tipo ?? "Otros", vto, dias: diasAlVencimiento(vto) });
    }
    for (const q of bonos.data ?? []) {
      const tipo = clasificar(q.symbol);
      if (!tipo || tipo === "LECAP" || tipo === "BONCAP") continue;
      out.push({ ...q, tipo, vto: null, dias: null });
    }
    // Descarta vencidos
    return out.filter((f) => f.dias === null || f.dias >= 0);
  }, [notas.data, bonos.data]);

  const visibles = filtro === "Todos" ? filas : filas.filter((f) => f.tipo === filtro);

  const cols: Column<Fila>[] = [
    { key: "s", header: "Especie", render: (r) => <span className="font-semibold">{r.symbol}</span>, sortValue: (r) => r.symbol },
    { key: "tipo", header: "Tipo", render: (r) => <span className="rounded-md bg-oliva-100 px-2 py-0.5 text-xs font-semibold text-oliva">{r.tipo}</span>, sortValue: (r) => r.tipo },
    { key: "p", header: "Precio (ARS)", align: "right", render: (r) => <span className="font-mono tabular">{fmtNum(r.last, 2)}</span>, sortValue: (r) => r.last },
    { key: "b", header: "Compra", align: "right", render: (r) => <span className="font-mono tabular">{fmtNum(r.bid, 2)}</span> },
    { key: "a", header: "Venta", align: "right", render: (r) => <span className="font-mono tabular">{fmtNum(r.ask, 2)}</span> },
    { key: "v", header: "Var. %", align: "right", render: (r) => <Change valor={r.pctChange} />, sortValue: (r) => r.pctChange },
    { key: "vol", header: "Volumen", align: "right", render: (r) => <span className="font-mono tabular">{fmtCompact(r.volume)}</span>, sortValue: (r) => r.volume },
  ];

  const cargando = (notas.loading && !notas.data) || (bonos.loading && !bonos.data);

  return (
    <section aria-labelledby="pesos">
      <SectionTitle
        id="pesos"
        title="Renta fija en pesos"
        subtitle="Letras capitalizables (LECAP), bonos capitalizables (BONCAP), ajustables por CER, duales y dollar linked."
        right={
          <div role="group" aria-label="Filtrar por tipo" className="flex flex-wrap gap-2">
            {FILTROS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filtro === f}
                onClick={() => setFiltro(f)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  filtro === f ? "border-oliva bg-oliva text-white" : "border-oliva/50 text-oliva hover:bg-oliva-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />
      <p className="mb-4 text-sm text-tinta/60">Para mantener el panel simple, acá mostramos cotización y liquidez. El cálculo de vencimiento y rendimiento queda en el simulador de LECAP/BONCAP.</p>
      <DataTable
        columns={cols}
        rows={cargando ? [] : visibles}
        rowKey={(r) => r.symbol}
        initialSort={{ key: "vol", dir: "desc" }}
        pageSize={15}
        loading={cargando}
        error={notas.error ?? bonos.error}
        fuente="data912.com"
        caption="Renta fija en pesos"
      />
    </section>
  );
}
