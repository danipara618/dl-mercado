import type { Punto } from "@/lib/types";

export interface InflationResult {
  montoInicial: number;
  montoEquivalente: number;
  inflacionAcumulada: number;
  poderCompraRestante: number;
  perdidaPoderCompra: number;
}

export function calcularInflacion(
  monto: number,
  desde: string,
  hasta: string,
  serie: Punto[],
): InflationResult | null {
  if (!Number.isFinite(monto) || monto <= 0 || !desde || !hasta || desde > hasta) return null;

  const periodo = serie
    .filter((p) => p.fecha.slice(0, 7) > desde && p.fecha.slice(0, 7) <= hasta)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  if (desde !== hasta && periodo.length === 0) return null;

  const factor = periodo.reduce((acc, p) => acc * (1 + p.valor / 100), 1);
  const montoEquivalente = monto * factor;
  const poderCompraRestante = factor > 0 ? (1 / factor) * 100 : 0;

  return {
    montoInicial: monto,
    montoEquivalente,
    inflacionAcumulada: (factor - 1) * 100,
    poderCompraRestante,
    perdidaPoderCompra: 100 - poderCompraRestante,
  };
}

export function mesesDisponibles(serie: Punto[]) {
  return [...new Set(serie.map((p) => p.fecha.slice(0, 7)))].sort();
}

export function evolucionEquivalente(monto: number, desde: string, hasta: string, serie: Punto[]) {
  let valor = monto;
  const puntos = [{ mes: desde, valor }];

  serie
    .filter((p) => p.fecha.slice(0, 7) > desde && p.fecha.slice(0, 7) <= hasta)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .forEach((p) => {
      valor *= 1 + p.valor / 100;
      puntos.push({ mes: p.fecha.slice(0, 7), valor });
    });

  return puntos;
}
