import React from 'react';
import { CalculationResult } from '../../types/trade';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { getIncotermByCode } from '../../data/incotermsData';
import { formatCurrency } from '../../utils/currencies';
import { X, Printer, Shield, CheckCircle2, Download, Building, Compass } from 'lucide-react';

interface PrintableReportModalProps {
  calculation: CalculationResult | null;
  onClose: () => void;
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  calculation,
  onClose,
}) => {
  const { user } = useAuth();
  const { selectedCurrency, rates } = useCurrency();

  if (!calculation) return null;

  const { metadata, items, sellerTotal, totalLandedCost, customsDutiableValue, importDutyAmount, importVatAmount } = calculation;
  const incotermDef = getIncotermByCode(metadata.incotermCode);
  const currency = selectedCurrency || calculation.currency || user?.preferredCurrency || 'USD';
  const baseCargoUSD = items.find((i) => i.id === 'base_cargo')?.amountUSD ?? 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
        {/* Modal Action Header (hidden in print) */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-700">
              <Printer className="w-4 h-4 text-teal-700" />
            </span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Executive Trade Landed Cost Dossier
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 border border-teal-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-white text-stone-900 print-card font-sans">
          {/* Document Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b-2 border-stone-800 gap-4">
            <div>
              <div className="flex items-center space-x-2 text-stone-900">
                <Compass className="w-6 h-6 text-teal-700" />
                <span className="text-xl font-extrabold tracking-tight uppercase">
                  Global Trade & Landed Cost Audit
                </span>
              </div>
              <p className="text-xs text-stone-600 font-medium mt-0.5">
                Prepared pursuant to ICC Incoterms® 2020 Rules & Customs Valuation Standards
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-stone-600 space-y-0.5 font-mono">
              <div>
                Dossier Ref: <strong className="text-stone-900">{metadata.referenceNo}</strong>
              </div>
              <div>
                Date: <strong className="text-stone-900">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </div>
              <div>
                Audited By: <strong className="text-stone-900">{user?.fullName || 'Senior Trade Officer'}</strong>
              </div>
              <div>
                Organization: <strong className="text-stone-900">{user?.companyName || 'International Trade Division'}</strong>
              </div>
            </div>
          </div>

          {/* Shipment & Legal Incoterm Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6 p-4 bg-[#faf8f5] border border-stone-200 rounded-xl text-xs">
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-mono block">Commercial Incoterm</span>
              <div className="text-base font-mono font-extrabold text-teal-700 mt-0.5">
                {metadata.incotermCode} (2020)
              </div>
              <span className="text-[10px] text-stone-600">{incotermDef.name}</span>
            </div>

            <div>
              <span className="text-[10px] text-stone-500 uppercase font-mono block">Origin Terminal</span>
              <div className="font-semibold text-stone-900 mt-0.5">{metadata.originPort}</div>
              <span className="text-[10px] text-stone-600">{metadata.originCountry}</span>
            </div>

            <div>
              <span className="text-[10px] text-stone-500 uppercase font-mono block">Destination Port / Place</span>
              <div className="font-semibold text-stone-900 mt-0.5">{metadata.destinationPort}</div>
              <span className="text-[10px] text-stone-600">{metadata.destinationCountry}</span>
            </div>

            <div>
              <span className="text-[10px] text-stone-500 uppercase font-mono block">Freight Mode & HS</span>
              <div className="font-semibold text-stone-900 mt-0.5">{metadata.freightMode.replace('_', ' ')}</div>
              <span className="text-[10px] font-mono text-stone-600">HS: {metadata.hsCode}</span>
            </div>
          </div>

          {/* Executive Financial Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border border-stone-300 rounded-xl bg-[#faf8f5]">
              <span className="text-[10px] text-stone-500 uppercase font-mono block">
                Commercial Invoice Value
              </span>
              <div className="text-xl font-mono font-bold text-stone-900 mt-1">
                {formatCurrency(baseCargoUSD, currency, true, rates)}
              </div>
              <span className="text-[10px] text-stone-600">Contract baseline price</span>
            </div>

            <div className="p-4 border border-emerald-300 rounded-xl bg-emerald-50/50">
              <span className="text-[10px] text-emerald-800 uppercase font-mono block">
                Seller Quotation Value
              </span>
              <div className="text-xl font-mono font-bold text-emerald-900 mt-1">
                {formatCurrency(sellerTotal, currency, true, rates)}
              </div>
              <span className="text-[10px] text-emerald-700">Invoice paid by buyer to seller</span>
            </div>

            <div className="p-4 border border-teal-200 rounded-xl bg-teal-50/40">
              <span className="text-[10px] text-teal-800 uppercase font-mono font-bold block">
                Total Landed Cost (TLC)
              </span>
              <div className="text-xl font-mono font-bold text-stone-900 mt-1">
                {formatCurrency(totalLandedCost, currency, true, rates)}
              </div>
              <span className="text-[10px] text-stone-600">Full landed exposure at destination</span>
            </div>
          </div>

          {/* Itemized Cost Breakdown Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 font-mono">
              Itemized Logistics & Customs Allocation Schedule
            </h4>

            <table className="w-full text-xs text-left border border-stone-300">
              <thead className="bg-stone-100 text-[10px] uppercase font-mono text-stone-700 border-b border-stone-300">
                <tr>
                  <th className="py-2 px-3">Expense Head</th>
                  <th className="py-2 px-3">Legal Classification</th>
                  <th className="py-2 px-3 text-center">Responsible Party</th>
                  <th className="py-2 px-3 text-right">Amount ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 px-3 font-semibold text-stone-900">{item.label}</td>
                    <td className="py-2 px-3 text-stone-600 uppercase text-[10px] font-mono">
                      {item.category}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          item.borneBy === 'SELLER'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-50 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {item.borneBy}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-stone-900 font-semibold">
                      {formatCurrency(item.amountUSD, currency, true, rates)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-stone-100 font-bold border-t-2 border-stone-300">
                <tr>
                  <td colSpan={3} className="py-2.5 px-3 uppercase text-stone-900 font-mono">
                    Total Final Landed Exposure
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm text-teal-800">
                    {formatCurrency(totalLandedCost, currency, true, rates)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legal Risk & Obligation Statement */}
          <div className="p-3.5 bg-[#faf8f5] border border-stone-200 rounded-xl text-xs space-y-1.5 mb-8">
            <div className="font-bold text-stone-900">Incoterms® 2020 Statutory Risk Transfer Clause:</div>
            <div className="text-stone-700 leading-relaxed">
              Under <strong>{incotermDef.code}</strong> ({incotermDef.namedPlaceRule}), physical damage and transit loss risks transfer from Seller to Buyer at: <em>"{incotermDef.riskTransferPoint}"</em>. Mandatory cargo insurance: <em>"{incotermDef.insuranceRequirement}"</em>.
            </div>
          </div>

          {/* Dual Sign-off Signature Blocks */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-stone-300 text-xs">
            <div className="space-y-4">
              <div className="font-semibold text-stone-900 uppercase font-mono text-[10px]">
                Exporter / Seller Authorization
              </div>
              <div className="h-12 border-b border-dashed border-stone-400" />
              <div className="flex justify-between text-stone-600 text-[11px]">
                <span>Authorized Signatory</span>
                <span>Date: _______________</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="font-semibold text-stone-900 uppercase font-mono text-[10px]">
                Importer / Buyer Acceptance
              </div>
              <div className="h-12 border-b border-dashed border-stone-400" />
              <div className="flex justify-between text-stone-600 text-[11px]">
                <span>Acceptance & Stamp</span>
                <span>Date: _______________</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
