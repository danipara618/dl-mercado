import Link from "next/link";
import { ArrowRight, BarChart3, Calculator } from "lucide-react";
import Logo from "./Logo";
import SiteNav from "./SiteNav";

export default function Header() {
  const hoy = new Intl.DateTimeFormat("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());

  return (
    <header className="border-b border-crema-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-crema-200 py-5">
          <Logo />
          <SiteNav activo="/" />
          <p className="hidden text-right text-xs text-tinta/45 lg:block first-letter:uppercase">{hoy}</p>
        </div>

        <div className="grid gap-8 py-10 lg:grid-cols-[1.25fr_.75fr] lg:items-end lg:py-12">
          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[.22em] text-oliva">Economía · Mercados · Datos</p>
            <h1 className="font-serif text-5xl leading-[.9] text-tinta sm:text-7xl">DL MERCADO</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-tinta/65">
              Mercado argentino, tablero macro y herramientas para transformar datos económicos en información útil.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <Link href="#mercado" className="group flex items-center justify-between rounded-xl border border-crema-200 bg-white/65 px-4 py-3 text-sm font-bold text-oliva">
              <span className="flex items-center gap-2"><BarChart3 size={17}/> Ver mercado</span><ArrowRight size={15} className="transition group-hover:translate-x-1"/>
            </Link>
            <Link href="#macro" className="group flex items-center justify-between rounded-xl border border-crema-200 bg-white/65 px-4 py-3 text-sm font-bold text-oliva">
              <span className="flex items-center gap-2"><BarChart3 size={17}/> Tablero macro</span><ArrowRight size={15} className="transition group-hover:translate-x-1"/>
            </Link>
            <Link href="#herramientas" className="group flex items-center justify-between rounded-xl border border-crema-200 bg-white/65 px-4 py-3 text-sm font-bold text-oliva">
              <span className="flex items-center gap-2"><Calculator size={17}/> Calculadoras</span><ArrowRight size={15} className="transition group-hover:translate-x-1"/>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}