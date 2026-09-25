import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { INCOTERMS_LIST, getIncotermByCode, SUPPLY_CHAIN_LEGS } from '../../data/incotermsData';
import { PRESET_SHIPMENTS } from '../../data/presetShipments';
import { compareIncoterms } from '../../utils/calculator';
import { formatCurrency } from '../../utils/currencies';
import {
  GitCompare,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ScenarioComparatorProps {
  initialTermA?: string;
  initialTermB?: string;
  onSelectTermForCalc?: (code: string) => void;
}

export const ScenarioComparator: React.FC<ScenarioComparatorProps> = ({
  initialTermA = 'FOB',
  initialTermB = 'CIF',
  onSelectTermForCalc,
}) => {
  const { user } = useAuth();
  const { selectedCurrency, rates } = useCurrency();
  const currentCurrency = selectedCurrency || user?.preferredCurrency || 'USD';

  const [codeA, setCodeA] = useState(initialTermA);
  const [codeB, setCodeB] = useState(initialTermB);

  // Preset shipment baseline
  const [selectedPresetId, setSelectedPresetId] = useState('preset_machinery_de_us');
  const activePreset = PRESET_SHIPMENTS.find((p) => p.id === selectedPresetId) || PRESET_SHIPMENTS[0];

  const comparison = compareIncoterms(activePreset.inputs, activePreset.metadata, codeA, codeB, rates);

  const termA = getIncotermByCode(codeA);
  const termB = getIncotermByCode(codeB);

  return (
    <div className="space-y-8">
      {/* Comparator Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-700">
                <GitCompare className="w-4 h-4 text-teal-700" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700">
                Strategic Trade Evaluation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Side-by-Side Incoterms® Scenario Comparator
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Analyze how switching between trade terms shifts financial quotation burden, marine transit risk, and clearance liabilities.
            </p>
          </div>

          {/* Quick Comparison Presets */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setCodeA('FOB');
                setCodeB('CIF');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              FOB vs. CIF (Maritime Classic)
            </button>
            <button
              onClick={() => {
                setCodeA('FCA');
                setCodeB('CIP');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              FCA vs. CIP (Multimodal)
            </button>
            <button
              onClick={() => {
                setCodeA('EXW');
                setCodeB('DDP');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              EXW vs. DDP (Polar Opposites)
            </button>
          </div>
        </div>

        {/* Dual Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Term A Selector Card */}
          <div className="p-5 bg-[#f8fafc] rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-wider">
                Scenario Option A
              </span>
              <span className="text-xs text-slate-500">{termA.transportMode.replace('_', ' ')}</span>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={codeA}
                onChange={(e) => setCodeA(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-600 cursor-pointer shadow-2xs"
              >
                {INCOTERMS_LIST.map((t) => (
                  <option key={t.code} value={t.code} className="bg-white text-slate-900">
                    {t.code} — {t.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 italic">"{termA.tagline}"</p>
          </div>

          {/* Term B Selector Card */}
          <div className="p-5 bg-[#f8fafc] rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-wider">
                Scenario Option B
              </span>
              <span className="text-xs text-slate-500">{termB.transportMode.replace('_', ' ')}</span>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={codeB}
                onChange={(e) => setCodeB(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-600 cursor-pointer shadow-2xs"
              >
                {INCOTERMS_LIST.map((t) => (
                  <option key={t.code} value={t.code} className="bg-white text-slate-900">
                    {t.code} — {t.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 italic">"{termB.tagline}"</p>
          </div>
        </div>
      </div>

      {/* Variance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Seller Outlay Variance */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-xs text-slate-500 mb-1">Seller Commercial Quote Shift</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-mono font-extrabold text-slate-900">
              {formatCurrency(comparison.sellerDeltaUSD, currentCurrency, true, rates)}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({codeB} vs. {codeA})
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            {comparison.sellerDeltaUSD > 0
              ? `Seller quotes higher under ${codeB} due to added freight/insurance/drayage.`
              : comparison.sellerDeltaUSD < 0
              ? `Seller quotes lower under ${codeB} as logistics obligations transfer to buyer.`
              : `Identical seller quote burden.`}
          </p>
        </div>

        {/* Buyer Total Landed Cost Variance */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-xs text-slate-500 mb-1">Total Buyer Landed Cost Shift</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-mono font-extrabold text-teal-700">
              {formatCurrency(comparison.buyerLandedDeltaUSD, currentCurrency, true, rates)}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({codeB} vs. {codeA})
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Baseline cargo value remains equal. Variances represent freight consolidation margins and customs calculation basis differences.
          </p>
        </div>

        {/* Transit Risk Shift */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-xs text-slate-500 mb-1">In-Transit Risk Shift</div>
          <div className="text-xl font-mono font-extrabold text-slate-900">
            {comparison.sellerRiskDelta > 0
              ? `+${comparison.sellerRiskDelta}% Risk on Seller`
              : comparison.sellerRiskDelta < 0
              ? `${Math.abs(comparison.sellerRiskDelta)}% Risk transferred to Buyer`
              : 'Equal Risk Distribution'}
          </div>
          <p className="text-xs text-slate-600 mt-2">
            {codeA} has {comparison.resultA.sellerRiskPercentage}% seller risk vs. {codeB} with {comparison.resultB.sellerRiskPercentage}% seller risk.
          </p>
        </div>
      </div>

      {/* Strategic Differences Callout List */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-teal-700" />
          <span>Key Strategic & Legal Contrasts</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {comparison.keyDifferences.map((diff, idx) => (
            <div
              key={idx}
              className="p-3 bg-[#f8fafc] rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start space-x-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-700 mt-1.5 shrink-0" />
              <span>{diff}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-Side Leg Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <GitCompare className="w-4 h-4 text-teal-700" />
          <span>Stage-by-Stage Obligation Matrix: {codeA} vs. {codeB}</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] uppercase font-mono text-slate-500 bg-[#f8fafc] border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Logistics Stage</th>
                <th className="py-2.5 px-3 text-center border-l border-slate-200">
                  <span className="text-slate-900 font-bold">{codeA}</span> Cost
                </th>
                <th className="py-2.5 px-3 text-center">
                  <span className="text-slate-900 font-bold">{codeA}</span> Risk
                </th>
                <th className="py-2.5 px-3 text-center border-l border-slate-200">
                  <span className="text-slate-900 font-bold">{codeB}</span> Cost
                </th>
                <th className="py-2.5 px-3 text-center">
                  <span className="text-slate-900 font-bold">{codeB}</span> Risk
                </th>
                <th className="py-2.5 px-3 text-center border-l border-slate-200">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {SUPPLY_CHAIN_LEGS.map((leg) => {
                const costA = termA.costs[leg.id];
                const riskA = termA.risks[leg.id];
                const costB = termB.costs[leg.id];
                const riskB = termB.risks[leg.id];

                const hasChanged = costA !== costB || riskA !== riskB;

                return (
                  <tr
                    key={leg.id}
                    className={`transition-colors ${
                      hasChanged ? 'bg-teal-50/40 hover:bg-teal-50/70' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="text-slate-900 font-semibold">{leg.name}</div>
                      <div className="text-[10px] text-slate-500">{leg.category.toUpperCase()}</div>
                    </td>

                    {/* Term A */}
                    <td className="py-2.5 px-3 text-center border-l border-slate-200">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          costA === 'SELLER'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {costA}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          riskA === 'SELLER'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {riskA}
                      </span>
                    </td>

                    {/* Term B */}
                    <td className="py-2.5 px-3 text-center border-l border-slate-200">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          costB === 'SELLER'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {costB}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          riskB === 'SELLER'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {riskB}
                      </span>
                    </td>

                    {/* Variance status */}
                    <td className="py-2.5 px-3 text-center border-l border-slate-200">
                      {hasChanged ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                          Responsibility Shifts
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Identical</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
