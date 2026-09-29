// Variación con color y flecha. `invertir` para indicadores donde subir es malo (riesgo país).
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { fmtNum, fmtPct } from "@/lib/format";

interface Props {
  valor: number | null | undefined;
  tipo?: "pct" | "abs";
  dec?: number;
  invertir?: boolean;
  sufijo?: string;
  className?: string;
}

export default function Change({ valor, tipo = "pct", dec = 2, invertir = false, sufijo = "", className = "" }: Props) {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return <span className="text-tinta/40">—</span>;
  const neutro = Math.abs(valor) < 1e-9;
  const bueno = invertir ? valor < 0 : valor > 0;
  const color = neutro ? "text-tinta/50" : bueno ? "text-pos" : "text-neg";
  const Icono = neutro ? Minus : valor > 0 ? ArrowUpRight : ArrowDownRight;
  const txt = tipo === "pct" ? fmtPct(valor, dec) : `${valor > 0 ? "+" : ""}${fmtNum(valor, dec)}${sufijo}`;
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono tabular ${color} ${className}`}>
      <Icono className="h-3.5 w-3.5" aria-hidden="true" />
      {txt}
    </span>
  );
}
