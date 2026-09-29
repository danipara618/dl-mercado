import { TriangleAlert } from "lucide-react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`block animate-pulse rounded bg-crema-200/70 ${className}`} />;
}

export function ErrorNote({ mensaje, fuente }: { mensaje: string; fuente?: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-neg/30 bg-red-50 px-4 py-3 text-sm text-red-900">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        No se pudieron cargar los datos{fuente ? ` de ${fuente}` : ""}. <span className="text-red-900/70">{mensaje}</span>
      </p>
    </div>
  );
}
