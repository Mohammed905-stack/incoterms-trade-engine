import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CurrencyCode, ShipmentCostInputs } from '../types/trade';
import {
  fetchLiveExchangeRates,
  FALLBACK_RATES,
  ExchangeRateData,
} from '../services/exchangeRateService';
import {
  CURRENCIES,
  updateLiveRates,
  convertBetweenCurrencies,
  convertCurrency,
  convertToUSD,
  formatCurrency,
  getCrossRate,
} from '../utils/currencies';
import { useAuth } from './AuthContext';

interface CurrencyContextType {
  rates: Record<CurrencyCode, number>;
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (currency: CurrencyCode) => void;
  autoConvertOnSwitch: boolean;
  setAutoConvertOnSwitch: (autoConvert: boolean) => void;
  isLoading: boolean;
  isLive: boolean;
  lastUpdated: string;
  provider: string;
  error: string | null;
  refreshRates: () => Promise<void>;
  convert: (
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    bankSpreadPercent?: number
  ) => number;
  getRate: (fromCurrency: CurrencyCode, toCurrency: CurrencyCode) => number;
  convertInputs: (
    inputs: ShipmentCostInputs,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ) => ShipmentCostInputs;
  format: (amountInUSD: number, targetCurrency?: CurrencyCode, includeDecimals?: boolean) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const SELECTED_CURRENCY_STORAGE_KEY = 'incoterms_selected_currency_preference_v2';
const AUTO_CONVERT_STORAGE_KEY = 'incoterms_auto_convert_preference_v1';

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setPreferredCurrency } = useAuth();

  const [rates, setRates] = useState<Record<CurrencyCode, number>>(FALLBACK_RATES);
  const [selectedCurrency, setSelectedCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const stored = localStorage.getItem(SELECTED_CURRENCY_STORAGE_KEY) as CurrencyCode;
      if (
        stored &&
        ['USD', 'EUR', 'INR', 'AED', 'GBP', 'CNY', 'JPY', 'CAD', 'AUD', 'SGD', 'CHF', 'HKD'].includes(
          stored
        )
      ) {
        return stored;
      }
    } catch {}
    return user?.preferredCurrency || 'USD';
  });

  const [autoConvertOnSwitch, setAutoConvertOnSwitchState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(AUTO_CONVERT_STORAGE_KEY);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const setAutoConvertOnSwitch = (value: boolean) => {
    setAutoConvertOnSwitchState(value);
    try {
      localStorage.setItem(AUTO_CONVERT_STORAGE_KEY, String(value));
    } catch {}
  };

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Initializing live market data...');
  const [provider, setProvider] = useState<string>('Open Exchange Rates (ER-API Live Interbank)');
  const [error, setError] = useState<string | null>(null);

  // Sync with user's preferred currency if it changes from profile
  useEffect(() => {
    if (user?.preferredCurrency && user.preferredCurrency !== selectedCurrency) {
      setSelectedCurrencyState(user.preferredCurrency);
      try {
        localStorage.setItem(SELECTED_CURRENCY_STORAGE_KEY, user.preferredCurrency);
      } catch {}
    }
  }, [user?.preferredCurrency]);

  const setSelectedCurrency = (currency: CurrencyCode) => {
    setSelectedCurrencyState(currency);
    try {
      localStorage.setItem(SELECTED_CURRENCY_STORAGE_KEY, currency);
    } catch {}
    setPreferredCurrency(currency);
  };

  const loadRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: ExchangeRateData = await fetchLiveExchangeRates();
      setRates(data.rates);
      setIsLive(data.isLive);
      setLastUpdated(data.lastUpdated);
      setProvider(data.provider);

      // Also synchronize global module state for any direct utility calls
      updateLiveRates(data.rates);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch live exchange rates');
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    loadRates();

    // Auto-refresh rates every 15 minutes
    const interval = setInterval(() => {
      loadRates();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadRates]);

  const convert = useCallback(
    (
      amount: number,
      fromCurrency: CurrencyCode,
      toCurrency: CurrencyCode,
      bankSpreadPercent: number = 0
    ): number => {
      return convertBetweenCurrencies(amount, fromCurrency, toCurrency, rates, bankSpreadPercent);
    },
    [rates]
  );

  const getRate = useCallback(
    (fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number => {
      return getCrossRate(fromCurrency, toCurrency, rates);
    },
    [rates]
  );

  /**
   * Automatically converts all financial cost line items of a shipment
   * from one currency to another using the exact live conversion ratio.
   */
  const convertInputs = useCallback(
    (
      inputs: ShipmentCostInputs,
      fromCurrency: CurrencyCode,
      toCurrency: CurrencyCode
    ): ShipmentCostInputs => {
      if (fromCurrency === toCurrency) {
        return { ...inputs, currency: toCurrency };
      }

      const fromRate = rates[fromCurrency] || 1;
      const toRate = rates[toCurrency] || 1;
      const multiplier = toRate / fromRate;

      const roundVal = (val: number): number => {
        if (!val || isNaN(val)) return 0;
        const converted = val * multiplier;
        // Clean rounding to 2 decimals
        return Math.round(converted * 100) / 100;
      };

      return {
        ...inputs,
        currency: toCurrency,
        cargoValue: roundVal(inputs.cargoValue),
        packagingCost: roundVal(inputs.packagingCost),
        preCarriageCost: roundVal(inputs.preCarriageCost),
        exportClearanceCost: roundVal(inputs.exportClearanceCost),
        originThcCost: roundVal(inputs.originThcCost),
        mainCarriageFreight: roundVal(inputs.mainCarriageFreight),
        destinationThcCost: roundVal(inputs.destinationThcCost),
        importClearanceCost: roundVal(inputs.importClearanceCost || 0),
        insuranceMinimum: roundVal(inputs.insuranceMinimum),
        onCarriageCost: roundVal(inputs.onCarriageCost),
        unloadingCost: roundVal(inputs.unloadingCost),
        // percentages remain unchanged
        insuranceRatePercent: inputs.insuranceRatePercent,
        importDutyTariffPercent: inputs.importDutyTariffPercent,
        importVatPercent: inputs.importVatPercent,
      };
    },
    [rates]
  );

  const format = useCallback(
    (
      amountInUSD: number,
      targetCurrency: CurrencyCode = selectedCurrency,
      includeDecimals: boolean = true
    ): string => {
      return formatCurrency(amountInUSD, targetCurrency, includeDecimals, rates);
    },
    [selectedCurrency, rates]
  );

  return (
    <CurrencyContext.Provider
      value={{
        rates,
        selectedCurrency,
        setSelectedCurrency,
        autoConvertOnSwitch,
        setAutoConvertOnSwitch,
        isLoading,
        isLive,
        lastUpdated,
        provider,
        error,
        refreshRates: loadRates,
        convert,
        getRate,
        convertInputs,
        format,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
