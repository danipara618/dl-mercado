import Link from "next/link";
import {Wallet,TrendingUp,ShoppingBasket,MapPin,ChartColumnIncreasing,House,Calculator,Landmark} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
const NUEVAS=[
 {href:"/calculadoras/precios-ingresos?tipo=sueldo",icon:Wallet,titulo:"¿Mi sueldo le ganó a la inflación?",detalle:"Conocé si ganaste o perdiste poder de compra."},
 {href:"/calculadoras/precios-ingresos?tipo=inflacion",icon:TrendingUp,titulo:"¿Cuánto aumentaron los precios?",detalle:"Compará dos meses y cuánto alcanza tu dinero."},
 {href:"/calculadoras/precios-ingresos?tipo=canasta",icon:ShoppingBasket,titulo:"¿Cuánto aumentó la canasta básica?",detalle:"Compará su costo con la inflación."},
 {href:"/calculadoras/precios-ingresos?tipo=regiones",icon:MapPin,titulo:"¿Dónde aumentaron más los precios?",detalle:"Elegí dos regiones y comparalas."},
 {href:"/calculadoras/precios-ingresos?tipo=productos",icon:ChartColumnIncreasing,titulo:"¿Qué productos están aumentando?",detalle:"Descubrí qué divisiones del IPC subieron más."},
];
const OTRAS=[
 {href:"/calculadoras/inflacion",icon:TrendingUp,titulo:"¿Cuánto vale hoy una suma de dinero?",detalle:"Actualizá un monto antiguo por inflación."},
 {href:"/calculadoras/alquiler",icon:House,titulo:"¿Cuánto me aumenta el alquiler?",detalle:"Estimá una actualización de tu contrato."},
 {href:"/calculadoras/interes-compuesto",icon:Calculator,titulo:"¿Cuánto puedo ahorrar con el tiempo?",detalle:"Proyectá tus aportes y rendimientos."},
 {href:"/calculadoras/retiro",icon:Landmark,titulo:"¿Cuánto necesito para mi retiro?",detalle:"Planeá un objetivo de capital futuro."},
 {href:"/calculadoras/nodocente",icon:Wallet,titulo:"¿Cuánto cobraría como no docente?",detalle:"Calculá una liquidación del convenio 366/06."},
];
export const metadata={title:"Calculadoras fáciles | DL Mercado",description:"Herramientas para comparar sueldo e inflación, canasta básica, regiones, alquileres, ahorro y retiro."};
export default function Calculadoras(){
 return <><Header/><main className="mx-auto max-w-7xl space-y-9 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
 <SectionTitle as="h1" title="Calculadoras" subtitle="Respondé preguntas sobre tu dinero en pocos pasos, sin tener que saber economía. Las fuentes y los cálculos se explican cuando los necesites."/>
 <section><h2 className="mb-5 font-serif text-3xl">Precios y poder de compra</h2>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{NUEVAS.map(({href,icon:Icon,titulo,detalle})=><Link key={href} href={href} className="group rounded-2xl border border-crema-200 bg-white p-6 shadow-sm transition hover:border-oliva/40 hover:shadow-md"><Icon size={24} className="text-oliva"/><h3 className="mt-4 font-semibold text-tinta">{titulo}</h3><p className="mt-2 text-sm text-tinta/60">{detalle}</p><span className="mt-5 inline-block text-sm font-semibold text-oliva">Calcular →</span></Link>)}</div>
 </section>
 <section><h2 className="mb-5 font-serif text-3xl">Otras herramientas que ya tenías</h2>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{OTRAS.map(({href,icon:Icon,titulo,detalle})=><Link key={href} href={href} className="group rounded-2xl border border-crema-200 bg-crema-50 p-5 transition hover:border-oliva/40"><Icon size={20} className="text-oliva"/><h3 className="mt-3 font-semibold">{titulo}</h3><p className="mt-1 text-sm text-tinta/60">{detalle}</p><span className="mt-3 inline-block text-sm font-semibold text-oliva">Abrir →</span></Link>)}</div>
 </section></main><Footer/></>;
}