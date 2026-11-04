import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CalculadorasMacro from "@/components/calculators/CalculadorasMacro";
export const metadata={title:"Calculadoras macroeconómicas | DL Mercado",description:"Salarios reales, IPC acumulado, canasta básica en términos reales, brecha regional de inflación y difusión de precios."};
export default function Page(){
 return <><Header/><main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8"><CalculadorasMacro/></main><Footer/></>;
}
