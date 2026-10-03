import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
import InflationCalculator from "@/components/calculators/InflationCalculator";

export const metadata = {
  title: "Calculadora de inflación | DL Mercado",
  description: "Calculá cuánto vale hoy un monto histórico según la inflación argentina.",
};

export default function InflacionPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionTitle
          as="h1"
          title="Calculadora de inflación"
          subtitle="Compará el poder adquisitivo de un monto entre dos meses usando la variación acumulada del IPC."
        />
        <InflationCalculator />
      </main>
      <Footer />
    </>
  );
}
