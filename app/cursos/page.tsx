import type {Metadata} from "next";
import {BookOpen} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
export const metadata:Metadata={title:"Cursos · Próximamente | DL Mercado",description:"Próximos cursos online de EconoClases. Todavía no hay inscripciones abiertas."};
export default function Cursos(){
 return <><Header activo="/cursos"/><main className="mx-auto max-w-5xl space-y-8 px-4 pb-20 pt-10 sm:px-6">
  <SectionTitle as="h1" title="Cursos online" subtitle="EconoClases Academy: formación en economía, finanzas y análisis de datos."/>
  <div className="rounded-3xl bg-[#172511] p-8 text-white sm:p-12">
   <BookOpen size={30}/><span className="mt-6 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest">Próximamente</span>
   <h2 className="mt-4 font-serif text-4xl">Estamos preparando los contenidos.</h2>
   <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75">Todavía no hay cursos publicados ni inscripciones disponibles. Cuando estén listos, vas a encontrar acá el enlace al catálogo de EconoClases Academy.</p>
  </div>
 </main><Footer/></>;
}