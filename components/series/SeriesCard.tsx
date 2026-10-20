"use client";
// Tarjeta de una serie: gráfico de línea (color por serie dentro de la rampa de su
// categoría — ver lib/seriesCatalogo.ts), último valor, variación, compartir y
// descarga en CSV. Cada tarjeta tiene su propio useApi — igual que en KPIGrid, así
// el refresco de una serie no re-renderiza a las demás.
import { useMemo, useState } from "react";
import { Check, Download, Share2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApi } from "@/lib/useApi";
import { fmtFecha, fmtNum } from "@/lib/format";
import type { Punto } from "@/lib/types";
import type { SerieDef } from "@/lib/seriesCatalogo";
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
  const [copiado, setCopiado] = useState(false);

  const { serie, ultimo, anterior } = useMemo(() => {
    if (!data) return { serie: [] as Punto[], ultimo: null, anterior: null };
    return normalizarSerie(def.tipo, data);
  }, [data, def.tipo]);

  const variacion = ultimo && anterior && anterior.valor !== 0 ? ((ultimo.valor - anterior.valor) / Math.abs(anterior.valor)) * 100 : null;
  const denso = serie.length > 400;
  const sinDatos = !loading && !error && serie.length === 0;

  return (
    <article id={def.slug} className="flex scroll-mt-24 flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-tinta">{def.titulo}</h3>
          {ultimo && (
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-mono text-3xl tabular text-tinta">{fmtNum(ultimo.valor, def.decimales ?? 2)}</span>
              <span className="text-sm text-tinta/55">{def.unidad}</span>
              {variacion !== null && <Change valor={variacion} dec={1} invertir={def.categoria === "riesgo"} className="text-sm" />}
            </p>
          )}
          {ultimo && <p className="mt-0.5 font-mono text-xs text-tinta/45">Último dato: {fmtFecha(ultimo.fecha)}</p>}
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
            className="rounded-full border border-crema-200 p-2 text-tinta/60 transition hover:border-oliva/40 hover:text-oliva"
          >
            {copiado ? <Check className="h-4 w-4 text-pos" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => descargarCSV(def, serie)}
            disabled={!serie.length}
            aria-label={`Descargar ${def.titulo} en CSV`}
            title="Descargar CSV"
            className="rounded-full border border-crema-200 p-2 text-tinta/60 transition hover:border-oliva/40 hover:text-oliva disabled:opacity-30"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && !serie.length ? (
        <ErrorNote mensaje={error} />
      ) : loading && !serie.length ? (
        <Skeleton className="h-[280px] w-full" />
      ) : sinDatos ? (
        <div className="grid h-[280px] place-items-center text-sm text-tinta/40">Sin datos disponibles</div>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer>
            <LineChart data={serie} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#E7DECD" strokeOpacity={0.7} />
              <XAxis
                dataKey="fecha"
                tickFormatter={(f: string) => fmtFecha(f, true)}
                minTickGap={56}
                tick={{ fontSize: 11, fill: "#1A1A1A99", fontFamily: "var(--font-dm-mono)" }}
                axisLine={{ stroke: "#E7DECD" }}
                tickLine={false}
              />
              <YAxis
                domain={["auto", "auto"]}
                width={56}
                tickFormatter={(v: number) => fmtNum(v, v > 1000 ? 0 : def.decimales ?? 1)}
                tick={{ fontSize: 11, fill: "#1A1A1A99", fontFamily: "var(--font-dm-mono)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [fmtNum(v, def.decimales ?? 2), def.unidad]}
                labelFormatter={(f: string) => fmtFecha(f)}
                contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E7DECD" }}
              />
              <Line type="monotone" dataKey="valor" stroke={def.color} strokeWidth={denso ? 1.6 : 2.4} dot={false} activeDot={{ r: 4 }} isAnimationActive={!denso} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-3 text-[11px] text-tinta/40">
        {serie.length > 0 && `${fmtFecha(serie[0].fecha)} — ${fmtFecha(serie.at(-1)!.fecha)} · `}
        {serie.length} puntos
      </p>
    </article>
  );
}
