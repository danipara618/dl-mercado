// ============================================================
//  Universo de tickers globales (Yahoo Finance)
// ============================================================
export interface TickerDef {
  symbol: string;
  nombre: string;
  decimales?: number;
  sufijo?: string;
}

export const GRUPOS_GLOBALES: Record<string, TickerDef[]> = {
  "Índices de EE.UU.": [
    { symbol: "^GSPC", nombre: "S&P 500" },
    { symbol: "^IXIC", nombre: "Nasdaq Composite" },
    { symbol: "^DJI", nombre: "Dow Jones" },
    { symbol: "^RUT", nombre: "Russell 2000" },
    { symbol: "^VIX", nombre: "VIX (volatilidad)" },
  ],
  "Tasas del Tesoro y dólar global": [
    { symbol: "^IRX", nombre: "T-Bill 13 semanas", decimales: 3, sufijo: "%" },
    { symbol: "^FVX", nombre: "Treasury 5 años", decimales: 3, sufijo: "%" },
    { symbol: "^TNX", nombre: "Treasury 10 años", decimales: 3, sufijo: "%" },
    { symbol: "^TYX", nombre: "Treasury 30 años", decimales: 3, sufijo: "%" },
    { symbol: "DX-Y.NYB", nombre: "Índice dólar (DXY)" },
  ],
  "Mundo y región": [
    { symbol: "^MERV", nombre: "Merval (ARS)" },
    { symbol: "^BVSP", nombre: "Bovespa" },
    { symbol: "^STOXX50E", nombre: "Euro Stoxx 50" },
    { symbol: "^FTSE", nombre: "FTSE 100" },
    { symbol: "^N225", nombre: "Nikkei 225" },
    { symbol: "^HSI", nombre: "Hang Seng" },
    { symbol: "000001.SS", nombre: "Shanghai Composite" },
  ],
  Monedas: [
    { symbol: "EURUSD=X", nombre: "EUR/USD", decimales: 4 },
    { symbol: "BRL=X", nombre: "USD/BRL", decimales: 4 },
    { symbol: "CNY=X", nombre: "USD/CNY", decimales: 4 },
    { symbol: "JPY=X", nombre: "USD/JPY" },
    { symbol: "CLP=X", nombre: "USD/CLP" },
  ],
  Commodities: [
    { symbol: "GC=F", nombre: "Oro (USD/oz)" },
    { symbol: "SI=F", nombre: "Plata (USD/oz)" },
    { symbol: "HG=F", nombre: "Cobre (USD/lb)", decimales: 3 },
    { symbol: "CL=F", nombre: "Petróleo WTI" },
    { symbol: "BZ=F", nombre: "Petróleo Brent" },
    { symbol: "NG=F", nombre: "Gas natural", decimales: 3 },
    { symbol: "ZS=F", nombre: "Soja (¢/bu)" },
    { symbol: "ZC=F", nombre: "Maíz (¢/bu)" },
    { symbol: "ZW=F", nombre: "Trigo (¢/bu)" },
  ],
  Cripto: [
    { symbol: "BTC-USD", nombre: "Bitcoin" },
    { symbol: "ETH-USD", nombre: "Ethereum" },
    { symbol: "SOL-USD", nombre: "Solana" },
  ],
  "Argentina en Wall Street": [
    { symbol: "ARGT", nombre: "ETF Argentina (ARGT)" },
    { symbol: "YPF", nombre: "YPF" },
    { symbol: "GGAL", nombre: "Grupo Galicia" },
    { symbol: "BMA", nombre: "Banco Macro" },
    { symbol: "BBAR", nombre: "BBVA Argentina" },
    { symbol: "SUPV", nombre: "Supervielle" },
    { symbol: "PAM", nombre: "Pampa Energía" },
    { symbol: "TGS", nombre: "TGS" },
    { symbol: "VIST", nombre: "Vista Energy" },
    { symbol: "CEPU", nombre: "Central Puerto" },
    { symbol: "LOMA", nombre: "Loma Negra" },
    { symbol: "TEO", nombre: "Telecom" },
    { symbol: "CRESY", nombre: "Cresud" },
    { symbol: "IRS", nombre: "IRSA" },
    { symbol: "EDN", nombre: "Edenor" },
    { symbol: "MELI", nombre: "MercadoLibre" },
    { symbol: "GLOB", nombre: "Globant" },
  ],
};
