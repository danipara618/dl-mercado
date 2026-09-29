// ============================================================
//  RIESGO PAÍS ARGENTINA — Google Apps Script
//  Archivo: Code.gs  (versión con actualización automática)
//
//  Cambios respecto de la versión anterior:
//   1. actualizarDesdeApi(): trae el último valor de argentinadatos.com (sin carga manual).
//   2. upsert por fecha: si el día ya existe, actualiza el valor (el dato intradiario cambia).
//      La deduplicación anterior comparaba strings contra celdas Date y nunca detectaba repetidos.
//   3. La hoja queda SIEMPRE en orden cronológico ascendente → en index.html
//      reemplazar `datosCompletos = invertirDatos(rawData);` por `datosCompletos = rawData;`
//   4. backfillHistorico(): recarga la serie completa en una sola escritura.
//   5. crearTrigger(): programa la actualización automática.
//   6. doGet(?format=json): expone la serie como JSON (opcional, para otras apps).
// ============================================================

// ---------- CONFIGURACIÓN ----------
var SHEET_NAME = "RiesgoPais";
var TZ = "America/Argentina/Buenos_Aires";
var API_BASE = "https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais";


// ---------- WEB APP ----------
function doGet(e) {
  if (e && e.parameter && e.parameter.format === "json") {
    var dias = Number(e.parameter.dias) || 365;
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, data: getDatos(dias) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService
    .createTemplateFromFile("index")
    .evaluate()
    .setTitle("Riesgo País Argentina")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


// ---------- ACTUALIZACIÓN AUTOMÁTICA ----------

/** Trae el último valor publicado y lo inserta/actualiza en la hoja. */
function actualizarDesdeApi() {
  var res = UrlFetchApp.fetch(API_BASE + "/ultimo", { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    throw new Error("argentinadatos respondió HTTP " + res.getResponseCode());
  }
  var json = JSON.parse(res.getContentText());          // { fecha: "2026-09-28", valor: 650 }
  var fecha = parseFecha(json.fecha);
  var puntos = Number(json.valor);
  if (!fecha || isNaN(puntos)) throw new Error("Respuesta inesperada: " + res.getContentText());

  var accion = upsertValor(fecha, puntos);
  Logger.log(accion + ": " + fechaKey(fecha) + " → " + puntos + " pb");
  return accion;
}

/** Compatibilidad con la función anterior (antes tenía el valor fijo 611). */
function actualizarConValorHoy() {
  return actualizarDesdeApi();
}

/** Reemplaza toda la hoja con la serie histórica completa (una sola escritura). */
function backfillHistorico() {
  var res = UrlFetchApp.fetch(API_BASE, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error("HTTP " + res.getResponseCode());
  var serie = JSON.parse(res.getContentText());

  var mapa = {};
  serie.forEach(function (p) {
    var f = parseFecha(p.fecha);
    var v = Number(p.valor);
    if (f && !isNaN(v)) mapa[fechaKey(f)] = [f, v];      // dedupe: el último gana
  });
  var filas = Object.keys(mapa).sort().map(function (k) { return mapa[k]; });

  var sheet = getSheet();
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).clearContent();
  if (filas.length) {
    sheet.getRange(2, 1, filas.length, 2).setValues(filas);
    sheet.getRange(2, 1, filas.length, 1).setNumberFormat("dd/MM/yyyy");
  }
  Logger.log("Backfill: " + filas.length + " registros");
}

/**
 * Programa la actualización automática cada 2 horas.
 * Ejecutar UNA vez a mano desde el editor (pide autorización para UrlFetchApp).
 * Con upsert, repetir en el día no duplica filas: solo refresca el valor.
 */
function crearTrigger() {
  eliminarTriggers();
  ScriptApp.newTrigger("actualizarDesdeApi").timeBased().everyHours(2).create();
  Logger.log("Trigger creado: actualizarDesdeApi cada 2 horas");
}

function eliminarTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "actualizarDesdeApi" || t.getHandlerFunction() === "actualizarConValorHoy") {
      ScriptApp.deleteTrigger(t);
    }
  });
}


// ---------- ESCRITURA ----------

/**
 * Inserta o actualiza el valor de una fecha y deja la hoja ordenada ascendente.
 * Acepta fecha como Date o string "dd/MM/yyyy" / "yyyy-MM-dd".
 */
function upsertValor(fecha, puntos) {
  var f = fecha instanceof Date ? fecha : parseFecha(fecha);
  var key = fechaKey(f);
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    var fechas = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = fechas.length - 1; i >= 0; i--) {         // de abajo hacia arriba: el dato reciente suele estar al final
      var existente = parseFecha(fechas[i][0]);
      if (existente && fechaKey(existente) === key) {
        sheet.getRange(i + 2, 2).setValue(puntos);
        return "Actualizado";
      }
    }
  }
  sheet.appendRow([f, puntos]);
  sheet.getRange(sheet.getLastRow(), 1).setNumberFormat("dd/MM/yyyy");
  if (sheet.getLastRow() > 2) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).sort({ column: 1, ascending: true });
  }
  return "Agregado";
}

/** Mantiene la firma anterior: agregarNuevoValor("dd/MM/yyyy", puntos). */
function agregarNuevoValor(fecha, puntos) {
  return upsertValor(fecha, puntos) === "Agregado";
}


// ---------- DIAGNÓSTICO ----------
function diagnosticarConexion() {
  try {
    var sheet = getSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return "ERROR|La hoja está vacía. Tiene " + lastRow + " fila(s).";

    var primera = sheet.getRange(2, 1, 1, 2).getValues()[0];
    var ultima = sheet.getRange(lastRow, 1, 1, 2).getValues()[0];
    return ["OK", sheet.getName(), lastRow - 1,
            fechaKey(parseFecha(primera[0])), primera[1],
            fechaKey(parseFecha(ultima[0])), ultima[1]].join("|");
  } catch (e) {
    return "ERROR|" + e.message;
  }
}


// ---------- DATOS PARA EL FRONT ----------
function getDatos(dias) {
  dias = dias || 365;
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var startRow = Math.max(2, lastRow - dias + 1);
  var data = sheet.getRange(startRow, 1, lastRow - startRow + 1, 2).getValues();

  var resultado = [];
  for (var i = 0; i < data.length; i++) {
    var fecha = parseFecha(data[i][0]);
    var puntos = Number(data[i][1]);
    if (!fecha || isNaN(puntos)) continue;
    resultado.push({ fecha: Utilities.formatDate(fecha, TZ, "dd/MM/yyyy"), puntos: puntos });
  }
  return resultado;
}

function getMetricas() {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return {};

  var allData = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  var ultimaFila = allData[allData.length - 1];
  var penultimaFila = allData.length > 1 ? allData[allData.length - 2] : ultimaFila;

  var hoy = Number(ultimaFila[1]);
  var ayer = Number(penultimaFila[1]);
  var variacion = hoy - ayer;
  var varPct = ayer !== 0 ? ((variacion / ayer) * 100).toFixed(2) : "0.00";

  // Máximo y mínimo del año en curso
  var anioActual = new Date().getFullYear();
  var puntosAnio = [];
  for (var i = 0; i < allData.length; i++) {
    var f = parseFecha(allData[i][0]);
    if (f && f.getFullYear() === anioActual) puntosAnio.push(Number(allData[i][1]));
  }

  return {
    ultimo: hoy,
    ayer: ayer,
    variacion: variacion,
    varPct: varPct,
    maxAnio: puntosAnio.length ? Math.max.apply(null, puntosAnio) : hoy,
    minAnio: puntosAnio.length ? Math.min.apply(null, puntosAnio) : hoy,
    fechaActu: Utilities.formatDate(parseFecha(ultimaFila[0]), TZ, "dd/MM/yyyy")
  };
}


// ---------- HELPERS ----------
function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, 2).setValues([["Fecha", "Puntos"]]);
    sheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#2C3A22").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Date | "dd/MM/yyyy" | "yyyy-MM-dd[THH:mm...]" → Date (medianoche local) o null. */
function parseFecha(v) {
  if (v instanceof Date && !isNaN(v)) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
  if (typeof v !== "string" || !v) return null;
  var p;
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    p = v.slice(0, 10).split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  p = v.split("/");
  if (p.length === 3) return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
  return null;
}

/** Clave canónica yyyy-MM-dd para comparar fechas sin importar el tipo de celda. */
function fechaKey(d) {
  return Utilities.formatDate(d, TZ, "yyyy-MM-dd");
}
