# DL Mercado

Tablero financiero argentino con la identidad visual de **DL · Economía y Finanzas**: dólar, riesgo país, soberanos en dólares y en pesos (TIR por Newton-Raphson), LECAP/BONCAP/CER, acciones, CEDEARs, ONs y mercados globales.

Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Recharts · Lucide.

## Estructura

```
app/
  layout.tsx            fuentes DM Serif Display / DM Sans / DM Mono
  page.tsx              composición del tablero
  globals.css           tokens de marca + textura de papel
  api/
    dolares/                    dolarapi.com
    riesgo-pais/                último + anterior (argentinadatos)
    riesgo-pais/historico/      serie completa
    bcra/[id]/                  BCRA v4.0 (1, 4, 5, 7, 27–32)
    data912/[panel]/            arg_bonds, arg_notes, arg_corp, arg_stocks, arg_cedears, usa_adrs, usa_stocks
    global/                     Yahoo Finance
    indicadores/                inflación y plazo fijo
components/
  Header, Footer, Logo, SectionTitle, KPICard, KPIGrid, RiskChart,
  DataTable, BondsSection, PesosSection, EquitySection, GlobalMarkets, TirPill, Change, States
lib/
  bonds.ts      cronogramas del canje 2020, flujos, TIR, duration, paridad
  letras.ts     clasificación y vencimiento de LECAP/BONCAP
  tickers.ts    universo global
  server.ts     fetch con caché, timeout y respuesta estándar
  useApi.ts     hook cliente con refresco
apps-script/
  Code.gs       versión automatizada de la web en Apps Script
```

## Correr localmente

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
```

## Publicar (GitHub → Vercel)

```bash
git init
git add .
git commit -m "DL Mercado v1"
git branch -M main
git remote add origin https://github.com/<usuario>/dl-mercado.git
git push -u origin main
```

En vercel.com: **Add New → Project → Import** el repo. Framework: Next.js (autodetectado).
En **Settings → Environment Variables** cargar las de `.env.example`, y luego **Redeploy**.

## Variables de entorno

| Variable | Default | Uso |
|---|---|---|
| `NEXT_PUBLIC_UMBRAL_RIESGO` | 500 | Línea punteada del gráfico de riesgo país |
| `BCRA_INSECURE_TLS` | — | `1` reintenta contra api.bcra.gob.ar sin validar su cadena TLS incompleta |
