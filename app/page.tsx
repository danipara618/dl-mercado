import Link from "next/link";
import { ArrowRight, Calculator, ChartNoAxesCombined } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
import KPIGrid from "@/components/KPIGrid";
import RiskChart from "@/components/RiskChart";
import BondsSection from "@/components/BondsSection";
import PesosSection from "@/components/PesosSection";
import EquitySection from "@/components/EquitySection";
import GlobalMarkets from "@/components/GlobalMarkets";

// ISR: la fecha del encabezado se regenera cada 10 minutos; los datos se cargan en el cliente.
export const revalidate = 600;

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl space-y-16 px-4 pb-16 sm:px-6 lg:px-8">
        <section aria-labelledby="kpis">
          <SectionTitle id="kpis" title="Indicadores clave" subtitle="Tipo de cambio, riesgo soberano e índices de ajuste" />
          <KPIGrid />
        </section>

        <section aria-labelledby="riesgo">
          <SectionTitle id="riesgo" title="Riesgo país" subtitle="Spread del EMBI Argentina sobre Treasuries, en puntos básicos" />
          <RiskChart />
        </section>

        <BondsSection />
        <PesosSection />
        <EquitySection />
        <GlobalMarkets />

        <section aria-labelledby="herramientas">
          <SectionTitle
            id="herramientas"
            title="Herramientas"
            subtitle="Calculadoras para convertir datos económicos en decisiones y comparaciones más claras."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <Link
              href="/calculadoras/inflacion"
              className="group rounded-2xl border border-crema-200 bg-crema-50 p-6 transition hover:-translate-y-0.5 hover:border-oliva/40"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-xl bg-oliva-100 p-3 text-oliva">
                  <ChartNoAxesCombined size={24} />
                </span>
                <ArrowRight className="text-tinta/35 transition group-hover:translate-x-1 group-hover:text-oliva" size={21} />
              </div>
              <h3 className="mt-6 font-serif text-2xl">Inflación y poder adquisitivo</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-tinta/65">
                Descubrí cuánto equivale hoy un monto del pasado y cuánto poder de compra perdió frente al IPC.
              </p>
              <p className="mt-5 text-xs font-extrabold uppercase tracking-wider text-oliva">Calcular con IPC</p>
            </Link>

            <Link href="/calculadoras/interes-compuesto" className="group rounded-2xl border border-crema-200 bg-crema-50 p-6 transition hover:-translate-y-0.5 hover:border-oliva/40">
              <div className="flex items-start justify-between gap-4"><span className="rounded-xl bg-oliva-100 p-3 text-oliva"><Calculator size={24}/></span><ArrowRight className="text-tinta/35 transition group-hover:translate-x-1 group-hover:text-oliva" size={21}/></div>
              <h3 className="mt-6 font-serif text-2xl">Interés compuesto</h3><p className="mt-2 text-sm leading-relaxed text-tinta/65">Proyectá capital y aportes mensuales, incluyendo el resultado en poder adquisitivo real.</p>
            </Link>
            <Link href="/calculadoras/retiro" className="group rounded-2xl border border-crema-200 bg-crema-50 p-6 transition hover:-translate-y-0.5 hover:border-oliva/40">
              <div className="flex items-start justify-between gap-4"><span className="rounded-xl bg-oliva-100 p-3 text-oliva"><Calculator size={24}/></span><ArrowRight className="text-tinta/35 transition group-hover:translate-x-1 group-hover:text-oliva" size={21}/></div>
              <h3 className="mt-6 font-serif text-2xl">Retiro</h3><p className="mt-2 text-sm leading-relaxed text-tinta/65">Estimá tu capital futuro en USD y comparalo contra un objetivo expresado en dinero de hoy.</p>
            </Link>
            <Link href="/calculadoras/alquiler" className="group rounded-2xl border border-crema-200 bg-crema-50 p-6 transition hover:-translate-y-0.5 hover:border-oliva/40"><div className="flex items-start justify-between gap-4"><span className="rounded-xl bg-oliva-100 p-3 text-oliva"><Calculator size={24}/></span><ArrowRight className="text-tinta/35 transition group-hover:translate-x-1 group-hover:text-oliva" size={21}/></div><h3 className="mt-6 font-serif text-2xl">Alquiler</h3><p className="mt-2 text-sm leading-relaxed text-tinta/65">Calculá una actualización por IPC acumulado o por el porcentaje pactado en el contrato.</p></Link><div className="rounded-2xl border border-dashed border-crema-200 p-6 text-tinta/55"><span className="inline-block rounded-xl bg-crema-200/60 p-3"><Calculator size={24}/></span><h3 className="mt-6 font-serif text-2xl text-tinta/70">Próximamente</h3><p className="mt-2 text-sm">Calculadora salarial no-docente.</p></div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
