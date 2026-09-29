import Logo from "./Logo";

export default function Header() {
  const hoy = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());

  return (
    <header className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between border-b border-crema-200 pb-6">
        <Logo />
        <p className="text-right text-sm text-tinta/60 first-letter:uppercase">{hoy}</p>
      </div>
      <div className="mt-10">
        <h1 className="inline-block font-serif text-6xl leading-none text-tinta sm:text-7xl">
          DL MERCADO
          <span aria-hidden="true" className="mt-3 block h-2.5 rounded-sm bg-oliva" />
        </h1>
        <p className="mt-4 max-w-xl text-base text-tinta/70">
          El pulso del mercado argentino y global en un solo tablero: dólar, riesgo país, curva soberana, pesos y
          Wall Street.
        </p>
      </div>
    </header>
  );
}
