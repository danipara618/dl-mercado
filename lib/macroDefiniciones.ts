// Tablero Macro: selección editorial de indicadores. No equivale a un catálogo de todas las filas.
export type MacroTab = "Precios" | "Actividad" | "Trabajo e ingresos" | "Comercio exterior" | "Pobreza y población" | "Mercado";
export type MacroIndicador = {
  id: string;
  titulo: string;
  descripcion: string;
  tab: MacroTab;
  fuente: "indec" | "bm" | "bcra" | "mercado";
  servicio?: string;
  ruta?: string;
  preferencia?: string;
  nota?: string;
};
export const MACRO_TABS: MacroTab[] = [
  "Precios", "Actividad", "Trabajo e ingresos", "Comercio exterior", "Pobreza y población", "Mercado",
];
export const MACRO_INDICADORES: MacroIndicador[] = [
  {id:"ipc",titulo:"IPC nacional y regional",descripcion:"Índice de precios por región y división; elegí una serie homogénea.",tab:"Precios",fuente:"indec",servicio:"ipc_nacional",preferencia:"nivel general nacional"},
  {id:"canastas",titulo:"Canasta básica alimentaria y total",descripcion:"Valores de la CBA y la CBT según el hogar y el área cubiertos por INDEC.",tab:"Precios",fuente:"indec",servicio:"valorizacion_canastas_cba_cbt",preferencia:"cbt hogar 2"},
  {id:"industria",titulo:"Industria manufacturera",descripcion:"Índice de producción manufacturera, series y aperturas disponibles.",tab:"Actividad",fuente:"indec",servicio:"ipi_manufacturero",preferencia:"nivel general original"},
  {id:"emae",titulo:"Actividad económica · EMAE",descripcion:"Nivel de actividad, variaciones y series ajustadas estacionalmente.",tab:"Actividad",fuente:"indec",servicio:"estimador-mensual-de-actividad-economica-nivel-general",preferencia:"nivel general desestacionalizada"},
  {id:"emae-sectores",titulo:"Actividad por sectores",descripcion:"Evolución por rama económica, sin mezclar sectores.",tab:"Actividad",fuente:"indec",servicio:"estimador-mensual-de-actividad-economica-sectores"},
  {id:"salarios",titulo:"Índice de salarios",descripcion:"Salarios por sector. El índice de nivel permite construir salario real.",tab:"Trabajo e ingresos",fuente:"indec",servicio:"indice_salarios",preferencia:"nivel general índice"},
  {id:"empleo",titulo:"Empleo y desocupación",descripcion:"Tasas trimestrales de mercado laboral, EPH 31 aglomerados.",tab:"Trabajo e ingresos",fuente:"indec",servicio:"mercado_trabajo_eph",preferencia:"desocupación"},
  {id:"exportaciones",titulo:"Exportaciones FOB",descripcion:"Bienes exportados; país, rubro y período según fuente.",tab:"Comercio exterior",fuente:"indec",servicio:"comercio_exterior_exportacion_bienes",preferencia:"total"},
  {id:"importaciones",titulo:"Importaciones CIF",descripcion:"Bienes importados, países y usos económicos.",tab:"Comercio exterior",fuente:"indec",servicio:"comercio_exterior_importacion_bienes",preferencia:"total"},
  {id:"pobreza",titulo:"Pobreza e indigencia",descripcion:"Tasas semestrales de personas y hogares según EPH.",tab:"Pobreza y población",fuente:"indec",servicio:"pobreza_eph",preferencia:"personas pobreza"},
  {id:"pib-per-capita",titulo:"PIB real por habitante",descripcion:"US$ constantes de 2015, frecuencia anual. Fuente complementaria: Banco Mundial.",tab:"Pobreza y población",fuente:"bm",nota:"No procede de la API-INDEC; se utiliza Banco Mundial WDI NY.GDP.PCAP.KD."},
  {id:"reservas",titulo:"Reservas internacionales",descripcion:"Serie del Banco Central de la República Argentina.",tab:"Mercado",fuente:"bcra",ruta:"/api/bcra/1",nota:"Unidad conforme al BCRA."},
  {id:"dolar-mayorista",titulo:"Tipo de cambio mayorista",descripcion:"Evolución del tipo de cambio de referencia BCRA.",tab:"Mercado",fuente:"bcra",ruta:"/api/bcra/5"},
  {id:"badlar",titulo:"Tasa BADLAR",descripcion:"Tasa de interés de bancos privados.",tab:"Mercado",fuente:"bcra",ruta:"/api/bcra/7"},
  {id:"riesgo",titulo:"Riesgo país",descripcion:"EMBI Argentina. Serie informativa de mercado.",tab:"Mercado",fuente:"mercado",ruta:"/api/riesgo-pais/historico"},
];
