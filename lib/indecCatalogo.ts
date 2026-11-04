// Catálogo público y explícito de los servicios del INDEC admitidos por nuestro proxy.
// No se aceptan URLs arbitrarias suministradas por el navegador.
export type AreaIndec = "Precios" | "Actividad" | "Trabajo" | "Población" | "Comercio";

export type IndecDataset = {
  id: string;
  titulo: string;
  area: AreaIndec;
  descripcion: string;
  unidadSugerida?: string;
};

export const INDEC_DATASETS: IndecDataset[] = [
  { id: "ipc_nacional", titulo: "Precios al consumidor (IPC)", area: "Precios", descripcion: "Índice de precios por región, división y tipo de indicador." },
  { id: "sipm_precios_mayoristas", titulo: "Precios mayoristas", area: "Precios", descripcion: "IPIM, IPIB e IPP." },
  { id: "icc_precios_construccion", titulo: "Costo de la construcción", area: "Precios", descripcion: "ICC del Gran Buenos Aires y sus componentes." },
  { id: "valorizacion_canastas_cba_cbt", titulo: "Canastas básicas", area: "Precios", descripcion: "CBA y CBT para hogares de referencia." },
  { id: "canasta-crianza", titulo: "Canasta de crianza", area: "Precios", descripcion: "Bienes, servicios y tiempo de cuidado por edad." },
  { id: "redeterminacion_precios_contratos_obras_publicas", titulo: "Redeterminación de obra pública", area: "Precios", descripcion: "Factores de costos de obra pública." },
  { id: "estimador-mensual-de-actividad-economica-nivel-general", titulo: "Actividad económica (EMAE)", area: "Actividad", descripcion: "Nivel general, series originales y desestacionalizadas." },
  { id: "estimador-mensual-de-actividad-economica-sectores", titulo: "EMAE por sector", area: "Actividad", descripcion: "Variaciones de actividad por rama." },
  { id: "ipi_manufacturero", titulo: "Producción manufacturera", area: "Actividad", descripcion: "IPI manufacturero por actividades." },
  { id: "ipi_minero", titulo: "Producción minera", area: "Actividad", descripcion: "IPI minero por productos y series." },
  { id: "indice_salarios", titulo: "Índice de salarios", area: "Trabajo", descripcion: "Evolución nominal de salarios por sector." },
  { id: "mercado_trabajo_eph", titulo: "Mercado de trabajo", area: "Trabajo", descripcion: "Empleo, actividad y desocupación de la EPH." },
  { id: "pobreza_eph", titulo: "Pobreza e indigencia", area: "Trabajo", descripcion: "Incidencia semestral de pobreza e indigencia." },
  { id: "proyecciones_poblacion_nacional_2022_2040", titulo: "Proyecciones de población", area: "Población", descripcion: "Población nacional por sexo y edad, base Censo 2022." },
  { id: "proyecciones_poblacion_jurisdiccion_2022_2040", titulo: "Población por provincia", area: "Población", descripcion: "Estimaciones por jurisdicción." },
  { id: "estimaciones_poblacion_departamento_2022_2035", titulo: "Población por departamento", area: "Población", descripcion: "Estimaciones por departamento o partido." },
  { id: "comercio_exterior_exportacion_bienes", titulo: "Exportaciones de bienes", area: "Comercio", descripcion: "Exportaciones por país, rubro y período." },
  { id: "comercio_exterior_importacion_bienes", titulo: "Importaciones de bienes", area: "Comercio", descripcion: "Importaciones por país, uso y período." },
];

export const INDEC_AREAS: AreaIndec[] = ["Precios", "Actividad", "Trabajo", "Población", "Comercio"];

export const INDEC_ALLOWED_FILTERS = new Set([
  "indicador", "descripcion", "serie", "tipo_de_indicador", "region",
  "division", "capitulo", "categoria", "sexo", "grupo_edad",
  "jurisdiccion", "provincia", "departamento", "pais", "rubro",
  "uso_economico", "cuadro_web", "codigo_CLaNAE_2004",
  "codigo_ClaNAE_2010", "codigo_CPC_2_1", "unidad_de_medida",
  "periodo", "anio", "mes",
]);
