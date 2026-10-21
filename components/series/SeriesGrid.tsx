"use client";
// Grilla de /series: chips de filtro por categoría + tarjetas, y un botón de
// "Descargar todo" que arma un CSV único combinando todas las series.
// Ese botón NO guarda los datos en estado de React (para no reintroducir el
// problema de re-renders que se aisló en KPIGrid): pide todo de nuevo al
// tocarlo, arma el CSV y listo.
import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { CATALOGO, CATEGORIAS, type CategoriaSerie } from "@/lib/seriesCatalogo";
import SeriesCard from "./SeriesCard";
import PlazoFijoCard from "./PlazoFijoCard";
import { useDescargaTodo } from "./useDescargaTodo";

const ORDEN: CategoriaSerie[] = ["dolar", "tasas", "precios", "riesgo", "bonos"];

export default function SeriesGrid() {
  const [filtro, setFiltro] = useState<CategoriaSerie | "todos">("todos");
  const { descargando, descargarTodo } = useDescargaTodo();

  const visibles = useMemo(() => (filtro === "todos" ? ORDEN : [filtro]), [filtro]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFiltro("todos")}
            aria-pressed={filtro === "todos"}
            className={`rounded-full border px-4 py-1.5 text-xs font-bold ${filtro === "todos" ? "border-oliva bg-oliva text-white" : "border-oliva/40 text-oliva hover:bg-oliva-100"}`}
          >
            Todas
          </button>
          {ORDEN.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFiltro(c)}
              aria-pressed={filtro === c}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold ${filtro === c ? "border-oliva bg-oliva text-white" : "border-oliva/40 text-oliva hover:bg-oliva-100"}`}
            >
              {CATEGORIAS[c].titulo}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={descargarTodo}
          disabled={descargando}
          className="inline-flex items-center gap-2 rounded-full border border-oliva/50 px-4 py-1.5 text-xs font-bold text-oliva transition hover:bg-oliva-100 disabled:opacity-50"
        >
          {descargando ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Download className="h-3.5 w-3.5" aria-hidden="true" />}
          Descargar todo (CSV)
        </button>
      </div>

      <div className="space-y-10">
        {visibles.map((cat) => {
          const series = CATALOGO.filter((s) => s.categoria === cat);
          return (
            <section key={cat} aria-labelledby={`cat-${cat}`}>
              <div className="mb-4 flex items-baseline gap-3">
                <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: CATEGORIAS[cat].color }} />
                <h3 id={`cat-${cat}`} className="font-serif text-2xl text-tinta">{CATEGORIAS[cat].titulo}</h3>
              </div>
              <p className="mb-4 text-sm text-tinta/55">{CATEGORIAS[cat].subtitulo}</p>
              <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {series.map((def) => (
                  <SeriesCard key={def.slug} def={def} />
                ))}
                {cat === "precios" && <PlazoFijoCard />}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
