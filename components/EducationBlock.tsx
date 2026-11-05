import {ArrowRight,BookOpen,GraduationCap} from "lucide-react";
import Link from "next/link";
export default function EducationBlock(){
 return <section id="cursos" className="rounded-3xl bg-[#172511] p-7 text-white sm:p-10">
  <p className="font-serif text-lg text-[#D7DEB8]">EconoClases</p>
  <h2 className="mt-2 font-serif text-4xl">CLASES Y CURSOS</h2>
  <p className="mt-3 max-w-2xl text-sm text-white/70">Aprender economía con explicaciones claras, ejercicios y herramientas útiles.</p>
  <div className="mt-7 grid gap-4 md:grid-cols-2">
   <article className="rounded-2xl bg-white/10 p-6 ring-1 ring-white/10">
    <GraduationCap size={25}/><h3 className="mt-4 font-serif text-2xl">Clases particulares</h3>
    <p className="mt-2 text-sm text-white/75">Macroeconomía, estadística, econometría y finanzas. Acompañamiento para tus materias universitarias.</p>
    <Link href="/clases" className="mt-5 inline-flex items-center gap-2 rounded-full bg-crema px-4 py-2 text-sm font-bold text-oliva">Consultar clases <ArrowRight size={15}/></Link>
   </article>
   <article className="rounded-2xl bg-white/10 p-6 ring-1 ring-white/10">
    <BookOpen size={25}/><h3 className="mt-4 font-serif text-2xl">Cursos online</h3>
    <span className="mt-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/80">Próximamente</span>
    <p className="mt-3 text-sm text-white/75">Estamos preparando los contenidos. Todavía no hay cursos disponibles para inscribirse.</p>
    <Link href="/cursos" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white underline underline-offset-4">Conocer el proyecto <ArrowRight size={15}/></Link>
   </article>
  </div>
 </section>;
}