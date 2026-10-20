"use client";
// Plazo fijo: argentinadatos no publica serie histórica por banco, solo la foto de hoy.
// Por eso esta tarjeta es un ranking de barras, no un gráfico de línea — distinto de
// las demás de /series mismo cuando comparten color de categoría.
import { Download } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { fmtNum } from "@/lib/format";
import type { Indicadores } from "@/lib/types";
import { CATEGORIAS } from "@/lib/seriesCatalogo";
import { ErrorNote, Skeleton } from "../States";

function descargarCSV(bancos: { entidad: string; tna: number }[]) {
  const filas = ["entidad,tna", ...bancos.map((b) => `${b.entidad},${b.tna}`)];
  const blob = new Blob([filas.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "plazo-fijo-bancos.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function PlazoFijoCard() {
  const { data, error, loading } = useApi<Indicadores>("/api/indicadores", 1_800_000);
  const pf = data?.plazoFijo;
  const color = CATEGORIAS.precios.color;
  const max = pf ? Math.max(...pf.bancos.map((b) => b.tna)) : 1;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-tinta">Plazo fijo 30 días (TNA)</h3>
          {pf && (
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xl tabular text-tinta">{fmtNum(pf.promedioTna, 2)}</span>
              <span className="text-xs text-tinta/55">% TNA prom.</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => pf && descargarCSV(pf.bancos)}
          disabled={!pf}
          aria-label="Descargar plazo fijo por banco en CSV"
          title="Descargar CSV"
          className="shrink-0 rounded-full border border-crema-200 p-1.5 text-tinta/60 transition hover:border-oliva/40 hover:text-oliva disabled:opacity-30"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {error && !pf ? (
        <ErrorNote mensaje={error} />
      ) : loading && !pf ? (
        <Skeleton className="h-[110px] w-full" />
      ) : !pf ? (
        <div className="grid h-[110px] place-items-center text-xs text-tinta/40">Sin datos disponibles</div>
      ) : (
        <div className="max-h-[110px] space-y-1.5 overflow-y-auto pr-1">
          {pf.bancos.slice(0, 8).map((b) => (
            <div key={b.entidad} className="flex items-center gap-2 text-xs">
              <span className="w-24 shrink-0 truncate text-tinta/65">{b.entidad}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-crema-200">
                <div className="h-full rounded-full" style={{ width: `${(b.tna / max) * 100}%`, backgroundColor: color }} />
              </div>
              <span className="w-12 shrink-0 text-right font-mono tabular">{fmtNum(b.tna, 1)}%</span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] text-tinta/40">Foto del día — argentinadatos.com no publica histórico por banco.</p>
    </article>
  );
}
