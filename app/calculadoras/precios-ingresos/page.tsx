import type {Metadata} from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
import CalculadorasFaciles from "@/components/calculators/CalculadorasFaciles";
export const metadata:Metadata={title:"Precios y poder adquisitivo | DL Mercado",description:"¿Tu sueldo le ganó a la inflación? ¿Cuánto aumentaron los precios? Calculadoras sencillas con datos del IPC."};
export default function Page(){
 return <><Header/><main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
 <SectionTitle as="h1" title="Tu dinero y la economía" subtitle="Elegí una pregunta, completá unos pocos datos y descubrí qué pasó con tu poder de compra."/>
 <CalculadorasFaciles/>
 </main><Footer/></>;
}