import React, { useState, useMemo } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { CurrencyCode } from '../../types/trade';
import {
  CURRENCIES,
  PRIMARY_CURRENCY_CODES,
  ALL_CURRENCY_CODES,
  getCrossRate,
  convertBetweenCurrencies,
  formatCurrencyAmount,
} from '../../utils/currencies';
import { ArrowLeftRight, Check, ChevronDown } from 'lucide-react';

interface CurrencyExchangeConverterProps {
  className?: string;
  onCurrencySelect?: (code: CurrencyCode) => void;
}

export const CurrencyExchangeConverter: React.FC<CurrencyExchangeConverterProps> = ({
  className = '',
  onCurrencySelect,
}) => {
  const { rates, isLive, selectedCurrency, setSelectedCurrency } = useCurrency();

  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('USD');
  const [toCurrency, setToCurrency] = useState<CurrencyCode>(() => {
    return selectedCurrency && selectedCurrency !== 'USD' ? selectedCurrency : 'INR';
  });
  const [amountStr, setAmountStr] = useState<string>('1');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const parsedAmount = useMemo(() => {
    const num = parseFloat(amountStr);
    return isNaN(num) || num < 0 ? 0 : num;
  }, [amountStr]);

  // Calculate live conversion
  const conversionResult = useMemo(() => {
    return convertBetweenCurrencies(parsedAmount, fromCurrency, toCurrency, rates);
  }, [parsedAmount, fromCurrency, toCurrency, rates]);

  // Exact 1:X cross rates
  const crossRateForward = useMemo(() => {
    return getCrossRate(fromCurrency, toCurrency, rates);
  }, [fromCurrency, toCurrency, rates]);

  const crossRateReverse = useMemo(() => {
    return getCrossRate(toCurrency, fromCurrency, rates);
  }, [fromCurrency, toCurrency, rates]);

  // Swap currencies
  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const fromSymbol = CURRENCIES[fromCurrency]?.symbol || '$';
  const toSymbol = CURRENCIES[toCurrency]?.symbol || '$';

  // Quick preset amounts
  const presets = [1, 100, 1000, 10000];

  const handleCopyRate = () => {
    const text = `1 ${fromCurrency} = ${crossRateForward.toFixed(4)} ${toCurrency}`;
    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Quick trade peers for baseline comparison
  const quickPeers = useMemo(() => {
    return PRIMARY_CURRENCY_CODES.filter((c) => c !== fromCurrency);
  }, [fromCurrency]);

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              Trade Currency Exchange Converter
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Live interbank conversion rates for international trade logistics
            </p>
          </div>
        </div>

        {isLive && (
          <div className="flex items-center space-x-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">
              Live FX
            </span>
          </div>
        )}
      </div>

      {/* Input / Select Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Amount Input */}
        <div className="sm:col-span-4">
          <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
            Amount
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-mono font-medium text-slate-400 select-none">
              {fromSymbol}
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="1.00"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* From Currency */}
        <div className="sm:col-span-3">
          <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
            From
          </label>
          <div className="relative">
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value as CurrencyCode)}
              className="appearance-none w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white cursor-pointer transition-colors"
            >
              <optgroup label="Trade Currencies">
                {PRIMARY_CURRENCY_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code} ({CURRENCIES[code]?.symbol || code}) - {CURRENCIES[code]?.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other World Currencies">
                {ALL_CURRENCY_CODES.filter((c) => !PRIMARY_CURRENCY_CODES.includes(c)).map((code) => (
                  <option key={code} value={code}>
                    {code} ({CURRENCIES[code]?.symbol || code}) - {CURRENCIES[code]?.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Swap Button */}
        <div className="sm:col-span-2 flex sm:justify-center pt-2 sm:pt-4">
          <button
            type="button"
            onClick={handleSwap}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shadow-2xs"
            title="Swap From and To currencies"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* To Currency */}
        <div className="sm:col-span-3">
          <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
            To
          </label>
          <div className="relative">
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value as CurrencyCode)}
              className="appearance-none w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white cursor-pointer transition-colors"
            >
              <optgroup label="Trade Currencies">
                {PRIMARY_CURRENCY_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code} ({CURRENCIES[code]?.symbol || code}) - {CURRENCIES[code]?.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other World Currencies">
                {ALL_CURRENCY_CODES.filter((c) => !PRIMARY_CURRENCY_CODES.includes(c)).map((code) => (
                  <option key={code} value={code}>
                    {code} ({CURRENCIES[code]?.symbol || code}) - {CURRENCIES[code]?.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Quick Amount Chips */}
      <div className="flex items-center space-x-2">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Quick:
        </span>
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmountStr(preset.toString())}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              parsedAmount === preset
                ? 'bg-teal-700 text-white font-bold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium'
            }`}
          >
            {fromSymbol}{preset.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Result Card */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium text-slate-500">
            {parsedAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {fromCurrency} =
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 tracking-tight mt-0.5">
            {formatCurrencyAmount(conversionResult, toCurrency, true)}
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-600 mt-1">
            <span>
              1 {fromCurrency} = {crossRateForward < 0.01 ? crossRateForward.toFixed(6) : crossRateForward.toFixed(4)} {toCurrency}
            </span>
            <span className="text-slate-300">•</span>
            <span>
              1 {toCurrency} = {crossRateReverse < 0.01 ? crossRateReverse.toFixed(6) : crossRateReverse.toFixed(4)} {fromCurrency}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyRate}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs flex items-center space-x-1"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
            <span>{isCopied ? 'Copied' : 'Copy Rate'}</span>
          </button>

          {toCurrency !== selectedCurrency && (
            <button
              type="button"
              onClick={() => {
                setSelectedCurrency(toCurrency);
                if (onCurrencySelect) onCurrencySelect(toCurrency);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white border border-teal-800 transition-colors cursor-pointer shadow-2xs"
              title={`Switch global workspace currency to ${toCurrency}`}
            >
              Set Engine to {toCurrency}
            </button>
          )}
        </div>
      </div>

      {/* Quick Interbank Benchmarks for Primary Currencies */}
      <div className="pt-2 border-t border-slate-100">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Interbank Benchmark: 1 {fromCurrency} equals
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickPeers.map((peer) => {
            const peerRate = getCrossRate(fromCurrency, peer, rates);
            return (
              <button
                key={peer}
                type="button"
                onClick={() => setToCurrency(peer)}
                className="p-2 bg-white hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="text-[10px] font-mono text-slate-500 group-hover:text-teal-700">
                  {CURRENCIES[peer]?.name || peer} ({peer})
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 group-hover:text-teal-900 mt-0.5">
                  {formatCurrencyAmount(peerRate, peer, true)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
