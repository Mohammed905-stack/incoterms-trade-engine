import React, { useState } from 'react';
import { TRADE_DOCUMENTS_MASTER } from '../../data/complianceDocs';
import { INCOTERMS_LIST, getIncotermByCode } from '../../data/incotermsData';
import { TradeDocument } from '../../types/trade';
import {
  FileCheck2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Printer,
  ShieldCheck,
  FileText,
  Building,
  UserCheck,
  Search,
} from 'lucide-react';

interface ComplianceAdvisoryProps {
  initialIncoterm?: string;
}

type DocStatus = 'PENDING' | 'DRAFTED' | 'ISSUED' | 'VERIFIED';

export const ComplianceAdvisory: React.FC<ComplianceAdvisoryProps> = ({
  initialIncoterm = 'FCA',
}) => {
  const [selectedIncoterm, setSelectedIncoterm] = useState(initialIncoterm);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [docStatuses, setDocStatuses] = useState<Record<string, DocStatus>>({
    doc_comm_invoice: 'VERIFIED',
    doc_packing_list: 'ISSUED',
    doc_bill_of_lading: 'DRAFTED',
    doc_coo: 'PENDING',
    doc_insurance_cert: 'PENDING',
    doc_export_decl: 'DRAFTED',
    doc_import_entry: 'PENDING',
    doc_inspection_cert: 'VERIFIED',
  });

  const term = getIncotermByCode(selectedIncoterm);

  // Filter documents applicable to this Incoterm
  const applicableDocs = TRADE_DOCUMENTS_MASTER.filter((doc) => {
    const matchesIncoterm =
      doc.requiredForIncoterms.includes('ALL') ||
      doc.requiredForIncoterms.includes(selectedIncoterm);
    const matchesCat = selectedCategory === 'ALL' || doc.category === selectedCategory;
    return matchesIncoterm && matchesCat;
  });

  const handleStatusChange = (docId: string, status: DocStatus) => {
    setDocStatuses((prev) => ({ ...prev, [docId]: status }));
  };

  const verifiedCount = Object.values(docStatuses).filter((s) => s === 'VERIFIED').length;
  const progressPct = Math.round((verifiedCount / applicableDocs.length) * 100);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-700">
                <FileCheck2 className="w-4 h-4 text-teal-700" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700">
                Customs & Regulatory Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Document & Trade Compliance Advisory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Statutory trade documentation, legal certifications, and procedural checklists mapped to your active Incoterm contract.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Compliance Checklist</span>
            </button>
          </div>
        </div>

        {/* Incoterm Selector and Progress Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-700">Evaluating Rule:</span>
            <select
              value={selectedIncoterm}
              onChange={(e) => setSelectedIncoterm(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-600 cursor-pointer shadow-2xs"
            >
              {INCOTERMS_LIST.map((t) => (
                <option key={t.code} value={t.code} className="bg-white text-slate-900">
                  {t.code} — {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Compliance Readiness Gauge */}
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500">Readiness Audit:</span>
            <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
              <div
                style={{ width: `${Math.min(progressPct, 100)}%` }}
                className="bg-emerald-600 h-full transition-all duration-300"
              />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {progressPct}% Verified
            </span>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'COMMERCIAL', 'TRANSPORT', 'CUSTOMS', 'INSURANCE', 'REGULATORY'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-teal-700 text-white border border-teal-700 shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Document Advisory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {applicableDocs.map((doc) => {
          const status = docStatuses[doc.id] || 'PENDING';
          const isVerified = status === 'VERIFIED';

          return (
            <div
              key={doc.id}
              className={`flex flex-col bg-white border rounded-2xl p-5 transition-colors shadow-xs ${
                isVerified ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header: Name, Code, Category */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-teal-700 font-mono text-xs font-bold">
                    {doc.code}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{doc.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Procured by: <strong className="text-slate-800">{doc.procuredBy}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Dropdown */}
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(doc.id, e.target.value as DocStatus)}
                  className={`text-[11px] font-semibold font-mono rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                    status === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : status === 'ISSUED'
                      ? 'bg-teal-50 text-teal-800 border-teal-300'
                      : status === 'DRAFTED'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <option value="PENDING" className="bg-white text-slate-800">Pending</option>
                  <option value="DRAFTED" className="bg-white text-slate-800">Drafted</option>
                  <option value="ISSUED" className="bg-white text-slate-800">Issued</option>
                  <option value="VERIFIED" className="bg-white text-slate-800">Verified ✓</option>
                </select>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed mb-3 flex-1">
                {doc.description}
              </p>

              {/* Purpose and Timing */}
              <div className="grid grid-cols-2 gap-2 text-[11px] py-2 px-3 bg-[#f8fafc] rounded-xl border border-slate-200 mb-3">
                <div>
                  <span className="text-slate-500 block font-medium">Customs Purpose:</span>
                  <span className="text-slate-800 font-medium">{doc.purpose}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Issuance Window:</span>
                  <span className="text-slate-800 font-medium">{doc.timing}</span>
                </div>
              </div>

              {/* Risk Alert / Pitfall */}
              <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>{doc.riskNotes}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Trade Compliance Sanctions & Dual-Use Notice */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-start space-x-3 text-xs text-slate-600 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 font-semibold">Regulatory Cross-Reference Note: </strong>
          In addition to commercial documents, international shipments must comply with destination import quotas, Dual-Use export control licenses (EAR/ITAR in USA, EU dual-use regulations), and ISPM-15 wooden packaging heat treatment stamping.
        </div>
      </div>
    </div>
  );
};
