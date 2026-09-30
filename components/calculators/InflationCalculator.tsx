"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calculator, Info, TrendingUp } from "lucide-react";
import { useApi } from "@/lib/useApi";
import type { Indicadores } from "@/lib/types";
import { calcularInflacion, evolucionEquivalente, mesesDisponibles } from "@/lib/calculators/inflation";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function etiquetaMes(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
}

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const porcentaje = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

export default function InflationCalculator() {
  const { data, loading, error } = useApi<Indicadores>("/api/indicadores", 3_600_000);
  const meses = useMemo(() => mesesDisponibles(data?.inflacionSerie ?? []), [data]);
  const [monto, setMonto] = useState(100000);
  const [desdeElegido, setDesdeElegido] = useState("");
  const [hastaElegido, setHastaElegido] = useState("");

  const desde = desdeElegido || meses.at(-13) || meses[0] || "";
  const hasta = hastaElegido || meses.at(-1) || "";

  const resultado = useMemo(
    () => calcularInflacion(monto, desde, hasta, data?.inflacionSerie ?? []),
    [monto, desde, hasta, data],
  );

  const grafico = useMemo(
    () => evolucionEquivalente(monto, desde, hasta, data?.inflacionSerie ?? []),
    [monto, desde, hasta, data],
  );

  if (loading && !data) {
    return <div className="rounded-2xl border border-crema-200 bg-crema-50 p-8 text-sm text-tinta/60">Cargando serie de IPC…</div>;
  }

  if (error && !data) {
    return <div className="rounded-2xl border border-crema-200 bg-crema-50 p-8 text-sm text-neg">No se pudo cargar la serie de inflación.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <form className="rounded-2xl border border-crema-200 bg-crema-50 p-5 sm:p-7" onSubmit={(e) => e.preventDefault()}>
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded-xl bg-oliva-100 p-2.5 text-oliva"><Calculator size={22} /></span>
            <div>
              <h2 className="font-serif text-2xl">Calculá el valor equivalente</h2>
              <p className="text-sm text-tinta/60">Elegí un monto y dos meses.</p>
            </div>
          </div>

          <label className="mb-5 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-tinta/60">Monto original</span>
            <div className="flex items-center rounded-xl border border-crema-200 bg-crema px-4 focus-within:border-oliva">
              <span className="text-tinta/50">$</span>
              <input
                className="w-full bg-transparent px-3 py-3.5 text-lg font-semibold outline-none tabular"
                type="number"
                min="1"
                step="1000"
                value={monto}
                onChange={(e) => setMonto(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-tinta/60">Desde</span>
              <select className="w-full rounded-xl border border-crema-200 bg-crema px-3 py-3.5 outline-none" value={desde} onChange={(e) => setDesdeElegido(e.target.value)}>
                {meses.map((m) => <option key={m} value={m}>{etiquetaMes(m)}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-tinta/60">Hasta</span>
              <select className="w-full rounded-xl border border-crema-200 bg-crema px-3 py-3.5 outline-none" value={hasta} onChange={(e) => setHastaElegido(e.target.value)}>
                {meses.filter((m) => m >= desde).map((m) => <option key={m} value={m}>{etiquetaMes(m)}</option>)}
              </select>
            </label>
          </div>
        </form>

        <div className="rounded-2xl bg-oliva p-6 text-crema sm:p-8" aria-live="polite">
          {resultado ? (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-crema/65">Valor equivalente</p>
              <p className="mt-3 font-serif text-4xl tabular sm:text-5xl">{pesos.format(resultado.montoEquivalente)}</p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-crema/75">
                {pesos.format(monto)} de {etiquetaMes(desde)} necesitan convertirse en aproximadamente{" "}
                <strong className="text-crema">{pesos.format(resultado.montoEquivalente)}</strong> en {etiquetaMes(hasta)} para conservar el mismo poder de compra.
              </p>
              <div className="mt-7 grid grid-cols-2 gap-3 border-t border-crema/20 pt-5">
                <div>
                  <p className="text-xs text-crema/60">Inflación acumulada</p>
                  <p className="mt-1 text-xl font-bold tabular">{porcentaje.format(resultado.inflacionAcumulada)}%</p>
                </div>
                <div>
                  <p className="text-xs text-crema/60">Pérdida de poder de compra*</p>
                  <p className="mt-1 text-xl font-bold tabular">{porcentaje.format(resultado.perdidaPoderCompra)}%</p>
                </div>
              </div>
            </>
          ) : <p>No hay datos suficientes para calcular este período.</p>}
        </div>
      </div>

      {resultado && grafico.length > 1 && (
        <section className="rounded-2xl border border-crema-200 bg-crema-50 p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp size={19} className="text-oliva" />
            <h2 className="text-sm font-extrabold uppercase tracking-wide">Evolución del valor equivalente</h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={grafico} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                <XAxis dataKey="mes" tickFormatter={etiquetaMes} minTickGap={28} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$ ${new Intl.NumberFormat("es-AR", { notation: "compact" }).format(v)}`} width={72} tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(v) => etiquetaMes(String(v))} formatter={(v) => [pesos.format(Number(v)), "Valor equivalente"]} />
                <Area type="monotone" dataKey="valor" stroke="var(--color-oliva)" fill="var(--color-oliva-100)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="grid gap-4 text-sm md:grid-cols-2">
        <div className="rounded-2xl border border-crema-200 p-5">
          <div className="mb-2 flex items-center gap-2 font-bold"><Info size={17} /> Fuente y metodología</div>
          <p className="leading-relaxed text-tinta/65">
            IPC mensual publicado por INDEC y distribuido por ArgentinaDatos. El cálculo encadena las variaciones mensuales de forma compuesta; no suma porcentajes.
          </p>
        </div>
        <div className="rounded-2xl border border-crema-200 p-5">
          <p className="font-bold">¿Cómo interpretar el resultado?</p>
          <p className="mt-2 leading-relaxed text-tinta/65">
            El valor equivalente indica cuánto dinero hace falta al final del período para comprar, en promedio, lo mismo que el monto inicial. *La pérdida de poder de compra expresa cuánto compraría el monto original si permaneciera sin ajustar.
          </p>
        </div>
      </section>
    </div>
  );
}
