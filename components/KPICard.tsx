// Tarjeta KPI de "bloque dividido": 20 % verde oscuro con ícono/número, 80 % blanco con dato
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "./States";

interface Props {
  icono: LucideIcon | string;   // ícono de lucide o texto corto ("1", "$")
  titulo: string;
  valor: string;
  unidad?: string;
  variacion?: ReactNode;        // normalmente <Change/>
  detalle?: ReactNode;          // línea secundaria (compra, brecha, fecha)
  loading?: boolean;
  error?: boolean;
}

export default function KPICard({ icono: Icono, titulo, valor, unidad, variacion, detalle, loading, error }: Props) {
  return (
    <article className="flex min-h-[132px] overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5">
      <div className="flex w-1/5 min-w-[64px] items-center justify-center bg-oliva text-white">
        {typeof Icono === "string" ? (
          <span className="font-serif text-4xl leading-none">{Icono}</span>
        ) : (
          <Icono className="h-7 w-7" strokeWidth={1.6} aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center px-5 py-4">
        <h3 className="text-sm font-semibold text-tinta/70">{titulo}</h3>
        {loading ? (
          <div className="mt-2 space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : error ? (
          <p className="mt-2 text-sm text-tinta/45">Sin datos disponibles</p>
        ) : (
          <>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="font-serif text-[2rem] leading-none text-tinta tabular">{valor}</span>
              {unidad && <span className="text-sm text-tinta/55">{unidad}</span>}
            </p>
            {(variacion || detalle) && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tinta/60">
                {variacion}
                {detalle && <span className="font-mono tabular">{detalle}</span>}
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}
