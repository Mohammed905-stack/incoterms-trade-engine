import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSavedCalculations } from '../context/SavedCalculationsContext';
import { CurrencyCode } from '../types/trade';
import { CURRENCIES, PRIMARY_CURRENCY_CODES } from '../utils/currencies';
import { X, Building2, User, Globe, Shield, LogOut, Check, ArrowRight, Database, Lock } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, signOut, openAuthModal } = useAuth();
  const { userCalculations } = useSavedCalculations();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [companyRole, setCompanyRole] = useState(user?.companyRole || 'FREIGHT_FORWARDER');
  const [currency, setCurrency] = useState<CurrencyCode>(user?.preferredCurrency || 'USD');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName,
      companyName,
      companyRole: companyRole as any,
      preferredCurrency: currency,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleSignOut = () => {
    signOut();
    onClose();
  };

  const handleSwitchAccount = () => {
    onClose();
    openAuthModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 bg-teal-700 w-full" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 text-xl font-bold shadow-2xs">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{user.fullName}</h3>
              <p className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                <span>{user.email || user.phoneNumber}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-slate-600 font-medium">
                  {user.authMethod === 'GOOGLE' ? 'Google Authenticated' : 'Phone Verified'}
                </span>
              </p>
            </div>
          </div>

          {/* Database Metrics Card */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#f8fafc] border border-slate-200 rounded-xl mb-6">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-teal-700 shadow-2xs">
                <Database className="w-4 h-4 text-teal-700" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Database Records
                </span>
                <span className="text-xs font-bold font-mono text-slate-900">
                  {userCalculations.length} saved audits
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-emerald-700 shadow-2xs">
                <Lock className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Persistence
                </span>
                <span className="text-xs font-bold font-mono text-emerald-800">
                  Encrypted Session
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Full Name / Designation</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-600 shadow-2xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Company / Organization</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-600 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Trade Supply Role</span>
                </label>
                <select
                  value={companyRole}
                  onChange={(e) => setCompanyRole(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-600 cursor-pointer shadow-2xs"
                >
                  <option value="EXPORTER" className="bg-white text-slate-900">Manufacturer / Exporter</option>
                  <option value="IMPORTER" className="bg-white text-slate-900">Buyer / Importer</option>
                  <option value="FREIGHT_FORWARDER" className="bg-white text-slate-900">Freight Forwarder / 3PL</option>
                  <option value="CUSTOMS_BROKER" className="bg-white text-slate-900">Licensed Customs Broker</option>
                  <option value="TRADE_FINANCE" className="bg-white text-slate-900">Trade Finance / Banking</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Default Base Currency Preference</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PRIMARY_CURRENCY_CODES.map((currCode) => {
                  const cfg = CURRENCIES[currCode];
                  const isSelected = currency === currCode;
                  return (
                    <button
                      type="button"
                      key={currCode}
                      onClick={() => setCurrency(currCode)}
                      className={`p-2 rounded-xl border text-center transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-teal-700 border-teal-700 text-white font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <div className="text-sm">{cfg.flag}</div>
                      <div className="text-xs font-mono font-bold mt-0.5">{cfg.code}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Switch Account
                </button>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl border border-teal-700 shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <span>Save Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
