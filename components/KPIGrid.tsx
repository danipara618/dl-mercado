"use client";
// Grilla de indicadores: dólares, riesgo país, CER, UVA, inflación, reservas, plazo fijo
//
// Rendimiento: cada fuente de datos vive en su PROPIO componente hoja (DolarCards,
// RiesgoCard, CerCard, UvaCard, ReservasCard, IndicadoresCards), cada uno con su propio
// useApi(). Antes, las 6 llamadas a useApi vivían juntas en KPIGrid: un tick de polling
// de /api/dolares (cada 60s) reconstruía el JSX de las 13 tarjetas, incluidas las que
// dependen de /api/bcra/* (que recién cambian cada hora). Con esta separación, el
// setState de un hook solo re-renderiza su propia tarjeta — las demás ni se tocan.
import {
  Activity, ArrowLeftRight, Banknote, Bitcoin, Building2, CalendarClock,
  Globe, House, Landmark, PiggyBank, ShoppingCart, TrendingUp,
} from "lucide-react";
import KPICard from "./KPICard";
import Change from "./Change";
import { useApi } from "@/lib/useApi";
import { fmtFecha, fmtNum, fmtPct } from "@/lib/format";
import type { BcraSerie, Dolar, Indicadores, RiesgoResumen } from "@/lib/types";

const MIN = 60_000;
const HORA = 3_600_000;

const varSerie = (s: BcraSerie | null) =>
  s?.ultimo && s.anterior ? ((s.ultimo.valor / s.anterior.valor - 1) * 100) : null;

function DolarCards() {
  const dol = useApi<Dolar[]>("/api/dolares", MIN);
  const d = (casa: string) => dol.data?.find((x) => x.casa === casa);
  const oficial = d("oficial")?.venta ?? null;
  const brecha = (v?: number | null) => (v && oficial ? fmtPct((v / oficial - 1) * 100, 1, false) : null);
  const cargando = dol.loading && !dol.data;

  const tarjeta = (casa: string, titulo: string, icono: typeof Landmark, conBrecha = true) => {
    const x = d(casa);
    const b = conBrecha ? brecha(x?.venta) : null;
    return (
      <KPICard
        key={casa}
        icono={icono}
        titulo={titulo}
        valor={`$ ${fmtNum(x?.venta ?? null, 2)}`}
        detalle={x ? `Compra $ ${fmtNum(x.compra, 2)}${b ? ` · Brecha ${b}` : ""}` : undefined}
        loading={cargando}
        error={!cargando && !x}
      />
    );
  };

  return (
    <>
      {tarjeta("oficial", "Dólar oficial (BNA)", Landmark, false)}
      {tarjeta("bolsa", "Dólar MEP", ArrowLeftRight)}
      {tarjeta("contadoconliqui", "Dólar CCL", Globe)}
      {tarjeta("blue", "Dólar blue", Banknote)}
      {tarjeta("mayorista", "Dólar mayorista", Building2, false)}
      {tarjeta("cripto", "Dólar cripto", Bitcoin)}
    </>
  );
}

function RiesgoCard() {
  const rp = useApi<RiesgoResumen>("/api/riesgo-pais", MIN);
  return (
    <KPICard
      icono={Activity}
      titulo="Riesgo país"
      valor={fmtNum(rp.data?.ultimo.valor ?? null, 0)}
      unidad="pb"
      variacion={
        rp.data?.anterior ? (
          <Change valor={rp.data.ultimo.valor - rp.data.anterior.valor} tipo="abs" dec={0} sufijo=" pb" invertir />
        ) : undefined
      }
      detalle={rp.data ? fmtFecha(rp.data.ultimo.fecha) : undefined}
      loading={rp.loading && !rp.data}
      error={!!rp.error && !rp.data}
    />
  );
}

function CerCard() {
  const cer = useApi<BcraSerie>("/api/bcra/30", HORA);
  return (
    <KPICard
      icono={TrendingUp}
      titulo="CER"
      valor={fmtNum(cer.data?.ultimo?.valor ?? null, 4)}
      variacion={<Change valor={varSerie(cer.data)} dec={3} invertir />}
      detalle={cer.data?.ultimo ? fmtFecha(cer.data.ultimo.fecha) : undefined}
      loading={cer.loading && !cer.data}
      error={!!cer.error && !cer.data}
    />
  );
}

function UvaCard() {
  const uva = useApi<BcraSerie>("/api/bcra/31", HORA);
  return (
    <KPICard
      icono={House}
      titulo="UVA"
      valor={`$ ${fmtNum(uva.data?.ultimo?.valor ?? null, 2)}`}
      variacion={<Change valor={varSerie(uva.data)} dec={3} invertir />}
      detalle={uva.data?.ultimo ? fmtFecha(uva.data.ultimo.fecha) : undefined}
      loading={uva.loading && !uva.data}
      error={!!uva.error && !uva.data}
    />
  );
}

function ReservasCard() {
  const res = useApi<BcraSerie>("/api/bcra/1", HORA);
  return (
    <KPICard
      icono={PiggyBank}
      titulo="Reservas BCRA"
      valor={fmtNum(res.data?.ultimo?.valor ?? null, 0)}
      unidad="MM USD"
      variacion={
        res.data?.ultimo && res.data.anterior ? (
          <Change valor={res.data.ultimo.valor - res.data.anterior.valor} tipo="abs" dec={0} sufijo=" MM" />
        ) : undefined
      }
      detalle={res.data?.ultimo ? fmtFecha(res.data.ultimo.fecha) : undefined}
      loading={res.loading && !res.data}
      error={!!res.error && !res.data}
    />
  );
}

function IndicadoresCards() {
  const ind = useApi<Indicadores>("/api/indicadores", HORA);
  return (
    <>
      <KPICard
        icono={ShoppingCart}
        titulo="Inflación mensual (IPC)"
        valor={fmtNum(ind.data?.inflacionMensual?.valor ?? null, 1)}
        unidad="%"
        detalle={
          ind.data?.inflacionInteranual
            ? `Interanual ${fmtNum(ind.data.inflacionInteranual.valor, 1)}% · ${fmtFecha(ind.data.inflacionMensual?.fecha, true)}`
            : undefined
        }
        loading={ind.loading && !ind.data}
        error={!ind.loading && !ind.data?.inflacionMensual}
      />
      <KPICard
        icono={CalendarClock}
        titulo="Plazo fijo 30 días (TNA prom.)"
        valor={fmtNum(ind.data?.plazoFijo?.promedioTna ?? null, 2)}
        unidad="%"
        detalle={
          ind.data?.plazoFijo
            ? `Máx. ${fmtNum(ind.data.plazoFijo.bancos[0].tna, 2)}% · ${ind.data.plazoFijo.bancos.length} bancos`
            : undefined
        }
        loading={ind.loading && !ind.data}
        error={!ind.loading && !ind.data?.plazoFijo}
      />
    </>
  );
}

export default function KPIGrid() {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 justify-center gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:h-full">
      <DolarCards />
      <RiesgoCard />
      <CerCard />
      <UvaCard />
      <IndicadoresCards />
      <ReservasCard />
    </div>
  );
}
