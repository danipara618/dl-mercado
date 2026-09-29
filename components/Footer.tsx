import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-crema-200 bg-crema-50/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
        <Logo />
        <div className="max-w-2xl space-y-2 text-xs leading-relaxed text-tinta/60">
          <p>
            Fuentes: dolarapi.com, argentinadatos.com (riesgo país, inflación, plazo fijo), BCRA API Estadísticas v4.0
            (CER, UVA, reservas), data912.com (cotizaciones BYMA con demora) y Yahoo Finance.
          </p>
          <p>
            TIR efectiva anual calculada por Newton-Raphson sobre el cronograma contractual de cupones step-up y
            amortizaciones, con liquidación T+1. Información con fines educativos; no constituye recomendación de
            inversión.
          </p>
        </div>
      </div>
    </footer>
  );
}
