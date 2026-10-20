"use client";
// Arma un único CSV (formato largo: categoria, serie, fecha, valor) combinando
// TODAS las series del catálogo. Deliberadamente no usa el estado de ninguna
// SeriesCard: pide todo de nuevo al tocar el botón, con fetch directo — así no
// hay que levantar el dato de 19 componentes hoja independientes a un padre común
// (que es justamente el patrón de re-render que se evitó en KPIGrid).
import { useState } from "react";
import { CATALOGO, CATEGORIAS } from "@/lib/seriesCatalogo";
import { normalizarSerie } from "@/lib/seriesNormalizar";
import type { ApiResponse, Indicadores } from "@/lib/types";

async function obtener<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as ApiResponse<T>;
    return json.ok ? json.data : null;
  } catch {
    return null;
  }
}

export function useDescargaTodo() {
  const [descargando, setDescargando] = useState(false);

  async function descargarTodo() {
    setDescargando(true);
    try {
      const filas: string[] = ["categoria,serie,fecha,valor,unidad"];

      await Promise.all(
        CATALOGO.map(async (def) => {
          const raw = await obtener<unknown>(def.endpoint);
          const { serie } = normalizarSerie(def.tipo, raw);
          const categoria = CATEGORIAS[def.categoria].titulo;
          for (const p of serie) filas.push(`"${categoria}","${def.titulo}",${p.fecha},${p.valor},${def.unidad}`);
        }),
      );

      const indicadores = await obtener<Indicadores>("/api/indicadores");
      if (indicadores?.plazoFijo) {
        const hoy = new Date().toISOString().slice(0, 10);
        for (const b of indicadores.plazoFijo.bancos) {
          filas.push(`"Precios y expectativas","Plazo fijo 30 días — ${b.entidad}",${hoy},${b.tna},% TNA`);
        }
      }

      const blob = new Blob([filas.join("\n")], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `dl-mercado-series-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDescargando(false);
    }
  }

  return { descargando, descargarTodo };
}
