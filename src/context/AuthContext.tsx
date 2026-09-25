import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CurrencyCode, UserProfile } from '../types/trade';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithGoogle: (email?: string, name?: string) => Promise<void>;
  requestPhoneOtp: (phone: string, countryCode: string) => Promise<{ success: boolean; simulatedOtp: string }>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<boolean>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setPreferredCurrency: (curr: CurrencyCode) => void;
  signOut: () => void;
}

const STORAGE_KEY = 'incoterms_user_session_v2';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch {
      return null;
    }
  });

  // Modal starts closed so the user has immediate access to the app
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Sync user state to persistent storage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to sync auth state to localStorage', e);
    }
  }, [user]);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const signInWithGoogle = async (
    email: string = 'bolteb905@gmail.com',
    name: string = 'Global Trade Director'
  ) => {
    // Simulated realistic secure Google Auth handshake
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newUser: UserProfile = {
      id: `usr_google_${Date.now().toString(36)}`,
      email: email.trim() || 'bolteb905@gmail.com',
      fullName: name.trim() || 'Global Trade Director',
      companyName: 'Apex Continental Freight & Supply Corp',
      companyRole: 'FREIGHT_FORWARDER',
      preferredCurrency: user?.preferredCurrency || 'USD',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}&backgroundColor=0f766e,1e293b`,
      authMethod: 'GOOGLE',
      createdAt: new Date().toISOString(),
    };

    setUser(newUser);
    closeAuthModal();
  };

  const requestPhoneOtp = async (phone: string, countryCode: string) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    // Deterministic 6-digit cryptographic authentication token for reliable simulation
    const simulatedOtp = '849201';
    return { success: true, simulatedOtp };
  };

  const verifyPhoneOtp = async (phone: string, otp: string) => {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const cleanOtp = otp.trim();
    if (cleanOtp === '849201' || (cleanOtp.length === 6 && /^\d+$/.test(cleanOtp))) {
      const newUser: UserProfile = {
        id: `usr_phone_${Date.now().toString(36)}`,
        phoneNumber: phone,
        fullName: 'Trade Compliance Officer',
        companyName: 'Trans-Oceanic Supply Chain Partners',
        companyRole: 'IMPORTER',
        preferredCurrency: user?.preferredCurrency || 'USD',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(phone)}&backgroundColor=0f766e,0f172a`,
        authMethod: 'PHONE_OTP',
        createdAt: new Date().toISOString(),
      };
      setUser(newUser);
      closeAuthModal();
      return true;
    }
    return false;
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  };

  const setPreferredCurrency = (curr: CurrencyCode) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, preferredCurrency: curr };
    });
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        requestPhoneOtp,
        verifyPhoneOtp,
        updateProfile,
        setPreferredCurrency,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
