"use client";
// Tarjeta de una serie: mini-gráfico de línea (color por categoría), último valor,
// variación y descarga en CSV. Cada tarjeta tiene su propio useApi — igual que en
// KPIGrid, así el refresco de una serie no re-renderiza a las demás.
import { useMemo, useState } from "react";
import { Check, Download, Share2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApi } from "@/lib/useApi";
import { fmtFecha, fmtNum } from "@/lib/format";
import type { Punto } from "@/lib/types";
import { CATEGORIAS, type SerieDef } from "@/lib/seriesCatalogo";
import { normalizarSerie } from "@/lib/seriesNormalizar";
import { ErrorNote, Skeleton } from "../States";
import Change from "../Change";

function descargarCSV(def: SerieDef, serie: Punto[]) {
  const filas = ["fecha,valor", ...serie.map((p) => `${p.fecha},${p.valor}`)];
  const blob = new Blob([filas.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${def.slug}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Comparte la tarjeta: enlace directo a /series#slug (abre con esa sección a la vista).
 * Usa la Web Share API cuando está disponible (celular, y buena parte de desktop); si no,
 * copia el link al portapapeles y el botón avisa "Copiado" un momento.
 */
async function compartir(def: SerieDef, ultimo: Punto | null, onCopiado: () => void) {
  const url = `${location.origin}/series#${def.slug}`;
  const valor = ultimo ? `${fmtNum(ultimo.valor, def.decimales ?? 2)} ${def.unidad}` : "";
  const texto = `${def.titulo}${valor ? `: ${valor}` : ""} — DL Mercado`;

  if (navigator.share) {
    try {
      await navigator.share({ title: def.titulo, text: texto, url });
    } catch {
      /* el usuario canceló el share nativo, no es un error */
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    onCopiado();
  } catch {
    /* clipboard no disponible (http sin TLS, permisos) — no hay más fallback razonable */
  }
}

export default function SeriesCard({ def }: { def: SerieDef }) {
  const { data, error, loading } = useApi<unknown>(def.endpoint, def.refreshMs);
  const color = CATEGORIAS[def.categoria].color;
  const [copiado, setCopiado] = useState(false);

  const { serie, ultimo, anterior } = useMemo(() => {
    if (!data) return { serie: [] as Punto[], ultimo: null, anterior: null };
    return normalizarSerie(def.tipo, data);
  }, [data, def.tipo]);

  const variacion = ultimo && anterior && anterior.valor !== 0 ? ((ultimo.valor - anterior.valor) / Math.abs(anterior.valor)) * 100 : null;
  const denso = serie.length > 300;
  const sinDatos = !loading && !error && serie.length === 0;

  return (
    <article id={def.slug} className="flex scroll-mt-24 flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-tinta">{def.titulo}</h3>
          {ultimo && (
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xl tabular text-tinta">{fmtNum(ultimo.valor, def.decimales ?? 2)}</span>
              <span className="text-xs text-tinta/55">{def.unidad}</span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setCopiado(false);
              void compartir(def, ultimo, () => {
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              });
            }}
            aria-label={`Compartir ${def.titulo}`}
            title={copiado ? "¡Enlace copiado!" : "Compartir"}
            className="rounded-full border border-crema-200 p-1.5 text-tinta/60 transition hover:border-oliva/40 hover:text-oliva"
          >
            {copiado ? <Check className="h-4 w-4 text-pos" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => descargarCSV(def, serie)}
            disabled={!serie.length}
            aria-label={`Descargar ${def.titulo} en CSV`}
            title="Descargar CSV"
            className="rounded-full border border-crema-200 p-1.5 text-tinta/60 transition hover:border-oliva/40 hover:text-oliva disabled:opacity-30"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-3 text-xs text-tinta/55">
        {variacion !== null && <Change valor={variacion} dec={1} invertir={def.categoria === "riesgo"} />}
        {ultimo && <span className="font-mono">{fmtFecha(ultimo.fecha)}</span>}
      </div>

      {error && !serie.length ? (
        <ErrorNote mensaje={error} />
      ) : loading && !serie.length ? (
        <Skeleton className="h-[110px] w-full" />
      ) : sinDatos ? (
        <div className="grid h-[110px] place-items-center text-xs text-tinta/40">Sin datos disponibles</div>
      ) : (
        <div className="h-[110px] w-full">
          <ResponsiveContainer>
            <LineChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="fecha" tick={false} axisLine={false} tickLine={false} />
              <YAxis domain={["auto", "auto"]} tick={false} axisLine={false} tickLine={false} width={0} />
              <Tooltip
                formatter={(v: number) => [fmtNum(v, def.decimales ?? 2), def.unidad]}
                labelFormatter={(f: string) => fmtFecha(f)}
                contentStyle={{ fontSize: 12 }}
              />
              <Line type="monotone" dataKey="valor" stroke={color} strokeWidth={denso ? 1.5 : 2} dot={false} isAnimationActive={!denso} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}
