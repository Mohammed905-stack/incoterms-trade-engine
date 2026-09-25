import { CurrencyCode } from '../types/trade';

export interface ExchangeRateData {
  rates: Record<CurrencyCode, number>;
  baseCurrency: CurrencyCode;
  provider: string;
  lastUpdated: string;
  nextUpdate?: string;
  isLive: boolean;
  fromCache?: boolean;
}

// Fallback baseline rates if offline or API unavailable
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.8732,
  GBP: 0.7485,
  CNY: 7.1240,
  INR: 95.65,
  AED: 3.6725, // UAE Dirham is pegged to USD at 3.6725
  JPY: 152.40,
  CAD: 1.3850,
  AUD: 1.5420,
  SGD: 1.3410,
  CHF: 0.8650,
  HKD: 7.8250,
};

const STORAGE_KEY = 'incoterms_live_exchange_rates_v2';
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes cache

/**
 * Fetches real-time exchange rates with USD as the base currency.
 * Primary source: https://open.er-api.com/v6/latest/USD (free, reliable, CORS enabled)
 * Backup source: https://api.frankfurter.dev/v1/latest?base=USD
 */
export async function fetchLiveExchangeRates(): Promise<ExchangeRateData> {
  // Check cached data first to prevent rate-limiting and enable instant offline startup
  let cachedData: ExchangeRateData | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ExchangeRateData & { timestamp?: number };
      if (parsed && parsed.rates && parsed.rates.USD) {
        cachedData = parsed;
        const age = Date.now() - (parsed.timestamp || 0);
        if (age < CACHE_TTL_MS) {
          return {
            ...parsed,
            fromCache: true,
          };
        }
      }
    }
  } catch (e) {
    console.warn('Could not read cached exchange rates', e);
  }

  // Primary API: open.er-api.com
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      if (json && json.rates && typeof json.rates === 'object') {
        const liveRates: Record<CurrencyCode, number> = {
          USD: 1.0,
          EUR: Number(json.rates.EUR) || FALLBACK_RATES.EUR,
          GBP: Number(json.rates.GBP) || FALLBACK_RATES.GBP,
          CNY: Number(json.rates.CNY) || FALLBACK_RATES.CNY,
          INR: Number(json.rates.INR) || FALLBACK_RATES.INR,
          AED: Number(json.rates.AED) || FALLBACK_RATES.AED,
          JPY: Number(json.rates.JPY) || FALLBACK_RATES.JPY,
          CAD: Number(json.rates.CAD) || FALLBACK_RATES.CAD,
          AUD: Number(json.rates.AUD) || FALLBACK_RATES.AUD,
          SGD: Number(json.rates.SGD) || FALLBACK_RATES.SGD,
          CHF: Number(json.rates.CHF) || FALLBACK_RATES.CHF,
          HKD: Number(json.rates.HKD) || FALLBACK_RATES.HKD,
        };

        const result: ExchangeRateData = {
          rates: liveRates,
          baseCurrency: 'USD',
          provider: 'Open Exchange Rates (ER-API Live Interbank)',
          lastUpdated: json.time_last_update_utc || new Date().toUTCString(),
          nextUpdate: json.time_next_update_utc,
          isLive: true,
          fromCache: false,
        };

        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...result, timestamp: Date.now() })
          );
        } catch {
          // ignore storage quota issues
        }

        return result;
      }
    }
  } catch (err) {
    console.warn('Primary exchange rate provider failed, trying backup API...', err);
  }

  // Backup API: Frankfurter
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      'https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,GBP,INR,JPY,CAD,AUD,SGD,CHF',
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      if (json && json.rates) {
        const liveRates: Record<CurrencyCode, number> = {
          USD: 1.0,
          EUR: Number(json.rates.EUR) || FALLBACK_RATES.EUR,
          GBP: Number(json.rates.GBP) || FALLBACK_RATES.GBP,
          CNY: FALLBACK_RATES.CNY,
          INR: Number(json.rates.INR) || FALLBACK_RATES.INR,
          AED: FALLBACK_RATES.AED, // Pegged to USD
          JPY: Number(json.rates.JPY) || FALLBACK_RATES.JPY,
          CAD: Number(json.rates.CAD) || FALLBACK_RATES.CAD,
          AUD: Number(json.rates.AUD) || FALLBACK_RATES.AUD,
          SGD: Number(json.rates.SGD) || FALLBACK_RATES.SGD,
          CHF: Number(json.rates.CHF) || FALLBACK_RATES.CHF,
          HKD: FALLBACK_RATES.HKD,
        };

        const result: ExchangeRateData = {
          rates: liveRates,
          baseCurrency: 'USD',
          provider: 'European Central Bank (Frankfurter Feed)',
          lastUpdated: json.date || new Date().toISOString(),
          isLive: true,
          fromCache: false,
        };

        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...result, timestamp: Date.now() })
          );
        } catch {}

        return result;
      }
    }
  } catch (backupErr) {
    console.warn('Backup exchange rate provider failed', backupErr);
  }

  // Return cached data if available, otherwise fallback
  if (cachedData) {
    return {
      ...cachedData,
      fromCache: true,
      isLive: false,
    };
  }

  return {
    rates: FALLBACK_RATES,
    baseCurrency: 'USD',
    provider: 'ICC Statutory Baseline (Offline)',
    lastUpdated: new Date().toUTCString(),
    isLive: false,
    fromCache: false,
  };
}
