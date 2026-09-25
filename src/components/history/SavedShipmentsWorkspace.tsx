import React, { useState, useRef } from 'react';
import { useSavedCalculations } from '../../context/SavedCalculationsContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { CalculationResult } from '../../types/trade';
import { formatCurrency, convertToUSD } from '../../utils/currencies';
import {
  FolderArchive,
  Search,
  Download,
  Upload,
  Copy,
  Trash2,
  Printer,
  ArrowRight,
  Plus,
  Clock,
  Layers,
  CheckCircle,
  Table as TableIcon,
  LayoutGrid,
  Shield,
  User,
  Filter,
  RefreshCw,
  FileJson,
  ExternalLink,
} from 'lucide-react';

interface SavedShipmentsWorkspaceProps {
  onLoadIntoCalculator: (calc: CalculationResult) => void;
  onOpenReportModal: (calc: CalculationResult) => void;
  onNavigateToCalculator?: () => void;
}

export const SavedShipmentsWorkspace: React.FC<SavedShipmentsWorkspaceProps> = ({
  onLoadIntoCalculator,
  onOpenReportModal,
  onNavigateToCalculator,
}) => {
  const {
    savedCalculations,
    deleteCalculation,
    duplicateCalculation,
    exportAllAsJson,
    exportSingleDossier,
    importCalculationsFromJson,
    clearAllCalculations,
  } = useSavedCalculations();

  const { user } = useAuth();
  const { selectedCurrency, rates } = useCurrency();
  const currentCurrency = selectedCurrency || user?.preferredCurrency || 'USD';

  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTermFilter, setSelectedTermFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState<'ALL' | 'MINE'>('ALL');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter calculations
  const filteredCalculations = savedCalculations.filter((calc) => {
    const matchesTerm =
      selectedTermFilter === 'ALL' || calc.metadata.incotermCode === selectedTermFilter;

    const matchesUser =
      userFilter === 'ALL' ||
      !user ||
      calc.metadata.userId === user.id ||
      (user.email && calc.metadata.userEmail === user.email);

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      calc.metadata.title.toLowerCase().includes(q) ||
      calc.metadata.referenceNo.toLowerCase().includes(q) ||
      calc.metadata.commodity.toLowerCase().includes(q) ||
      calc.metadata.originPort.toLowerCase().includes(q) ||
      calc.metadata.destinationPort.toLowerCase().includes(q) ||
      (calc.metadata.userEmail && calc.metadata.userEmail.toLowerCase().includes(q));

    return matchesTerm && matchesUser && matchesSearch;
  });

  // Calculate statistics
  const totalAuditedValueUSD = savedCalculations.reduce(
    (acc, item) => acc + item.totalLandedCost,
    0
  );
  const totalBaseCargoUSD = savedCalculations.reduce((acc, item) => {
    const cargoItemUSD = item.items?.find((i) => i.id === 'base_cargo')?.amountUSD;
    if (typeof cargoItemUSD === 'number' && cargoItemUSD > 0) {
      return acc + cargoItemUSD;
    }
    const valUSD = convertToUSD(item.inputs.cargoValue, item.inputs.currency || 'USD', rates);
    return acc + valUSD;
  }, 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importCalculationsFromJson(content);
        if (res.success) {
          setImportStatus(`Successfully imported ${res.count} trade audit record(s).`);
        } else {
          setImportStatus('Failed to parse JSON backup file.');
        }
        setTimeout(() => setImportStatus(null), 3500);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteRecord = (id: string) => {
    deleteCalculation(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-700">
                <FolderArchive className="w-4 h-4 text-teal-700" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700">
                Enterprise Trade Records & Database
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Trade Audit & Shipment Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Securely stored historical calculations, multi-scenario comparisons, and compliance dossiers for international audit verification.
            </p>
          </div>

          {/* Export & Import Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportAllAsJson}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Download entire trade calculation database as JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Database (JSON)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Upload existing JSON audit records"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import Records</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />

            {onNavigateToCalculator && (
              <button
                onClick={onNavigateToCalculator}
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors border border-teal-800 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Calculation</span>
              </button>
            )}
          </div>
        </div>

        {importStatus && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        {/* Global Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Total Audited Records</div>
            <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1">
              {savedCalculations.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Persistent database store</div>
          </div>

          <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Total Commercial Cargo</div>
            <div className="text-2xl font-mono font-extrabold text-teal-700 mt-1">
              {formatCurrency(totalBaseCargoUSD, currentCurrency, false, rates)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Ex-factory baseline</div>
          </div>

          <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Total Landed Exposure</div>
            <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1">
              {formatCurrency(totalAuditedValueUSD, currentCurrency, false, rates)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Including tariffs & carriage</div>
          </div>

          <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Active Database User</div>
            <div className="text-sm font-semibold text-slate-900 mt-1 truncate">
              {user ? user.fullName : 'Guest Session'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono truncate">
              {user ? user.email || user.phoneNumber : 'Local Storage Mode'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter, Search, and View Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by PO#, commodity, ports, or user..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Filters and View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Incoterm filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-600 font-medium">Term:</span>
            <select
              value={selectedTermFilter}
              onChange={(e) => setSelectedTermFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-teal-600 shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Terms</option>
              {['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'].map(
                (code) => (
                  <option key={code} value={code} className="bg-white text-slate-800 font-mono">
                    {code}
                  </option>
                )
              )}
            </select>
          </div>

          {/* User scope toggle */}
          {user && (
            <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setUserFilter('ALL')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                  userFilter === 'ALL'
                    ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Audits
              </button>
              <button
                type="button"
                onClick={() => setUserFilter('MINE')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                  userFilter === 'MINE'
                    ? 'bg-white text-teal-800 border border-slate-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Audits Only
              </button>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-white text-teal-800 border border-slate-200 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Switch to Data Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'GRID'
                  ? 'bg-white text-teal-800 border border-slate-200 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Switch to Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Table View or Grid View */}
      {filteredCalculations.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-xs">
          <FolderArchive className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No saved trade calculations found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Calculations executed in the Landed Cost Engine will automatically appear here for audit, export, and scenario comparison.
          </p>
          {onNavigateToCalculator && (
            <button
              onClick={onNavigateToCalculator}
              className="mt-4 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Launch Cost Engine</span>
            </button>
          )}
        </div>
      ) : viewMode === 'TABLE' ? (
        /* PROFESSIONAL CORPORATE DATABASE TABLE */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">PO / Reference</th>
                  <th className="py-3 px-3">Term</th>
                  <th className="py-3 px-4">Route & Mode</th>
                  <th className="py-3 px-4 text-right">Seller Quote</th>
                  <th className="py-3 px-4 text-right">Buyer TLC</th>
                  <th className="py-3 px-4 text-right">Customs Duty</th>
                  <th className="py-3 px-4">Author / User</th>
                  <th className="py-3 px-3">Saved Date</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredCalculations.map((calc) => {
                  const { metadata, sellerTotal, totalLandedCost, importDutyAmount } = calc;
                  const isPendingDelete = confirmDeleteId === metadata.id;

                  return (
                    <tr
                      key={metadata.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* PO / Reference & Commodity */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="font-bold text-slate-900 group-hover:text-teal-900 truncate max-w-[200px]">
                          {metadata.title}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {metadata.referenceNo} • {metadata.commodity || 'General Cargo'}
                        </div>
                      </td>

                      {/* Term Badge */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold text-teal-800 bg-teal-50 border border-teal-200">
                          {metadata.incotermCode}
                        </span>
                      </td>

                      {/* Route & Mode */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-semibold truncate max-w-[190px]">
                          {metadata.originPort || 'Origin'} → {metadata.destinationPort || 'Destination'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {metadata.freightMode.replace('_', ' ')}
                        </div>
                      </td>

                      {/* Seller Commercial Quote */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                        {formatCurrency(sellerTotal, currentCurrency, true, rates)}
                      </td>

                      {/* Buyer Total Landed Cost */}
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-teal-800 whitespace-nowrap">
                        {formatCurrency(totalLandedCost, currentCurrency, true, rates)}
                      </td>

                      {/* Customs Duty */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatCurrency(importDutyAmount, currentCurrency, true, rates)}
                      </td>

                      {/* Author / User */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">
                            {metadata.userName ? metadata.userName.charAt(0) : 'U'}
                          </div>
                          <div className="truncate max-w-[130px]">
                            <div className="text-[11px] font-medium text-slate-800 truncate">
                              {metadata.userName || 'Analyst'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {metadata.userEmail || 'Local'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(metadata.savedAt || metadata.updatedAt || metadata.createdAt).toLocaleDateString()}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-center">
                        {isPendingDelete ? (
                          <div className="flex items-center justify-center space-x-1.5 animate-in fade-in">
                            <button
                              onClick={() => handleDeleteRecord(metadata.id)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => onLoadIntoCalculator(calc)}
                              className="p-1.5 text-teal-700 hover:text-white hover:bg-teal-700 border border-transparent hover:border-teal-800 rounded-lg transition-colors cursor-pointer"
                              title="Reload into Landed Cost Engine"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onOpenReportModal(calc)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Print PDF Compliance Dossier"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => exportSingleDossier(metadata.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Export Record JSON"
                            >
                              <FileJson className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => duplicateCalculation(metadata.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Duplicate Record"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(metadata.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCalculations.map((calc) => {
            const { metadata, sellerTotal, totalLandedCost, importDutyAmount } = calc;
            const isPendingDelete = confirmDeleteId === metadata.id;

            return (
              <div
                key={metadata.id}
                className="flex flex-col bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-2xl p-5 transition-colors shadow-xs"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center font-mono font-extrabold text-teal-800 text-sm">
                      {metadata.incotermCode}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {metadata.title}
                      </h3>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-500">
                          {metadata.referenceNo}
                        </span>
                        <span className="text-slate-300 text-[10px]">•</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {metadata.freightMode.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {new Date(metadata.savedAt || metadata.updatedAt || metadata.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Route specs */}
                <div className="grid grid-cols-2 gap-2 text-xs my-3 py-2 px-3 bg-[#f8fafc] rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Origin:</span>
                    <span className="text-slate-800 font-semibold truncate block">
                      {metadata.originPort || 'Origin'} ({metadata.originCountry || 'INTL'})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Destination:</span>
                    <span className="text-slate-800 font-semibold truncate block">
                      {metadata.destinationPort || 'Destination'} ({metadata.destinationCountry || 'INTL'})
                    </span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 bg-[#f8fafc] rounded-xl border border-slate-200 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Seller Quote:</span>
                    <span className="text-sm font-mono font-bold text-slate-800">
                      {formatCurrency(sellerTotal, currentCurrency, true, rates)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Buyer Landed Cost:</span>
                    <span className="text-sm font-mono font-extrabold text-teal-800">
                      {formatCurrency(totalLandedCost, currentCurrency, true, rates)}
                    </span>
                  </div>
                </div>

                {/* Card Footer with User badge & Actions */}
                <div className="flex items-center justify-between pt-2 mt-auto border-t border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                      {metadata.userName ? metadata.userName.charAt(0) : 'U'}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                      {metadata.userEmail || 'Local'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {isPendingDelete ? (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleDeleteRecord(metadata.id)}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-[10px] font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => duplicateCalculation(metadata.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Duplicate calculation"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => exportSingleDossier(metadata.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Export JSON"
                        >
                          <FileJson className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenReportModal(calc)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Print PDF Summary Sheet"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(metadata.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onLoadIntoCalculator(calc)}
                          className="py-1 px-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1 transition-colors border border-teal-800 cursor-pointer shadow-2xs ml-1"
                        >
                          <span>Load</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
