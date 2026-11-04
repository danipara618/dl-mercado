import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TableroMacro from "@/components/TableroMacro";
export const metadata: Metadata = {
 title:"Tablero Macro | DL Mercado",
 description:"Visualizaciones de inflación, canastas, actividad, industria, salarios, empleo, exportaciones, importaciones, pobreza y PIB per cápita con fuentes oficiales.",
};
export default function TableroMacroPage(){
 return <><Header/><main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8"><TableroMacro/></main><Footer/></>;
}
