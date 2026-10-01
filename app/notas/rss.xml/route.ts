import { listarNotas } from "@/lib/notas";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export function GET() {
  const items = listarNotas()
    .map((nota) => {
      const url = `${SITE_URL}/notas/${nota.slug}`;
      const fecha = new Date(`${nota.fecha}T12:00:00-03:00`).toUTCString();

      return [
        "<item>",
        `<title>${escapeXml(nota.titulo)}</title>`,
        `<link>${escapeXml(url)}</link>`,
        `<guid>${escapeXml(url)}</guid>`,
        `<pubDate>${fecha}</pubDate>`,
        `<category>${escapeXml(nota.categoria)}</category>`,
        `<description>${escapeXml(nota.bajada)}</description>`,
        "</item>",
      ].join("");
    })
    .join("");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    "<title>DL Notas</title>",
    `<link>${escapeXml(`${SITE_URL}/notas`)}</link>`,
    "<description>Coyuntura, mercados y economía explicada con datos.</description>",
    "<language>es-AR</language>",
    items,
    "</channel>",
    "</rss>",
  ].join("");

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
