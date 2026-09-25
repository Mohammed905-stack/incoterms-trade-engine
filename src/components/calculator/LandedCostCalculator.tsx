import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSavedCalculations } from '../../context/SavedCalculationsContext';
import { useCurrency } from '../../context/CurrencyContext';
import {
  CalculationResult,
  CurrencyCode,
  ShipmentCostInputs,
  ShipmentMetadata,
} from '../../types/trade';
import { INCOTERMS_LIST, getIncotermByCode } from '../../data/incotermsData';
import { calculateLandedCost } from '../../utils/calculator';
import {
  CURRENCIES,
  formatCurrency,
  formatCurrencyAmount,
  convertCurrency,
  convertToUSD,
} from '../../utils/currencies';
import { CurrencyExchangeConverter } from './CurrencyExchangeConverter';
import {
  Calculator,
  Save,
  Printer,
  Sparkles,
  GitCompare,
  DollarSign,
  Package,
  Truck,
  Ship,
  ShieldCheck,
  Building,
  Landmark,
  ArrowRight,
  ArrowLeftRight,
  Check,
  CheckCircle2,
  RefreshCcw,
  Sliders,
  PieChart,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';

interface LandedCostCalculatorProps {
  initialIncoterm?: string;
  loadedCalculation?: CalculationResult | null;
  onOpenReportModal: (calc: CalculationResult) => void;
  onOpenComparator: (codeA: string, codeB?: string) => void;
}

const DEFAULT_EMPTY_INPUTS: ShipmentCostInputs = {
  cargoValue: 0,
  currency: 'USD',
  packagingCost: 0,
  preCarriageCost: 0,
  exportClearanceCost: 0,
  originThcCost: 0,
  mainCarriageFreight: 0,
  insuranceRatePercent: 0,
  insuranceMinimum: 0,
  destinationThcCost: 0,
  importClearanceCost: 0,
  importDutyTariffPercent: 0,
  importVatPercent: 0,
  onCarriageCost: 0,
  unloadingCost: 0,
};

const createEmptyMetadata = (incotermCode: string): ShipmentMetadata => ({
  id: `shipment_${Date.now()}`,
  referenceNo: '',
  title: '',
  originCountry: '',
  originPort: '',
  destinationCountry: '',
  destinationPort: '',
  freightMode: 'OCEAN_FCL',
  commodity: '',
  hsCode: '',
  incotermCode,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const LandedCostCalculator: React.FC<LandedCostCalculatorProps> = ({
  initialIncoterm = 'FCA',
  loadedCalculation = null,
  onOpenReportModal,
  onOpenComparator,
}) => {
  const { user, openAuthModal } = useAuth();
  const { saveCalculation } = useSavedCalculations();
  const { rates, selectedCurrency, convertInputs, autoConvertOnSwitch } = useCurrency();
  const [autoSavedNotice, setAutoSavedNotice] = useState<string | null>(null);

  // Shipment cost inputs - default to zero with active currency
  const [inputs, setInputs] = useState<ShipmentCostInputs>(() => {
    if (loadedCalculation) {
      return loadedCalculation.inputs;
    }
    return {
      ...DEFAULT_EMPTY_INPUTS,
      currency: selectedCurrency || 'USD',
    };
  });

  // Track raw text strings while typing to avoid leading zero or decimal truncation issues
  const [rawInputs, setRawInputs] = useState<Partial<Record<keyof ShipmentCostInputs, string>>>({});

  const currentCurrency = inputs.currency || selectedCurrency || 'USD';
  const currencySymbol = CURRENCIES[currentCurrency]?.symbol || '$';

  // Shipment metadata - default to empty prompt-ready state
  const [metadata, setMetadata] = useState<ShipmentMetadata>(() => {
    if (loadedCalculation) {
      return loadedCalculation.metadata;
    }
    return createEmptyMetadata(initialIncoterm || 'FCA');
  });

  // Calculation execution and interaction states
  const [hasCalculated, setHasCalculated] = useState<boolean>(() => !!loadedCalculation);
  const [justCalculated, setJustCalculated] = useState<boolean>(false);
  const [showFxConverter, setShowFxConverter] = useState<boolean>(true);
  const breakdownRef = React.useRef<HTMLDivElement>(null);

  // Synchronize when loadedCalculation prop changes (e.g. user loaded an audit record)
  React.useEffect(() => {
    if (loadedCalculation) {
      setInputs(loadedCalculation.inputs);
      setMetadata(loadedCalculation.metadata);
      setRawInputs({});
      setHasCalculated(true);
    }
  }, [loadedCalculation]);

  // Synchronize when initialIncoterm prop changes
  React.useEffect(() => {
    if (initialIncoterm && initialIncoterm !== metadata.incotermCode) {
      setMetadata((prev) => ({ ...prev, incotermCode: initialIncoterm }));
    }
  }, [initialIncoterm]);

  // Reactive Currency Conversion: Automatically convert all inputs when global currency changes
  const prevSelectedCurrencyRef = React.useRef<CurrencyCode>(selectedCurrency);
  React.useEffect(() => {
    if (prevSelectedCurrencyRef.current !== selectedCurrency) {
      const prevCurrency = prevSelectedCurrencyRef.current || 'USD';
      prevSelectedCurrencyRef.current = selectedCurrency;
      if (prevCurrency !== selectedCurrency) {
        setInputs((currentInputs) => {
          const fromCurr = currentInputs.currency || prevCurrency;
          if (fromCurr === selectedCurrency) return currentInputs;
          if (autoConvertOnSwitch) {
            return convertInputs(currentInputs, fromCurr, selectedCurrency);
          } else {
            return { ...currentInputs, currency: selectedCurrency };
          }
        });
        setRawInputs({});
      }
    }
  }, [selectedCurrency, convertInputs, autoConvertOnSwitch]);

  // UI tabs inside calculator: 'inputs' or 'breakdown'
  const [activeTab, setActiveTab] = useState<'inputs' | 'breakdown'>('breakdown');
  const [saveBanner, setSaveBanner] = useState(false);

  // Run calculation dynamically with live market exchange rates
  const result: CalculationResult = calculateLandedCost(inputs, metadata, undefined, rates);
  const incotermDef = getIncotermByCode(metadata.incotermCode);

  // Reset inputs and metadata back to clean zero state
  const handleResetToZero = () => {
    setInputs({
      ...DEFAULT_EMPTY_INPUTS,
      currency: currentCurrency,
    });
    setRawInputs({});
    setMetadata(createEmptyMetadata(metadata.incotermCode));
    setHasCalculated(false);
  };

  // Dedicated action to trigger / confirm Landed Cost analysis
  const handleRunCostAnalysis = () => {
    setHasCalculated(true);
    setJustCalculated(true);
    setTimeout(() => setJustCalculated(false), 2400);

    // Auto-save calculation to persistent database if user is logged in
    if (user && (inputs.cargoValue > 0 || result.totalLandedCost > 0)) {
      const enrichedResult: CalculationResult = {
        ...result,
        metadata: {
          ...result.metadata,
          title: result.metadata.title.trim() || `${metadata.incotermCode} Cargo Simulation (${currentCurrency})`,
          referenceNo: result.metadata.referenceNo.trim() || `SIM-${Date.now().toString().slice(-6)}`,
          userId: user.id,
          userEmail: user.email || user.phoneNumber,
          userName: user.fullName,
        },
      };
      saveCalculation(enrichedResult);
      setAutoSavedNotice(`Auto-saved calculation to Trade Audits database for ${user.email || user.fullName}`);
      setTimeout(() => setAutoSavedNotice(null), 3500);
    }

    // Smooth scroll to breakdown on smaller screens
    if (window.innerWidth < 1024 && breakdownRef.current) {
      breakdownRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle Incoterm change
  const handleIncotermChange = (newCode: string) => {
    setMetadata((prev) => ({ ...prev, incotermCode: newCode }));
  };

  // Handle numeric field update with string support for clean typing & empty states
  const handleFieldChange = (field: keyof ShipmentCostInputs, strVal: string) => {
    setRawInputs((prev) => ({ ...prev, [field]: strVal }));
    const trimmed = strVal.trim();
    if (trimmed === '') {
      setInputs((prev) => ({ ...prev, [field]: 0 }));
    } else {
      const parsed = parseFloat(trimmed);
      setInputs((prev) => ({ ...prev, [field]: isNaN(parsed) ? 0 : parsed }));
    }
    // Set dynamic live calculation active as custom inputs are modified
    setHasCalculated(true);
  };

  // Helper to get display value for inputs
  const getDisplayValue = (field: keyof ShipmentCostInputs): string => {
    if (rawInputs[field] !== undefined) {
      return rawInputs[field]!;
    }
    const val = inputs[field];
    if (typeof val === 'number') {
      return val === 0 ? '' : val.toString();
    }
    return '';
  };

  // Handle metadata field update
  const handleMetadataChange = (field: keyof ShipmentMetadata, value: any) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveToWorkspace = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    const enrichedResult: CalculationResult = {
      ...result,
      metadata: {
        ...result.metadata,
        title: result.metadata.title.trim() || `${metadata.incotermCode} Cargo Shipment (${currentCurrency})`,
        referenceNo: result.metadata.referenceNo.trim() || `PO-${Date.now().toString().slice(-6)}`,
        userId: user.id,
        userEmail: user.email || user.phoneNumber,
        userName: user.fullName,
      },
    };
    saveCalculation(enrichedResult);
    setSaveBanner(true);
    setAutoSavedNotice(`Trade audit successfully saved to persistent database!`);
    setTimeout(() => {
      setSaveBanner(false);
      setAutoSavedNotice(null);
    }, 3500);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Presets Selector */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-700">
                <Calculator className="w-4 h-4 text-teal-700" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700">
                Multi-Party Financial Exposure Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Landed Cost & Risk Simulation
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Simulate true Total Landed Cost (TLC), seller contract quotation value, customs valuation, and liability exposure across all 11 Incoterms.
            </p>
          </div>

          {/* Clean Engine Status & Reset Control */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Valuation Rule
              </span>
              <span className="text-xs font-semibold text-slate-700">
                ICC® 2020 / WTO Standard
              </span>
            </div>

            <button
              onClick={() => setShowFxConverter((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs flex items-center space-x-1.5 ${
                showFxConverter
                  ? 'bg-teal-50 text-teal-800 border border-teal-300'
                  : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
              title="Toggle Trade Currency Exchange Converter"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-teal-700" />
              <span>{showFxConverter ? 'Hide FX Tool' : 'FX Converter Tool'}</span>
            </button>

            <button
              onClick={handleResetToZero}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shadow-2xs flex items-center space-x-1.5"
              title="Reset all inputs back to zero"
            >
              <RefreshCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Inputs</span>
            </button>
          </div>
        </div>

        {/* Database Auto-Save / Save Feedback Notice */}
        {autoSavedNotice && (
          <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between text-xs text-teal-900 animate-in fade-in duration-200 shadow-2xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="font-semibold">{autoSavedNotice}</span>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-mono text-teal-800 bg-white border border-teal-200 px-2.5 py-0.5 rounded-lg font-bold">
              Profile Database
            </span>
          </div>
        )}

        {/* Global Summary KPI Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Seller Invoice Quote */}
          <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-200 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Seller Commercial Quote</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  Invoice Val
                </span>
              </div>
              <div className="text-2xl font-mono font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(result.sellerTotal, currentCurrency, true, rates)}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center space-x-1">
              <span>Includes base cargo + seller contracted logistics</span>
            </div>
          </div>

          {/* Buyer Total Landed Cost */}
          <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-200 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Buyer Total Landed Cost</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  TLC
                </span>
              </div>
              <div className="text-2xl font-mono font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(result.totalLandedCost, currentCurrency, true, rates)}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              Invoice paid + direct destination duties & delivery
            </div>
          </div>

          {/* Customs Duty & Taxes */}
          <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-200 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Import Tariffs & VAT</span>
                <span className="text-[10px] font-mono text-slate-500">
                  CIF: {formatCurrency(result.customsDutiableValue, currentCurrency, false, rates)}
                </span>
              </div>
              <div className="text-2xl font-mono font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(result.importDutyAmount + result.importVatAmount, currentCurrency, true, rates)}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              Duty: {formatCurrency(result.importDutyAmount, currentCurrency, false, rates)} | VAT: {formatCurrency(result.importVatAmount, currentCurrency, false, rates)}
            </div>
          </div>

          {/* Risk Allocation Gauge */}
          <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-200 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>In-Transit Risk Exposure</span>
                <span className="text-[10px] font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                  {incotermDef.code}
                </span>
              </div>
              {/* Split Bar */}
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex mt-2 border border-slate-200">
                <div
                  style={{ width: `${result.sellerRiskPercentage}%` }}
                  className="h-full bg-emerald-600 transition-all duration-300"
                  title={`Seller Transit Risk: ${result.sellerRiskPercentage}%`}
                />
                <div
                  style={{ width: `${result.buyerRiskPercentage}%` }}
                  className="h-full bg-amber-500 transition-all duration-300"
                  title={`Buyer Transit Risk: ${result.buyerRiskPercentage}%`}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono mt-2 font-semibold">
              <span className="text-emerald-700">Seller: {result.sellerRiskPercentage}%</span>
              <span className="text-amber-700">Buyer: {result.buyerRiskPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-6 border-t border-slate-200">
          {/* Incoterm Quick Switcher Pill Strip */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
            <span className="text-xs font-semibold text-slate-500 mr-1 shrink-0">Incoterm:</span>
            {INCOTERMS_LIST.map((term) => {
              const isSelected = metadata.incotermCode === term.code;
              return (
                <button
                  key={term.code}
                  onClick={() => handleIncotermChange(term.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-teal-700 text-white border border-teal-800 shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  {term.code}
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onOpenComparator(metadata.incotermCode)}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <GitCompare className="w-3.5 h-3.5 text-slate-500" />
              <span>Compare Incoterms</span>
            </button>

            <button
              onClick={handleSaveToWorkspace}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 border border-teal-800 shadow-xs transition-colors cursor-pointer"
            >
              {saveBanner ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Saved to Audit!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Audit</span>
                </>
              )}
            </button>

            <button
              onClick={() => onOpenReportModal(result)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Export PDF Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Currency Exchange Converter Tool */}
      {showFxConverter && (
        <CurrencyExchangeConverter />
      )}

      {/* Main Two-Column Layout: Parameters/Cost Sliders vs Live Itemized Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Parameter Inputs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Shipment Overview Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <Package className="w-4 h-4 text-teal-700" />
              <span>Shipment Identification & Route</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-700 font-medium">Shipment Title / PO Reference</label>
                <div className="flex space-x-2 mt-1">
                  <input
                    type="text"
                    value={metadata.title}
                    placeholder="e.g. Commercial PO Reference / Description"
                    onChange={(e) => handleMetadataChange('title', e.target.value)}
                    className="flex-1 bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600"
                  />
                  <input
                    type="text"
                    value={metadata.referenceNo}
                    placeholder="e.g. PO-2026-001"
                    onChange={(e) => handleMetadataChange('referenceNo', e.target.value)}
                    className="w-32 bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-700 font-medium">Origin Port / Terminal</label>
                  <input
                    type="text"
                    value={metadata.originPort}
                    placeholder="e.g. Hamburg (DEHAM)"
                    onChange={(e) => handleMetadataChange('originPort', e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-medium">Destination Port / Hub</label>
                  <input
                    type="text"
                    value={metadata.destinationPort}
                    placeholder="e.g. Newark (USNWK)"
                    onChange={(e) => handleMetadataChange('destinationPort', e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-700 font-medium">Freight Transport Mode</label>
                  <select
                    value={metadata.freightMode}
                    onChange={(e) => handleMetadataChange('freightMode', e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-600 mt-1 cursor-pointer"
                  >
                    <option value="OCEAN_FCL">Ocean Freight (FCL Container)</option>
                    <option value="OCEAN_LCL">Ocean Freight (LCL Consolidation)</option>
                    <option value="AIR_FREIGHT">Air Cargo (Express / Scheduled)</option>
                    <option value="ROAD_RAIL">Cross-Border Road / Rail</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-medium">HS Code / Tariff Item</label>
                  <input
                    type="text"
                    value={metadata.hsCode}
                    placeholder="e.g. 8457.10"
                    onChange={(e) => handleMetadataChange('hsCode', e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cost Line Inputs Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-teal-700" />
              <span>Line-Item Financial Inputs ({currentCurrency})</span>
            </h3>

            {/* Base Cargo Value */}
            <div className="p-3 bg-teal-50/30 rounded-xl border border-teal-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">Commercial Invoice Cargo Value</span>
                <span className="font-mono text-teal-800 font-bold">
                  {formatCurrencyAmount(inputs.cargoValue, currentCurrency, false)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sm font-mono font-medium text-slate-400 select-none">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0.00"
                  value={getDisplayValue('cargoValue')}
                  onChange={(e) => handleFieldChange('cargoValue', e.target.value)}
                  className={`w-full bg-white border border-slate-200 rounded-lg py-2 pr-3 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-2xs ${
                    currencySymbol.length > 2 ? 'pl-11' : 'pl-8'
                  }`}
                />
              </div>
            </div>

            {/* Origin Costs */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-[11px] font-mono text-teal-700 uppercase font-bold">
                Origin Logistics & Clearance
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-600 font-medium">Packaging / Marking</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-mono font-medium text-slate-400 select-none">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={getDisplayValue('packagingCost')}
                      onChange={(e) => handleFieldChange('packagingCost', e.target.value)}
                      className={`w-full bg-white border border-slate-200 rounded-lg py-1.5 pr-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-2xs ${
                        currencySymbol.length > 2 ? 'pl-9' : 'pl-7'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-medium">Origin Drayage</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-mono font-medium text-slate-400 select-none">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={getDisplayValue('preCarriageCost')}
                      onChange={(e) => handleFieldChange('preCarriageCost', e.target.value)}
                      className={`w-full bg-white border border-slate-200 rounded-lg py-1.5 pr-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-2xs ${
                        currencySymbol.length > 2 ? 'pl-9' : 'pl-7'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-medium">Export Customs Clearance</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-mono font-medium text-slate-400 select-none">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={getDisplayValue('exportClearanceCost')}
                      onChange={(e) => handleFieldChange('exportClearanceCost', e.target.value)}
                      className={`w-full bg-white border border-slate-200 rounded-lg py-1.5 pr-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-2xs ${
                        currencySymbol.length > 2 ? 'pl-9' : 'pl-7'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-medium">Origin Port THC (OTHC)</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-mono font-medium text-slate-400 select-none">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={getDisplayValue('originThcCost')}
                      onChange={(e) => handleFieldChange('originThcCost', e.target.value)}
                      className={`w-full bg-white border border-slate-200 rounded-lg py-1.5 pr-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-2xs ${
                        currencySymbol.length > 2 ? 'pl-9' : 'pl-7'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* International Freight & Marine Insurance */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-[11px] font-mono text-teal-700 uppercase font-bold">
                International Transit & Insurance
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-600 font-medium">Main Carriage Freight</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-mono font-medium text-slate-400 select-none">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={getDisplayValue('mainCarriageFreight')}
                      onChange={(e) => handleFieldChange('mainCarriageFreight', e.target.value)}
                      className={`w-full bg-white border border-slate-200 rounded-lg py-1.5 pr-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-2xs ${
                        currencySymbol.length > 2 ? 'pl-9' : 'pl-7'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-medium">Insurance Rate (%)</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      placeholder="0.00"
                      value={getDisplayValue('insuranceRatePercent')}
                      onChange={(e) => handleFieldChange('insuranceRatePercent', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-2.5 pr-6 text-xs font-mono text-slate-900 placeholder-slate-400 mt-1 focus:outline-none focus:border-teal-600 shadow-2xs"
                    />
                    <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-xs font-mono font-medium text-slate-400 select-none">
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Destination Logistics & Duties */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-[11px] font-mono text-teal-700 uppercase font-bold">
                Destination Port & Duties
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-600 font-medium">Destination Port (DTHC)</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-mono font-medium text-slate-400 select-none">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={getDisplayValue('destinationThcCost')}
                      onChange={(e) => handleFieldChange('destinationThcCost', e.target.value)}
                      className={`w-full bg-white border border-slate-200 rounded-lg py-1.5 pr-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-2xs ${
                        currencySymbol.length > 2 ? 'pl-9' : 'pl-7'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-medium">Customs Clearance / Entry Fee</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-mono font-medium text-slate-400 select-none">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={getDisplayValue('importClearanceCost')}
                      onChange={(e) => handleFieldChange('importClearanceCost', e.target.value)}
                      className={`w-full bg-white border border-slate-200 rounded-lg py-1.5 pr-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-2xs ${
                        currencySymbol.length > 2 ? 'pl-9' : 'pl-7'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-medium">Import Tariff / Duty (%)</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.00"
                      value={getDisplayValue('importDutyTariffPercent')}
                      onChange={(e) => handleFieldChange('importDutyTariffPercent', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-2.5 pr-6 text-xs font-mono text-slate-900 placeholder-slate-400 mt-1 focus:outline-none focus:border-teal-600 shadow-2xs"
                    />
                    <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-xs font-mono font-medium text-slate-400 select-none">
                      %
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-medium">Import VAT / GST (%)</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="0.00"
                      value={getDisplayValue('importVatPercent')}
                      onChange={(e) => handleFieldChange('importVatPercent', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-2.5 pr-6 text-xs font-mono text-slate-900 placeholder-slate-400 mt-1 focus:outline-none focus:border-teal-600 shadow-2xs"
                    />
                    <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-xs font-mono font-medium text-slate-400 select-none">
                      %
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] text-slate-600 font-medium">Destination Drayage (On-Carriage to Buyer Site)</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-mono font-medium text-slate-400 select-none">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={getDisplayValue('onCarriageCost')}
                      onChange={(e) => handleFieldChange('onCarriageCost', e.target.value)}
                      className={`w-full bg-white border border-slate-200 rounded-lg py-1.5 pr-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-2xs ${
                        currencySymbol.length > 2 ? 'pl-9' : 'pl-7'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Prominent Action Button: Calculate Landed Cost */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <button
                type="button"
                onClick={handleRunCostAnalysis}
                className="w-full py-3.5 px-5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-sm rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-2 border border-teal-800"
              >
                <Calculator className="w-4 h-4 text-teal-100" />
                <span>Calculate Landed Cost</span>
                <ArrowRight className="w-4 h-4 text-teal-200 ml-0.5" />
              </button>

              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={handleResetToZero}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <RefreshCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset / Clear All</span>
                </button>

                <div className="text-[11px] font-mono">
                  {justCalculated ? (
                    <span className="text-emerald-700 font-semibold flex items-center">
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Cost Analysis Updated
                    </span>
                  ) : hasCalculated ? (
                    <span className="text-teal-700 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block mr-1.5" />
                      Dynamic Math Active
                    </span>
                  ) : (
                    <span className="text-slate-400">Ready for custom parameters</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Dynamic Breakdown & Visual Allocation */}
        <div ref={breakdownRef} className="lg:col-span-7 space-y-6">
          {/* Active Incoterm Profile Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center font-mono font-extrabold text-teal-800 shadow-xs text-base">
                  {incotermDef.code}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{incotermDef.name}</h4>
                  <p className="text-xs text-slate-500 italic">"{incotermDef.tagline}"</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Named Rule</span>
                <span className="text-xs font-mono text-teal-700 font-semibold">
                  Incoterms® 2020
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
              <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px] font-medium">Risk Transfer Boundary:</span>
                <span className="text-slate-800 font-medium line-clamp-2">
                  {incotermDef.riskTransferPoint}
                </span>
              </div>
              <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px] font-medium">Cost Passing Boundary:</span>
                <span className="text-slate-800 font-medium line-clamp-2">
                  {incotermDef.costTransferPoint}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Landed Cost Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-teal-700" />
                <span>Obligation & Landed Cost Breakdown</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">
                Base Currency: <strong className="text-slate-900">{currentCurrency}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase font-mono text-slate-500 bg-[#f8fafc] border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Cost Component</th>
                    <th className="py-2.5 px-3 text-center">Borne By</th>
                    <th className="py-2.5 px-3 text-right">Amount ({currentCurrency})</th>
                    <th className="py-2.5 px-3 text-right">% of TLC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {result.items.map((item) => {
                    const isSeller = item.borneBy === 'SELLER';
                    const pct = result.totalLandedCost > 0
                      ? ((item.amountUSD / result.totalLandedCost) * 100).toFixed(1)
                      : '0.0';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="text-slate-900 font-semibold">{item.label}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">
                            {item.description}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                              isSeller
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.borneBy}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                          {formatCurrency(item.amountUSD, currentCurrency, true, rates)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-[#f8fafc] font-bold">
                  <tr>
                    <td colSpan={2} className="py-3 px-3 text-slate-700 text-xs uppercase font-mono">
                      Total Landed Cost to Buyer (TLC)
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-base text-teal-700 font-extrabold">
                      {formatCurrency(result.totalLandedCost, currentCurrency, true, rates)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {result.totalLandedCost > 0 ? '100%' : '0%'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Strategic Notes for Selected Term */}
            <div className="mt-4 p-3.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-700">
              <strong className="text-teal-800 font-semibold">Operational Takeaway: </strong>
              {result.totalLandedCost > 0 ? (
                <>
                  Under <strong className="font-mono text-slate-900">{incotermDef.code}</strong>, the seller's quote to buyer will be <strong>{formatCurrency(result.sellerTotal, currentCurrency, true, rates)}</strong>. The buyer must budget an additional <strong>{formatCurrency(result.totalLandedCost - result.sellerTotal, currentCurrency, true, rates)}</strong> directly for import tariffs, clearance, and on-carriage.
                </>
              ) : (
                <>
                  Under <strong className="font-mono text-slate-900">{incotermDef.code}</strong>, enter your cargo valuation and logistics line items on the left to simulate seller commercial quotation and buyer landed cost allocation in real time.
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
