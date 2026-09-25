import { CurrencyCode, CurrencyConfig } from '../types/trade';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    rateToUSD: 1.0,
    locale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    rateToUSD: 0.8732,
    locale: 'en-IE',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    rateToUSD: 0.7485,
    locale: 'en-GB',
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    flag: '🇨🇳',
    rateToUSD: 7.1240,
    locale: 'zh-CN',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    flag: '🇮🇳',
    rateToUSD: 95.65,
    locale: 'en-IN',
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    flag: '🇦🇪',
    rateToUSD: 3.6725,
    locale: 'en-AE',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    flag: '🇯🇵',
    rateToUSD: 152.40,
    locale: 'ja-JP',
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    flag: '🇨🇦',
    rateToUSD: 1.3850,
    locale: 'en-CA',
  },
  AUD: {
    code: 'AUD',
    symbol: 'AU$',
    name: 'Australian Dollar',
    flag: '🇦🇺',
    rateToUSD: 1.5420,
    locale: 'en-AU',
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    flag: '🇸🇬',
    rateToUSD: 1.3410,
    locale: 'en-SG',
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    flag: '🇨🇭',
    rateToUSD: 0.8650,
    locale: 'de-CH',
  },
  HKD: {
    code: 'HKD',
    symbol: 'HK$',
    name: 'Hong Kong Dollar',
    flag: '🇭🇰',
    rateToUSD: 7.8250,
    locale: 'zh-HK',
  },
};

export const ALL_CURRENCY_CODES: CurrencyCode[] = [
  'USD',
  'EUR',
  'GBP',
  'CNY',
  'INR',
  'AED',
  'JPY',
  'CAD',
  'AUD',
  'SGD',
  'CHF',
  'HKD',
];

// Primary 5 currencies for navigation and quick switchers
export const PRIMARY_CURRENCY_CODES: CurrencyCode[] = ['USD', 'EUR', 'INR', 'AED', 'GBP'];

// Internal registry of the most recent exchange rates
const currentLiveRates: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.8732,
  GBP: 0.7485,
  CNY: 7.1240,
  INR: 95.65,
  AED: 3.6725,
  JPY: 152.40,
  CAD: 1.3850,
  AUD: 1.5420,
  SGD: 1.3410,
  CHF: 0.8650,
  HKD: 7.8250,
};

/**
 * Updates the in-memory rates for all currencies
 */
export const updateLiveRates = (newRates: Partial<Record<CurrencyCode, number>>) => {
  for (const [code, rate] of Object.entries(newRates)) {
    const currKey = code as CurrencyCode;
    if (typeof rate === 'number' && rate > 0) {
      currentLiveRates[currKey] = rate;
      if (CURRENCIES[currKey]) {
        CURRENCIES[currKey].rateToUSD = rate;
      }
    }
  }
};

/**
 * Retrieves the effective exchange rate against USD
 */
export const getEffectiveRate = (
  currency: CurrencyCode,
  customRates?: Record<CurrencyCode, number>
): number => {
  return customRates?.[currency] ?? currentLiveRates[currency] ?? CURRENCIES[currency]?.rateToUSD ?? 1.0;
};

/**
 * Converts an amount from USD to a target currency
 */
export const convertCurrency = (
  amountInUSD: number,
  targetCurrency: CurrencyCode,
  customRates?: Record<CurrencyCode, number>
): number => {
  const rate = getEffectiveRate(targetCurrency, customRates);
  return amountInUSD * rate;
};

/**
 * Converts an amount from a source currency into USD
 */
export const convertToUSD = (
  amountInCurrency: number,
  sourceCurrency: CurrencyCode,
  customRates?: Record<CurrencyCode, number>
): number => {
  const rate = getEffectiveRate(sourceCurrency, customRates);
  if (rate <= 0) return amountInCurrency;
  return amountInCurrency / rate;
};

/**
 * Directly converts between any two supported currencies
 * with optional commercial bank spread/fee percentage
 */
export const convertBetweenCurrencies = (
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  customRates?: Record<CurrencyCode, number>,
  bankSpreadPercent: number = 0
): number => {
  if (isNaN(amount) || amount === 0) return 0;
  if (fromCurrency === toCurrency) {
    if (bankSpreadPercent !== 0) {
      return amount * (1 - bankSpreadPercent / 100);
    }
    return amount;
  }
  const inUSD = convertToUSD(amount, fromCurrency, customRates);
  const targetAmount = convertCurrency(inUSD, toCurrency, customRates);
  if (bankSpreadPercent > 0) {
    // Bank spread deducted or adjusted
    return targetAmount * (1 - bankSpreadPercent / 100);
  }
  return targetAmount;
};

/**
 * Calculates the exact cross rate between two currencies: 1 fromCurrency = X toCurrency
 */
export const getCrossRate = (
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  customRates?: Record<CurrencyCode, number>
): number => {
  if (fromCurrency === toCurrency) return 1.0;
  const rateFrom = getEffectiveRate(fromCurrency, customRates);
  const rateTo = getEffectiveRate(toCurrency, customRates);
  if (rateFrom <= 0) return 1.0;
  return rateTo / rateFrom;
};

/**
 * Sanitizes currency string output to prevent duplicate symbols or repeated currency codes (e.g. 'AED AED')
 */
export const cleanCurrencyString = (str: string, code: CurrencyCode): string => {
  if (!str) return '';
  let cleaned = str;
  // Collapse duplicate identical code tokens like "AED AED" or "USD USD"
  cleaned = cleaned.replace(new RegExp(`\\b${code}\\s+${code}\\b`, 'g'), code);
  cleaned = cleaned.replace(/\bAED\s+AED\b/g, 'AED');
  cleaned = cleaned.replace(/د\.إ\s+د\.إ/g, 'د.إ');
  cleaned = cleaned.replace(/\bAED\s+د\.إ\b/g, 'د.إ');
  cleaned = cleaned.replace(/د\.إ\s+AED\b/g, 'د.إ');
  // Collapse duplicate symbol characters like "$ $" or "$$"
  cleaned = cleaned
    .replace(/\$\s*\$/g, '$')
    .replace(/€\s*€/g, '€')
    .replace(/£\s*£/g, '£')
    .replace(/¥\s*¥/g, '¥')
    .replace(/₹\s*₹/g, '₹');
  return cleaned.trim();
};

/**
 * Formats a USD base amount in the designated target currency with clean symbol placement
 * (e.g., "$50,000" or "€45,000" with absolute zero duplicate text like "AED AED")
 */
export const formatCurrency = (
  amountInUSD: number,
  targetCurrency: CurrencyCode = 'USD',
  includeDecimals: boolean = true,
  customRates?: Record<CurrencyCode, number>
): string => {
  const cfg = CURRENCIES[targetCurrency] || CURRENCIES.USD;
  const converted = convertCurrency(amountInUSD, targetCurrency, customRates);
  const num = isNaN(converted) ? 0 : converted;

  const formattedNum = num.toLocaleString('en-US', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });

  const symbol = cfg.symbol;
  const raw = symbol === 'د.إ' ? `${symbol} ${formattedNum}` : `${symbol}${formattedNum}`;
  return cleanCurrencyString(raw, cfg.code);
};

/**
 * Formats an amount that is ALREADY in the target currency (without converting from USD)
 */
export const formatCurrencyAmount = (
  amountInCurrency: number,
  currency: CurrencyCode = 'USD',
  includeDecimals: boolean = true
): string => {
  const cfg = CURRENCIES[currency] || CURRENCIES.USD;
  const num = isNaN(amountInCurrency) ? 0 : amountInCurrency;

  const formattedNum = num.toLocaleString('en-US', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });

  const symbol = cfg.symbol;
  const raw = symbol === 'د.إ' ? `${symbol} ${formattedNum}` : `${symbol}${formattedNum}`;
  return cleanCurrencyString(raw, cfg.code);
};
