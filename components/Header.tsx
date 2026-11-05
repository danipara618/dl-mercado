import Link from "next/link";
import Logo from "./Logo";
import SiteNav from "./SiteNav";
export default function Header({activo}:{activo?:string}){
 return <header className="border-b border-crema-200/80 bg-crema-50/50">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
   <div className="flex flex-wrap items-center justify-between gap-4 py-5">
    <Logo/><SiteNav activo={activo}/><Link className="hidden text-xs font-semibold text-oliva hover:underline lg:block" href="/datos">Datos y descargas →</Link>
   </div>
  </div>
 </header>;
}