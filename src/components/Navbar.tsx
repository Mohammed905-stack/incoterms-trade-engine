import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { CurrencyCode } from '../types/trade';
import { CURRENCIES } from '../utils/currencies';
import {
  Compass,
  Calculator,
  GitCompare,
  FileCheck2,
  FolderArchive,
  User,
  ChevronDown,
  Layers,
} from 'lucide-react';

export type ActiveNavTab = 'matrix' | 'calculator' | 'comparator' | 'compliance' | 'workspace';

// 5 clean global currencies requested for production
const NAV_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'INR', 'AED', 'GBP'];

interface NavbarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenProfile,
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { selectedCurrency, setSelectedCurrency, isLive } = useCurrency();

  const navItems: {
    id: ActiveNavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'matrix', label: 'Incoterms Matrix', icon: Layers },
    { id: 'calculator', label: 'Cost Engine', icon: Calculator },
    { id: 'comparator', label: 'Scenario Compare', icon: GitCompare },
    { id: 'compliance', label: 'Compliance Docs', icon: FileCheck2 },
    { id: 'workspace', label: 'Trade Audits', icon: FolderArchive },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('matrix')}>
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
              <Compass className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                  Incoterms <span className="text-teal-700">2020</span>
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded">
                  ICC Global Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Global Trade Landed Cost & Risk Advisory
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs for Desktop */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-teal-700 text-white border border-teal-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Sleek Currency Switcher & User Profile */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Sleek, standard currency dropdown selector */}
            <div className="relative flex items-center">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
                aria-label="Select global working currency"
                className="appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-3 pr-8 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-teal-600 cursor-pointer shadow-2xs transition-colors"
              >
                {NAV_CURRENCIES.map((code) => (
                  <option key={code} value={code} className="bg-white text-slate-800 font-mono font-medium">
                    {code} ({CURRENCIES[code]?.symbol || code})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              {isLive && (
                <span
                  className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5 ring-2 ring-white"
                  title="Live interbank FX market feed active"
                />
              )}
            </div>

            {/* Profile or Sign In */}
            {isAuthenticated && user ? (
              <button
                onClick={onOpenProfile}
                className="flex items-center space-x-2.5 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer group shadow-2xs"
                title="Manage user profile, active session, and preferences"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-700 border border-teal-800 flex items-center justify-center text-xs font-bold text-white shadow-2xs shrink-0">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block max-w-[190px]">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900 leading-tight truncate">
                    {user.fullName}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono leading-tight truncate">
                    {user.email || user.phoneNumber || 'Authenticated User'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0 ml-0.5" />
              </button>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center space-x-2 py-2 px-3.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl border border-teal-800 transition-colors cursor-pointer shadow-2xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex lg:hidden overflow-x-auto py-2.5 space-x-1 border-t border-slate-200 -mx-4 px-4 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 text-white border border-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
