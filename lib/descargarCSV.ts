// Descarga simple y accesible: datos originales, sin redondear valores numéricos.
type CsvDato = string | number | boolean | null | undefined;
function celda(valor: CsvDato): string {
  if (valor === null || valor === undefined) return "";
  let s = String(valor);
  // Neutralizar fórmulas inyectadas desde campos de texto en hojas de cálculo.
  if (typeof valor === "string" && /^[\s]*[=+@\-\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
export function descargarCSV(nombre: string, cabeceras: string[], filas: CsvDato[][]) {
  if (typeof document === "undefined") return;
  const contenido = "\uFEFF" + [cabeceras, ...filas].map(f=>f.map(celda).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([contenido],{type:"text/csv;charset=utf-8"}));
  const enlace = document.createElement("a");
  enlace.href=url;
  enlace.download=(nombre.replace(/[^a-z0-9_-]/gi,"-")||"dl-mercado")+".csv";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
