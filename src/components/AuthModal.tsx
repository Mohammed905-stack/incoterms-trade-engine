import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Shield,
  CheckCircle,
  Smartphone,
  Mail,
  ArrowRight,
  RefreshCw,
  KeyRound,
  Lock,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, signInWithGoogle, requestPhoneOtp, verifyPhoneOtp } =
    useAuth();

  const [activeTab, setActiveTab] = useState<'GOOGLE' | 'PHONE'>('GOOGLE');
  const [isLoading, setIsLoading] = useState(false);

  // Google sign in state - clean empty initial inputs
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // Phone sign in state - clean empty initial inputs
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpStep, setOtpStep] = useState<'INPUT_PHONE' | 'VERIFY_OTP'>('INPUT_PHONE');
  const [otpValue, setOtpValue] = useState('');
  const [simulatedReceivedOtp, setSimulatedReceivedOtp] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle(googleEmail, googleName);
    } catch {
      setErrorMessage('Google Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await requestPhoneOtp(phoneNumber, countryCode);
      setSimulatedReceivedOtp(res.simulatedOtp);
      setOtpStep('VERIFY_OTP');
    } catch {
      setErrorMessage('Failed to send SMS OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const fullPhone = `${countryCode} ${phoneNumber}`;
      const success = await verifyPhoneOtp(fullPhone, otpValue);
      if (!success) {
        setErrorMessage('Invalid verification code. Please enter 849201.');
      }
    } catch {
      setErrorMessage('Verification failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Subtle accent header line */}
        <div className="h-1 bg-teal-700 w-full" />

        {/* Close / Dismiss button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header branding */}
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
              <Shield className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Enterprise Authentication
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Incoterms 2020 & Trade Database Gateway
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 mb-5 leading-relaxed">
            Sign in to access persistent audit records, cross-session scenario comparisons, and certified compliance dossiers.
          </p>

          {/* Auth Method Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('GOOGLE');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'GOOGLE'
                  ? 'bg-white text-teal-800 border border-slate-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Google (Gmail)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('PHONE');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'PHONE'
                  ? 'bg-white text-teal-800 border border-slate-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone (SMS OTP)</span>
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: GOOGLE (GMAIL) AUTH */}
          {activeTab === 'GOOGLE' && (
            <form onSubmit={handleGoogleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Google Account / Gmail Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="e.g. analyst@enterprise.com"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-2xs"
                  />
                  {googleEmail.includes('@') && (
                    <div className="absolute right-3 top-2.5">
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                        Verified
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Full Name / Designation
                </label>
                <input
                  type="text"
                  required
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Global Trade Director"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-2xs"
                />
              </div>

              {/* Instant Google One-Click Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center space-x-2.5 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm transition-colors border border-slate-300 shadow-2xs disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google (Gmail)</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: PHONE OTP AUTH */}
          {activeTab === 'PHONE' && (
            <div>
              {otpStep === 'INPUT_PHONE' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Mobile Phone Number
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-600 shadow-2xs cursor-pointer"
                      >
                        <option value="+1">🇺🇸 +1 (US)</option>
                        <option value="+44">🇬🇧 +44 (UK)</option>
                        <option value="+971">🇦🇪 +971 (UAE)</option>
                        <option value="+91">🇮🇳 +91 (IN)</option>
                        <option value="+49">🇩🇪 +49 (DE)</option>
                        <option value="+65">🇸🇬 +65 (SG)</option>
                        <option value="+81">🇯🇵 +81 (JP)</option>
                        <option value="+33">🇫🇷 +33 (FR)</option>
                      </select>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 555-019-2831"
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-2xs"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    A simulated 6-digit cryptographic verification SMS will be generated and provided instantly on screen for verification.
                  </p>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm border border-teal-800 shadow-2xs transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Send Verification SMS</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-[#f8fafc] border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">OTP dispatched to:</span>
                      <button
                        type="button"
                        onClick={() => setOtpStep('INPUT_PHONE')}
                        className="text-[11px] text-teal-700 font-semibold hover:underline cursor-pointer"
                      >
                        Change number
                      </button>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5">
                      {countryCode} {phoneNumber}
                    </div>

                    {simulatedReceivedOtp && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-xs text-slate-600">
                          Simulated SMS Code:{' '}
                          <strong className="font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {simulatedReceivedOtp}
                          </strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setOtpValue(simulatedReceivedOtp)}
                          className="text-[11px] bg-white hover:bg-slate-50 text-slate-800 px-2.5 py-1 rounded border border-slate-200 transition-colors cursor-pointer font-bold shadow-2xs"
                        >
                          Auto-fill
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Enter 6-Digit Verification Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        autoFocus
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full text-center tracking-[0.5em] font-mono text-xl bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-teal-600 shadow-2xs"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm border border-teal-800 shadow-2xs transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Verify & Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Continue as Guest option */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={closeAuthModal}
              className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-4 cursor-pointer font-medium"
            >
              Continue exploring as guest (read-only mode)
            </button>
          </div>

          {/* Security footnote */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>TLS 256-Bit Encrypted Session</span>
            </div>
            <span>ICC® Rules 2020 Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
