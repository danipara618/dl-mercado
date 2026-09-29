"use client";
// ============================================================
//  Hook de datos del cliente contra las rutas internas /api/*
// ============================================================
import { useEffect, useState } from "react";
import type { ApiResponse } from "./types";

export interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  updatedAt: string | null;
}

/**
 * @param url       ruta interna, p. ej. "/api/dolares"
 * @param refreshMs intervalo de refresco (0 = sin refresco)
 */
export function useApi<T>(url: string, refreshMs = 0): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ data: null, error: null, loading: true, updatedAt: null });

  useEffect(() => {
    let vivo = true;
    const cargar = async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const json = (await res.json()) as ApiResponse<T>;
        if (!json.ok) throw new Error(json.error);
        if (vivo) setState({ data: json.data, error: null, loading: false, updatedAt: json.updatedAt });
      } catch (e) {
        // Si ya había datos, se conservan: un refresco fallido no vacía la pantalla.
        if (vivo) setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e), loading: false }));
      }
    };
    cargar();
    const id = refreshMs > 0 ? setInterval(cargar, refreshMs) : null;
    return () => {
      vivo = false;
      if (id) clearInterval(id);
    };
  }, [url, refreshMs]);

  return state;
}
