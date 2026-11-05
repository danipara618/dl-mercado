import type {Metadata} from "next";
import {ArrowRight,GraduationCap,Mail} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
export const metadata:Metadata={title:"Clases particulares | DL Mercado",description:"Clases de macroeconomía, estadística, econometría y finanzas con Daniel Lezcano."};
export default function Clases(){
 return <><Header activo="/clases"/><main className="mx-auto max-w-5xl space-y-8 px-4 pb-16 pt-10 sm:px-6">
  <SectionTitle as="h1" title="Clases particulares" subtitle="Acompañamiento en economía, estadística, econometría y finanzas para estudiantes universitarios."/>
  <div className="rounded-3xl border border-crema-200 bg-white p-7 shadow-sm sm:p-10">
   <GraduationCap className="text-oliva" size={30}/>
   <h2 className="mt-4 font-serif text-3xl">Entendé los temas y practicá con ejercicios</h2>
   <p className="mt-3 max-w-2xl leading-relaxed text-tinta/65">Consultá disponibilidad de clases, preparación de exámenes y apoyo en materias cuantitativas. Podés ingresar al sitio de EconoClases o enviarme tu consulta.</p>
   <div className="mt-7 flex flex-wrap gap-3">
    <a href="https://econoclases.vercel.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-oliva px-5 py-3 text-sm font-bold text-white">Ir a Clases particulares <ArrowRight size={16}/></a>
    <a href="mailto:daniel.lezcano.032@gmail.com?subject=Consulta%20por%20clases" className="inline-flex items-center gap-2 rounded-full border border-oliva px-5 py-3 text-sm font-bold text-oliva"><Mail size={16}/> Consultar por correo</a>
   </div>
  </div>
 </main><Footer/></>;
}