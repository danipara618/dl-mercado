import Link from "next/link";
const LINKS=[
 {href:"/",label:"Inicio"},
 {href:"/mercados",label:"Mercados"},
 {href:"/economia",label:"Economía argentina"},
 {href:"/calculadoras",label:"Calculadoras"},
 {href:"/notas",label:"Notas"},
 {href:"/clases",label:"Clases particulares"},
 {href:"/cursos",label:"Cursos"},
 {href:"/sobre-mi",label:"Sobre mí"},
];
export default function SiteNav({activo}:{activo?:string}){
 return <nav aria-label="Navegación principal" className="flex max-w-full items-center gap-4 overflow-x-auto whitespace-nowrap pb-1 text-xs font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 sm:text-sm">
  {LINKS.map(l=><Link key={l.href} href={l.href} aria-current={activo===l.href?"page":undefined}
   className={activo===l.href?"text-oliva underline decoration-2 underline-offset-8":"text-tinta/60 transition hover:text-oliva"}>{l.label}</Link>)}
 </nav>;
}