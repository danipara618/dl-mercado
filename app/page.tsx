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
      </main>
      <Footer />
    </>
  );
}
