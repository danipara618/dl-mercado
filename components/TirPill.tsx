// Etiqueta de TIR: verde claro si es baja, roja clara si es alta, neutra en la franja intermedia
import { TIR_ALTA, TIR_BAJA } from "@/lib/bonds";
import { fmtNum } from "@/lib/format";

export default function TirPill({ tir }: { tir: number | null }) {
  if (tir === null) return <span className="text-tinta/40">—</span>;
  const estilo =
    tir < TIR_BAJA
      ? "bg-green-100 text-green-800 ring-green-600/20"
      : tir > TIR_ALTA
        ? "bg-red-100 text-red-800 ring-red-600/20"
        : "bg-crema-50 text-oliva ring-oliva/20";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-xs font-medium tabular ring-1 ring-inset ${estilo}`}>
      {fmtNum(tir, 2)}%
    </span>
  );
}
