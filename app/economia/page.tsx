import type {Metadata} from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MacroDashboard from "@/components/MacroDashboard";
import SectionTitle from "@/components/SectionTitle";
export const metadata:Metadata={title:"Economía argentina en datos | DL Mercado",description:"Indicadores del INDEC de precios, actividad, trabajo, pobreza, población y comercio exterior, con gráficos y CSV."};
export default function EconomiaPage(){
 return <><Header activo="/economia"/><main className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
  <SectionTitle as="h1" title="Economía argentina" subtitle="Cinco áreas con estadísticas seleccionadas para entender los datos sin completar formularios. Descargá cada serie en CSV."/>
  <MacroDashboard/>
 </main><Footer/></>;
}