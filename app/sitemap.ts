import type {MetadataRoute} from "next";
import {listarNotas} from "@/lib/notas";
import {SITE_URL} from "@/lib/site";
export const revalidate=3600;
export default function sitemap():MetadataRoute.Sitemap {
 const rutas=[
  ["/","daily",1],["/mercados","daily",.95],["/economia","daily",.95],
  ["/calculadoras","monthly",.8],["/calculadoras/precios-ingresos","monthly",.8],
  ["/clases","monthly",.8],["/cursos","monthly",.6],
  ["/notas","daily",.9],["/sobre-mi","monthly",.8],["/datos","monthly",.7],
  ["/series","daily",.65],["/observatorio","daily",.65]
 ] as const;
 return [...rutas.map(([href,freq,priority])=>({url:SITE_URL+href,changeFrequency:freq,priority})),
   ...listarNotas().map(n=>({url:`${SITE_URL}/notas/${n.slug}`,lastModified:n.fecha,changeFrequency:"monthly" as const,priority:.8}))];
}