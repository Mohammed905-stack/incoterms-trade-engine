import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { SavedCalculationsProvider } from './context/SavedCalculationsContext';
import { Navbar, ActiveNavTab } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { IncotermsMatrix } from './components/matrix/IncotermsMatrix';
import { LandedCostCalculator } from './components/calculator/LandedCostCalculator';
import { ScenarioComparator } from './components/calculator/ScenarioComparator';
import { ComplianceAdvisory } from './components/compliance/ComplianceAdvisory';
import { SavedShipmentsWorkspace } from './components/history/SavedShipmentsWorkspace';
import { PrintableReportModal } from './components/export/PrintableReportModal';
import { CalculationResult } from './types/trade';
import { Compass, ShieldCheck } from 'lucide-react';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('matrix');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Cross-component communication state
  const [calcIncoterm, setCalcIncoterm] = useState<string>('FCA');
  const [activeLoadedCalc, setActiveLoadedCalc] = useState<CalculationResult | null>(null);
  const [comparatorTerms, setComparatorTerms] = useState<{ codeA: string; codeB: string }>({
    codeA: 'FOB',
    codeB: 'CIF',
  });
  const [activeReportCalc, setActiveReportCalc] = useState<CalculationResult | null>(null);

  const handleSelectForCalculation = (code: string) => {
    setCalcIncoterm(code);
    setActiveLoadedCalc(null);
    setActiveTab('calculator');
  };

  const handleCompareTerm = (code: string) => {
    setComparatorTerms((prev) => ({
      codeA: code,
      codeB: code === 'FOB' ? 'CIF' : code === 'EXW' ? 'DDP' : 'FCA',
    }));
    setActiveTab('comparator');
  };

  const handleOpenComparatorWithTerms = (codeA: string, codeB?: string) => {
    setComparatorTerms({
      codeA,
      codeB: codeB || (codeA === 'FOB' ? 'CIF' : codeA === 'EXW' ? 'DDP' : 'FCA'),
    });
    setActiveTab('comparator');
  };

  const handleLoadSavedCalcIntoEngine = (calc: CalculationResult) => {
    setCalcIncoterm(calc.metadata.incotermCode);
    setActiveLoadedCalc(calc);
    setActiveTab('calculator');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 flex flex-col font-sans">
      {/* Top Enterprise Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className={activeTab === 'matrix' ? 'block' : 'hidden'}>
          <IncotermsMatrix
            onSelectForCalculation={handleSelectForCalculation}
            onCompareTerm={handleCompareTerm}
          />
        </div>

        <div className={activeTab === 'calculator' ? 'block' : 'hidden'}>
          <LandedCostCalculator
            initialIncoterm={calcIncoterm}
            loadedCalculation={activeLoadedCalc}
            onOpenReportModal={(calc) => setActiveReportCalc(calc)}
            onOpenComparator={handleOpenComparatorWithTerms}
          />
        </div>

        <div className={activeTab === 'comparator' ? 'block' : 'hidden'}>
          <ScenarioComparator
            initialTermA={comparatorTerms.codeA}
            initialTermB={comparatorTerms.codeB}
            onSelectTermForCalc={handleSelectForCalculation}
          />
        </div>

        <div className={activeTab === 'compliance' ? 'block' : 'hidden'}>
          <ComplianceAdvisory initialIncoterm={calcIncoterm} />
        </div>

        <div className={activeTab === 'workspace' ? 'block' : 'hidden'}>
          <SavedShipmentsWorkspace
            onLoadIntoCalculator={handleLoadSavedCalcIntoEngine}
            onOpenReportModal={(calc) => setActiveReportCalc(calc)}
            onNavigateToCalculator={() => {
              setActiveLoadedCalc(null);
              setActiveTab('calculator');
            }}
          />
        </div>
      </main>

      {/* Professional Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <Compass className="w-5 h-5 text-teal-700" />
            <span className="font-bold text-slate-900 tracking-tight">
              Incoterms 2020 & Global Trade Cost Engine
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium">Enterprise Edition</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px] text-slate-500">
            <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>ICC® 2020 Rules Compliant</span>
            </div>
            <span>12 Global Currencies • Live FX Rates</span>
            <span>WTO Valuation Standards</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal />
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <PrintableReportModal
        calculation={activeReportCalc}
        onClose={() => setActiveReportCalc(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <SavedCalculationsProvider>
          <MainApp />
        </SavedCalculationsProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
