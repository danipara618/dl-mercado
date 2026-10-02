"use client";
// Tabla genérica: tarjeta blanca, cabecera beige con texto verde, zebra, orden por columna, "ver todos"
import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { ErrorNote, Skeleton } from "./States";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
  /** Valor para ordenar; si falta, la columna no es ordenable */
  sortValue?: (row: T) => number | string | null;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
  initialSort?: { key: string; dir: "asc" | "desc" };
  pageSize?: number;
  loading?: boolean;
  error?: string | null;
  fuente?: string;
  vacio?: string;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T>({
  columns, rows, rowKey, caption, initialSort, pageSize = 12, loading, error, fuente, vacio = "Sin datos para mostrar.", onRowClick,
}: Props<T>) {
  const [sort, setSort] = useState(initialSort ?? null);
  const [expandido, setExpandido] = useState(false);

  const ordenadas = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const f = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a), vb = col.sortValue!(b);
      if (va === null) return 1;               // nulos siempre al final
      if (vb === null) return -1;
      return (va < vb ? -1 : va > vb ? 1 : 0) * f;
    });
  }, [rows, sort, columns]);

  const visibles = expandido ? ordenadas : ordenadas.slice(0, pageSize);
  const alinear = (a?: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

  if (error && !rows.length) return <ErrorNote mensaje={error} fuente={fuente} />;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-xs sm:text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-crema-50">
            <tr className="border-b border-crema-200">
              {columns.map((c) => {
                const activo = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={activo ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                    className={`px-2 py-3 text-[11px] font-bold text-oliva sm:px-3 sm:text-xs ${alinear(c.align)}`}
                  >
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => setSort({ key: c.key, dir: activo && sort!.dir === "desc" ? "asc" : "desc" })}
                        className="inline-flex items-center gap-1 hover:text-oliva-900"
                      >
                        {c.header}
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition ${activo ? "opacity-100" : "opacity-25"} ${activo && sort!.dir === "asc" ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading && !rows.length
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="even:bg-crema-50/60">
                    {columns.map((c) => (
                      <td key={c.key} className="px-2 py-3 sm:px-3">
                        <Skeleton className="h-4 w-full max-w-[90px]" />
                      </td>
                    ))}
                  </tr>
                ))
              : visibles.map((r) => (
                  <tr key={rowKey(r)} onClick={() => onRowClick?.(r)} className={`border-b border-crema-200/60 last:border-0 even:bg-crema-50/60 hover:bg-oliva-100/40 ${onRowClick ? "cursor-pointer" : ""}`}>
                    {columns.map((c) => (
                      <td key={c.key} className={`overflow-hidden text-ellipsis whitespace-nowrap px-2 py-2.5 sm:px-3 ${alinear(c.align)} ${c.className ?? ""}`}>
                        {c.render(r)}
                      </td>
                    ))}
                  </tr>
                ))}
            {!loading && !rows.length && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-tinta/50">{vacio}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {ordenadas.length > pageSize && (
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="w-full border-t border-crema-200 py-2.5 text-sm font-semibold text-oliva hover:bg-crema-50"
        >
          {expandido ? "Mostrar menos" : `Ver todos (${ordenadas.length})`}
        </button>
      )}
    </div>
  );
}
