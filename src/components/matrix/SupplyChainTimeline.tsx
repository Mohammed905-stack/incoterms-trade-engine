import React, { useState } from 'react';
import { IncotermDefinition, SupplyChainLegKey } from '../../types/trade';
import { SUPPLY_CHAIN_LEGS } from '../../data/incotermsData';
import {
  Package,
  Truck,
  FileCheck2,
  Anchor,
  Ship,
  ShieldCheck,
  Container,
  Landmark,
  Navigation,
  ArrowDownToLine,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  Truck,
  FileCheck2,
  Anchor,
  Ship,
  ShieldCheck,
  Container,
  Landmark,
  Navigation,
  ArrowDownToLine,
};

interface SupplyChainTimelineProps {
  incoterm: IncotermDefinition;
  compact?: boolean;
}

export const SupplyChainTimeline: React.FC<SupplyChainTimelineProps> = ({ incoterm, compact = false }) => {
  const [selectedLeg, setSelectedLeg] = useState<SupplyChainLegKey | null>(null);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
      {/* Title & Legend Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700">
              Supply Chain Obligation Matrix
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-600">
              Rule: <strong className="text-slate-900 font-mono">{incoterm.code}</strong> ({incoterm.name})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking exact geographic points of financial cost responsibility vs in-transit physical risk transfer.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs font-medium shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-emerald-700" />
            <span className="text-emerald-700 font-semibold">Seller Responsibility</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 border border-amber-700" />
            <span className="text-amber-700 font-semibold">Buyer Responsibility</span>
          </div>
        </div>
      </div>

      {/* Critical Divergence Notice for CPT / CIP / CFR / CIF */}
      {['CPT', 'CIP', 'CFR', 'CIF'].includes(incoterm.code) && (
        <div className="mb-5 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start space-x-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-900 font-bold">Critical ICC 2020 Two-Point Rule: </strong>
            Under <strong>{incoterm.code}</strong>, Risk transfers to the buyer at origin (when handed to carrier/loaded on ship), but Cost is paid by the seller up to the destination. The parties must specify two points in the commercial contract!
          </div>
        </div>
      )}

      {/* Timeline Legs Chain */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
        {SUPPLY_CHAIN_LEGS.map((leg, idx) => {
          const Icon = ICON_MAP[leg.iconName] || Package;
          const costBearer = incoterm.costs[leg.id];
          const riskBearer = incoterm.risks[leg.id];
          const isSelected = selectedLeg === leg.id;

          const isSellerCost = costBearer === 'SELLER';
          const isSellerRisk = riskBearer === 'SELLER';

          return (
            <div
              key={leg.id}
              onClick={() => setSelectedLeg(isSelected ? null : leg.id)}
              className={`relative flex flex-col p-2.5 rounded-xl border transition-colors cursor-pointer group ${
                isSelected
                  ? 'bg-teal-50 border-teal-600 text-slate-900 shadow-xs ring-1 ring-teal-600'
                  : 'bg-[#f8fafc] border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-800'
              }`}
            >
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  0{idx + 1}
                </span>
                <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-slate-900 transition-colors shadow-2xs">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Leg Title */}
              <div className="text-[11px] font-semibold text-slate-800 line-clamp-2 min-h-[30px] leading-tight">
                {leg.shortName}
              </div>

              {/* Status Badges: Cost & Risk */}
              <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-200">
                {/* Cost Bearer */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-medium">Cost:</span>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded font-mono ${
                      isSellerCost
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {costBearer}
                  </span>
                </div>

                {/* Risk Bearer */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-medium">Risk:</span>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded font-mono ${
                      isSellerRisk
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {riskBearer}
                  </span>
                </div>
              </div>

              {/* Risk/Cost Divergence Marker */}
              {isSellerCost !== isSellerRisk && (
                <div className="mt-2 text-[9px] font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded px-1 text-center">
                  Split Risk/Cost
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Leg Detail Drawer */}
      {selectedLeg && (
        <div className="mt-4 p-4 bg-[#f8fafc] border border-slate-200 rounded-xl animate-in fade-in duration-150">
          {(() => {
            const current = SUPPLY_CHAIN_LEGS.find((l) => l.id === selectedLeg)!;
            const costParty = incoterm.costs[current.id];
            const riskParty = incoterm.risks[current.id];
            return (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-slate-900">{current.name}</h4>
                    <span className="text-xs text-teal-700 font-mono">({current.category.toUpperCase()})</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{current.description}</p>
                </div>
                <div className="flex items-center space-x-3 text-xs shrink-0">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-medium">Payment Responsibility</div>
                    <div className={`font-bold font-mono ${costParty === 'SELLER' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {costParty}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-medium">Transit Damage Risk</div>
                    <div className={`font-bold font-mono ${riskParty === 'SELLER' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {riskParty}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Transfer Points Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200 text-xs">
        <div className="p-3 bg-[#f8fafc] border border-slate-200 rounded-xl">
          <div className="flex items-center space-x-1.5 text-slate-800 font-semibold mb-1">
            <Info className="w-3.5 h-3.5 text-teal-700" />
            <span>Exact Point of Risk Transfer:</span>
          </div>
          <p className="text-slate-600 leading-relaxed">{incoterm.riskTransferPoint}</p>
        </div>

        <div className="p-3 bg-[#f8fafc] border border-slate-200 rounded-xl">
          <div className="flex items-center space-x-1.5 text-slate-800 font-semibold mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cost Transition Boundary:</span>
          </div>
          <p className="text-slate-600 leading-relaxed">{incoterm.costTransferPoint}</p>
        </div>
      </div>
    </div>
  );
};
