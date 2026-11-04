"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, RefreshCw } from "lucide-react";
import { INDEC_AREAS, INDEC_DATASETS, type AreaIndec } from "@/lib/indecCatalogo";

type Fila = Record<string, unknown>;
type Payload = { rows?: Fila[]; error?: string; fuente?: string; actualizado?: string };
type Punto = { fecha: string; valor: number };

const label = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function texto(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}
function numero(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string" || !v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function periodo(v: unknown): string {
  const s = texto(v);
  if (/^\d{6}$/.test(s)) return s.slice(0, 4) + "-" + s.slice(4);
  if (/^\d{4}$/.test(s)) return s;
  return s;
}
function csv(rows: Fila[], dataset: string) {
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: unknown) => '"' + texto(v).replace(/"/g, '""') + '"';
  const content = "\uFEFF" + [cols.join(";"), ...rows.map((r) => cols.map((c) => esc(r[c])).join(";"))].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "indec-" + dataset + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}
export default function ObservatorioIndec() {
  const [area, setArea] = useState<AreaIndec>("Precios");
  const [dataset, setDataset] = useState("ipc_nacional");
  const [rows, setRows] = useState<Fila[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState("");
  const [tick, setTick] = useState(0);
  const [metric, setMetric] = useState("valor");
  const [dateKey, setDateKey] = useState("periodo");
  const [dimension, setDimension] = useState("");
  const [dimensionValue, setDimensionValue] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 500;

  useEffect(() => {
    const ctrl = new AbortController();
    // El filtro anual se aplica también localmente porque algunos servicios no ofrecen anio.
    const url = `/api/indec/${dataset}?limit=${pageSize}&offset=${offset}`;
    setLoading(true); setError("");
    fetch(url, { signal: ctrl.signal })
      .then(async (r) => {
        const j = await r.json() as Payload;
        if (!r.ok) throw new Error(j.error || "Error al cargar datos oficiales.");
        return j;
      })
      .then((data) => {
        const next = Array.isArray(data.rows) ? data.rows : [];
        setRows((current) => offset === 0 ? next : [...current, ...next]);
        setHasMore(next.length === pageSize);
        setLast(data.actualizado || "");
      })
      .catch((err: unknown) => {
        if (!ctrl.signal.aborted) setError(err instanceof Error ? err.message : "Error desconocido");
      })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [dataset, offset, tick]);

  const columns = useMemo(() => Array.from(new Set(rows.flatMap((r) => Object.keys(r)))), [rows]);
  const numericColumns = useMemo(() => columns.filter((col) => rows.some((r) => numero(r[col]) !== null)), [rows, columns]);
  const dateColumns = useMemo(() => ["periodo", "fecha", "anio", "año"].filter((k) => columns.includes(k)), [columns]);
  const dimensionColumns = useMemo(() => columns.filter((c) => !numericColumns.includes(c) && c !== "periodo" && c !== "fecha" && rows.some((r) => texto(r[c]).trim())), [columns, numericColumns, rows]);
  const selectedMetric = numericColumns.includes(metric) ? metric : (numericColumns.includes("valor") ? "valor" : numericColumns[0] || "");
  const selectedDate = dateColumns.includes(dateKey) ? dateKey : (dateColumns[0] || "");
  const selectedDimension = dimensionColumns.includes(dimension) ? dimension : "";
  const values = useMemo(() => selectedDimension ? Array.from(new Set(rows.map((r) => texto(r[selectedDimension])))).filter(Boolean).sort((a,b)=>a.localeCompare(b,"es")).slice(0,200) : [], [rows, selectedDimension]);
  const selectedValue = values.includes(dimensionValue) ? dimensionValue : "";
  const filtered = useMemo(() => rows.filter((r) => {
    if (selectedDimension && selectedValue && texto(r[selectedDimension]) !== selectedValue) return false;
    const year = Number(texto(r.anio || r.periodo || "").slice(0, 4));
    if (yearFrom && Number.isFinite(year) && year < Number(yearFrom)) return false;
    if (yearTo && Number.isFinite(year) && year > Number(yearTo)) return false;
    if (search && !Object.values(r).some((v) => texto(v).toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  }), [rows, selectedDimension, selectedValue, yearFrom, yearTo, search]);
  const points = useMemo<Punto[]>(() => {
    if (!selectedMetric || !selectedDate) return [];
    const grouped = new Map<string, number[]>();
    for (const row of filtered) {
      const k = periodo(row[selectedDate]);
      const value = numero(row[selectedMetric]);
      if (!k || value === null) continue;
      const prev = grouped.get(k) || [];
      prev.push(value);
      grouped.set(k, prev);
    }
    // Evitar promediar series heterogéneas: no trazamos meses con varias observaciones.
    return Array.from(grouped.entries())
      .filter(([, a]) => a.length === 1)
      .map(([fecha, a]) => ({ fecha, valor: a[0] }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [filtered, selectedDate, selectedMetric]);
  const latest = points.at(-1);

  function changeDataset(next: string) {
    const d = INDEC_DATASETS.find((item) => item.id === next);
    if (!d) return;
    setArea(d.area); setDataset(next); setOffset(0); setRows([]);
    setMetric("valor"); setDateKey("periodo"); setDimension(""); setDimensionValue("");
    setYearFrom(""); setYearTo(""); setSearch(""); setHasMore(false); setLast("");
  }
  const current = INDEC_DATASETS.find((d) => d.id === dataset)!;

  return <div className="space-y-7">
    <section className="rounded-3xl border border-crema-200 bg-white p-5 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-oliva">Datos oficiales · INDEC</p>
      <h2 className="mt-2 font-serif text-3xl text-tinta sm:text-4xl">Observatorio macroeconómico</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-tinta/65">
        Explorá las series del catálogo oficial, filtrá los resultados y descargá los registros.
        Los indicadores mantienen su período, unidad y desagregación original; no se mezclan series de distinta definición.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {INDEC_AREAS.map((a) => <button type="button" key={a} onClick={() => { setArea(a); const next = INDEC_DATASETS.find((d) => d.area === a); if (next) changeDataset(next.id); }}
          className={`rounded-full border px-4 py-2 text-sm font-bold ${area === a ? "border-oliva bg-oliva text-white" : "border-crema-200 bg-crema-50 text-tinta hover:border-oliva/40"}`}>{a}</button>)}
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {INDEC_DATASETS.filter((d) => d.area === area).map((d) => <button type="button" key={d.id} onClick={() => changeDataset(d.id)}
          className={`rounded-xl border p-3 text-left text-sm transition ${dataset === d.id ? "border-oliva bg-oliva-100 text-oliva" : "border-crema-200 text-tinta hover:bg-crema-50"}`}>
          <span className="font-semibold">{d.titulo}</span><span className="mt-1 block text-xs opacity-65">{d.descripcion}</span>
        </button>)}
      </div>
    </section>

    <section className="rounded-3xl border border-crema-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h3 className="font-serif text-2xl">{current.titulo}</h3><p className="mt-1 text-xs text-tinta/50">Fuente: Instituto Nacional de Estadística y Censos (INDEC) · API oficial</p></div>
        <div className="flex gap-2">
          <button type="button" disabled={loading} onClick={() => { setOffset(0); setRows([]); setHasMore(false); setTick((i) => i + 1); }} className="inline-flex items-center gap-2 rounded-full border border-crema-200 px-3 py-2 text-xs font-semibold disabled:opacity-40"><RefreshCw size={14}/> Actualizar</button>
          <button type="button" disabled={!filtered.length} onClick={() => csv(filtered, dataset)} className="inline-flex items-center gap-2 rounded-full bg-oliva px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><Download size={14}/> CSV</button>
        </div>
      </div>
      {error && <div role="status" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{error} {error.includes("INDEC_API_TOKEN") ? "Registrá una clave JWT en el portal oficial y configurala como variable de entorno privada en Vercel." : ""}</div>}
      {loading && <p className="mt-5 text-sm text-tinta/60">Consultando los registros de INDEC…</p>}
      {!!rows.length && <>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold text-tinta/70">Indicador numérico
            <select value={selectedMetric} onChange={(e) => setMetric(e.target.value)} className="mt-1 w-full rounded-lg border border-crema-200 bg-crema-50 px-3 py-2 text-sm text-tinta">
              {numericColumns.map((v) => <option key={v} value={v}>{label(v)}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-tinta/70">Período
            <select value={selectedDate} onChange={(e) => setDateKey(e.target.value)} className="mt-1 w-full rounded-lg border border-crema-200 bg-crema-50 px-3 py-2 text-sm text-tinta">
              {dateColumns.map((v) => <option key={v} value={v}>{label(v)}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-tinta/70">Desagregación
            <select value={selectedDimension} onChange={(e) => { setDimension(e.target.value); setDimensionValue(""); }} className="mt-1 w-full rounded-lg border border-crema-200 bg-crema-50 px-3 py-2 text-sm text-tinta">
              <option value="">Todas las categorías</option>
              {dimensionColumns.map((v) => <option key={v} value={v}>{label(v)}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-tinta/70">Categoría
            <select value={selectedValue} onChange={(e) => setDimensionValue(e.target.value)} disabled={!selectedDimension} className="mt-1 w-full rounded-lg border border-crema-200 bg-crema-50 px-3 py-2 text-sm text-tinta disabled:opacity-40">
              <option value="">Todas</option>{values.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-tinta/70">Desde (año)
            <input type="number" min="1980" max="2050" value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} placeholder="Ej. 2020" className="mt-1 w-full rounded-lg border border-crema-200 bg-crema-50 px-3 py-2 text-sm"/>
          </label>
          <label className="text-xs font-semibold text-tinta/70">Hasta (año)
            <input type="number" min="1980" max="2050" value={yearTo} onChange={(e) => setYearTo(e.target.value)} placeholder="Ej. 2026" className="mt-1 w-full rounded-lg border border-crema-200 bg-crema-50 px-3 py-2 text-sm"/>
          </label>
          <label className="text-xs font-semibold text-tinta/70 sm:col-span-2">Buscar en los registros
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filtrar país, región, indicador, período..." className="mt-1 w-full rounded-lg border border-crema-200 bg-crema-50 px-3 py-2 text-sm"/>
          </label>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-crema-50 p-4"><span className="text-xs text-tinta/55">Registros cargados</span><p className="mt-1 font-mono text-2xl">{rows.length.toLocaleString("es-AR")}</p></div>
          <div className="rounded-xl bg-crema-50 p-4"><span className="text-xs text-tinta/55">Registros filtrados</span><p className="mt-1 font-mono text-2xl">{filtered.length.toLocaleString("es-AR")}</p></div>
          <div className="rounded-xl bg-crema-50 p-4"><span className="text-xs text-tinta/55">Último punto único</span><p className="mt-1 font-mono text-xl">{latest ? latest.valor.toLocaleString("es-AR", { maximumFractionDigits: 2 }) : "—"}</p><p className="text-xs text-tinta/45">{latest?.fecha || "Sin serie homogénea"}</p></div>
        </div>
        <div className="mt-6 rounded-2xl border border-crema-200 p-4">
          <h4 className="text-sm font-semibold">Evolución de {label(selectedMetric)}</h4>
          {points.length > 1 ? <div className="mt-3 h-[310px] w-full">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={points}>
              <CartesianGrid vertical={false} stroke="#E7DECD"/>
              <XAxis dataKey="fecha" minTickGap={32} tick={{fontSize:11}}/>
              <YAxis width={65} tick={{fontSize:11}}/>
              <Tooltip formatter={(v: number) => [v.toLocaleString("es-AR", {maximumFractionDigits:3}),label(selectedMetric)]}/>
              <Line type="monotone" dataKey="valor" stroke="#2C3A22" strokeWidth={2.5} dot={false} isAnimationActive={false}/>
            </LineChart></ResponsiveContainer>
          </div> : <p className="mt-3 rounded-xl bg-crema-50 p-4 text-sm text-tinta/60">
            No hay una serie temporal única para graficar. Seleccioná una desagregación y su categoría; el gráfico evita promediar regiones, divisiones o indicadores diferentes.
          </p>}
        </div>
        <div className="mt-6 overflow-x-auto rounded-xl border border-crema-200">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-crema-50 text-tinta/65"><tr>{columns.map((c) => <th key={c} className="whitespace-nowrap border-b border-crema-200 px-3 py-3 font-bold">{label(c)}</th>)}</tr></thead>
            <tbody>{filtered.slice(0, 100).map((r, i) => <tr key={i} className="border-b border-crema-200/60 hover:bg-crema-50">{columns.map((c) => <td key={c} className="max-w-[280px] truncate px-3 py-2" title={texto(r[c])}>{texto(r[c]) || "—"}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-tinta/50">Mostrando hasta 100 filas de {filtered.length}. La descarga CSV incluye todos los registros filtrados que se hayan cargado.</p>
        {hasMore && <button type="button" disabled={loading} onClick={() => setOffset((n) => n + pageSize)} className="mt-4 rounded-full border border-oliva px-4 py-2 text-sm font-bold text-oliva disabled:opacity-40">Cargar otros 500 registros</button>}
        <p className="mt-4 text-xs text-tinta/45">
          {last ? `Consulta: ${new Date(last).toLocaleString("es-AR")} · ` : ""}La API devuelve registros parciales paginados. Los gráficos no suman ni promedian categorías distintas. Valores provisorios y revisiones sujetos a INDEC.
        </p>
      </>}
      {!loading && !error && rows.length === 0 && <p className="mt-5 text-sm text-tinta/55">Este servicio no devolvió registros para la consulta.</p>}
    </section>
    <p className="text-xs leading-relaxed text-tinta/50">
      Fuente primaria: <a className="font-bold underline" href="https://api.indec.gob.ar/" target="_blank" rel="noreferrer">Catálogo API-INDEC</a>.
      DL Mercado es un sitio independiente y no oficial. INDEC no es responsable por el procesamiento o visualización de terceros.
    </p>
  </div>;
}
