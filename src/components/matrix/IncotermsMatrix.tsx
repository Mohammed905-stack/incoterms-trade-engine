import React, { useState } from 'react';
import { INCOTERMS_LIST } from '../../data/incotermsData';
import { IncotermDefinition, TransportMode } from '../../types/trade';
import { SupplyChainTimeline } from './SupplyChainTimeline';
import {
  Search,
  Layers,
  Ship,
  Sparkles,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  X,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

interface IncotermsMatrixProps {
  onSelectForCalculation: (code: string) => void;
  onCompareTerm: (code: string) => void;
}

export const IncotermsMatrix: React.FC<IncotermsMatrixProps> = ({
  onSelectForCalculation,
  onCompareTerm,
}) => {
  const [modeFilter, setModeFilter] = useState<'ALL' | TransportMode>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalTerm, setActiveModalTerm] = useState<IncotermDefinition | null>(null);

  const filteredTerms = INCOTERMS_LIST.filter((term) => {
    const matchesMode = modeFilter === 'ALL' || term.transportMode === modeFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      term.code.toLowerCase().includes(q) ||
      term.name.toLowerCase().includes(q) ||
      term.tagline.toLowerCase().includes(q) ||
      term.summary.toLowerCase().includes(q) ||
      term.namedPlaceRule.toLowerCase().includes(q);
    return matchesMode && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Hero / Header Section */}
      <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs">
        <div className="relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-4">
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              <span>Official International Chamber of Commerce (ICC) Standards</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Incoterms® 2020 Master Matrix
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Explore all 11 standardized trade clauses defining the allocation of financial costs, customs clearance duties, cargo insurance mandates, and transfer of transit risk between international buyers and sellers.
            </p>
          </div>

          {/* Quick Metrics Bar - Balanced 4-card layout with single-line labels and matched heights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mt-8 pt-6 border-t border-slate-200 w-full">
            <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200 flex flex-col justify-center min-h-[82px] shadow-xs">
              <div className="text-base sm:text-lg xl:text-xl font-bold font-mono text-slate-900 tracking-tight whitespace-nowrap">
                11 Rules
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium whitespace-nowrap truncate mt-1">
                Standardized Clauses
              </div>
            </div>
            <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200 flex flex-col justify-center min-h-[82px] shadow-xs">
              <div className="text-base sm:text-lg xl:text-xl font-bold font-mono text-slate-900 tracking-tight whitespace-nowrap">
                7 Multimodal
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium whitespace-nowrap truncate mt-1">
                Any Transport Mode
              </div>
            </div>
            <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200 flex flex-col justify-center min-h-[82px] shadow-xs">
              <div className="text-base sm:text-lg xl:text-xl font-bold font-mono text-slate-900 tracking-tight whitespace-nowrap">
                4 Maritime
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium whitespace-nowrap truncate mt-1">
                Sea & Waterway Only
              </div>
            </div>
            <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200 flex flex-col justify-center min-h-[82px] shadow-xs">
              <div className="text-base sm:text-lg xl:text-xl font-bold font-mono text-slate-900 tracking-tight whitespace-nowrap">
                ICC 2020
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium whitespace-nowrap truncate mt-1">
                Current Legal Edition
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Mode Selector Tabs */}
        <div className="flex p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            onClick={() => setModeFilter('ALL')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              modeFilter === 'ALL'
                ? 'bg-teal-700 text-white border border-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            All Rules (11)
          </button>
          <button
            onClick={() => setModeFilter('ANY_MODE')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              modeFilter === 'ANY_MODE'
                ? 'bg-teal-700 text-white border border-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Any Mode (7)</span>
          </button>
          <button
            onClick={() => setModeFilter('SEA_INLAND_WATERWAY')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              modeFilter === 'SEA_INLAND_WATERWAY'
                ? 'bg-teal-700 text-white border border-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span>Sea / Waterway (4)</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code, term, or obligation..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Grid of Incoterm Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTerms.map((term) => {
          const isMultimodal = term.transportMode === 'ANY_MODE';
          return (
            <div
              key={term.code}
              className="flex flex-col bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl p-5 transition-colors shadow-xs group"
            >
              {/* Header: Code, Mode, Name */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-lg font-mono font-extrabold text-teal-800 shadow-xs">
                    {term.code}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">{term.name}</h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-slate-100 border-slate-200 text-slate-600">
                        {isMultimodal ? 'Any Transport Mode' : 'Sea & Inland Waterway'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <p className="text-xs font-semibold text-teal-700/90 mb-3 italic">
                "{term.tagline}"
              </p>

              {/* Summary */}
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4 flex-1">
                {term.summary}
              </p>

              {/* Quick Responsibility Badges */}
              <div className="grid grid-cols-3 gap-1.5 py-2.5 px-3 bg-[#f8fafc] rounded-xl border border-slate-200 mb-4 text-[11px]">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block">Export Duty</span>
                  <span
                    className={`font-semibold font-mono ${
                      term.exportCustomsParty === 'SELLER' ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {term.exportCustomsParty}
                  </span>
                </div>
                <div className="text-center border-x border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Import Duty</span>
                  <span
                    className={`font-semibold font-mono ${
                      term.importCustomsParty === 'SELLER' ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {term.importCustomsParty}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block">Insurance</span>
                  <span
                    className={`font-semibold font-mono ${
                      term.insuranceLevel !== 'NONE_MANDATED' ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {term.insuranceLevel === 'ICC_A_MAXIMAL'
                      ? 'ICC (A)'
                      : term.insuranceLevel === 'ICC_C_MINIMAL'
                      ? 'ICC (C)'
                      : 'None'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => setActiveModalTerm(term)}
                  className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Deep Dive</span>
                </button>
                <button
                  onClick={() => onSelectForCalculation(term.code)}
                  className="py-2 px-3.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl border border-teal-800 shadow-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  title="Simulate Landed Cost with this term"
                >
                  <span>Simulate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Modal */}
      {activeModalTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Top color bar */}
            <div className="h-1.5 bg-teal-700 shrink-0" />

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between shrink-0 bg-slate-50/80">
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-2xl font-mono font-extrabold text-teal-800 shadow-xs">
                  {activeModalTerm.code}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {activeModalTerm.name}
                    </h2>
                    <span className="text-xs font-mono text-slate-600 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                      Incoterms® 2020
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">{activeModalTerm.tagline}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveModalTerm(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-[#f8f9fa]">
              {/* Interactive Supply Chain Timeline */}
              <SupplyChainTimeline incoterm={activeModalTerm} />

              {/* Contract Formulation Box */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-wider block mb-1">
                  Contract Named Place Rule & Wording
                </span>
                <div className="text-sm font-semibold text-slate-900 mb-1">
                  {activeModalTerm.namedPlaceRule}
                </div>
                <div className="text-xs font-mono text-slate-700 bg-[#f8fafc] p-2.5 rounded-lg border border-slate-200 flex items-center space-x-2">
                  <span className="text-slate-500">Legal Example:</span>
                  <span className="text-slate-900 font-semibold">{activeModalTerm.exampleUse}</span>
                </div>
              </div>

              {/* 2020 Changes & Insurance Mandates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div className="flex items-center space-x-2 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-700" />
                    <span>Key ICC 2020 Amendment</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeModalTerm.key2020Changes}
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div className="flex items-center space-x-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    <span>Insurance Stipulation</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeModalTerm.insuranceRequirement}
                  </p>
                </div>
              </div>

              {/* Best Used For & Cautions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                    <span>Recommended Applications</span>
                  </div>
                  <ul className="space-y-1.5">
                    {activeModalTerm.bestUsedFor.map((item, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start space-x-2">
                        <span className="text-emerald-600 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Commercial & Legal Cautions</span>
                  </div>
                  <ul className="space-y-1.5">
                    {activeModalTerm.cautions.map((item, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start space-x-2">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  const code = activeModalTerm.code;
                  setActiveModalTerm(null);
                  onCompareTerm(code);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-xs"
              >
                Compare in Scenario Engine
              </button>

              <button
                onClick={() => {
                  const code = activeModalTerm.code;
                  setActiveModalTerm(null);
                  onSelectForCalculation(code);
                }}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl border border-teal-800 shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <span>Calculate Landed Cost</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
