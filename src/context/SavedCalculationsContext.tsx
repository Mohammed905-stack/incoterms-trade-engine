import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CalculationResult } from '../types/trade';
import { TradeDatabaseService } from '../services/tradeDatabase';
import { useAuth } from './AuthContext';

interface SavedCalculationsContextType {
  savedCalculations: CalculationResult[];
  userCalculations: CalculationResult[];
  saveCalculation: (calc: CalculationResult) => CalculationResult;
  deleteCalculation: (id: string) => boolean;
  duplicateCalculation: (id: string) => CalculationResult | undefined;
  getCalculationById: (id: string) => CalculationResult | undefined;
  exportAllAsJson: () => void;
  exportSingleDossier: (id: string) => void;
  importCalculationsFromJson: (jsonStr: string) => { success: boolean; count: number };
  clearAllCalculations: () => void;
  refreshFromDatabase: () => void;
}

const SavedCalculationsContext = createContext<SavedCalculationsContextType | undefined>(undefined);

export const SavedCalculationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [savedCalculations, setSavedCalculations] = useState<CalculationResult[]>(() => {
    return TradeDatabaseService.getAllCalculations();
  });

  const refreshFromDatabase = useCallback(() => {
    const fresh = TradeDatabaseService.getAllCalculations();
    setSavedCalculations(fresh);
  }, []);

  // Listen to cross-tab storage changes if needed
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'incoterms_enterprise_trade_db_v1') {
        refreshFromDatabase();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshFromDatabase]);

  const saveCalculation = useCallback(
    (calc: CalculationResult): CalculationResult => {
      const saved = TradeDatabaseService.saveCalculation(calc, user);
      setSavedCalculations(TradeDatabaseService.getAllCalculations());
      return saved;
    },
    [user]
  );

  const deleteCalculation = useCallback((id: string): boolean => {
    const success = TradeDatabaseService.deleteCalculation(id);
    if (success) {
      setSavedCalculations(TradeDatabaseService.getAllCalculations());
    }
    return success;
  }, []);

  const duplicateCalculation = useCallback(
    (id: string): CalculationResult | undefined => {
      const duplicated = TradeDatabaseService.duplicateCalculation(id, user);
      if (duplicated) {
        setSavedCalculations(TradeDatabaseService.getAllCalculations());
      }
      return duplicated;
    },
    [user]
  );

  const getCalculationById = useCallback(
    (id: string): CalculationResult | undefined => {
      return savedCalculations.find((item) => item.metadata.id === id);
    },
    [savedCalculations]
  );

  const exportAllAsJson = useCallback(() => {
    TradeDatabaseService.exportAllRecords(savedCalculations);
  }, [savedCalculations]);

  const exportSingleDossier = useCallback(
    (id: string) => {
      const target = savedCalculations.find((c) => c.metadata.id === id);
      if (target) {
        TradeDatabaseService.exportSingleDossier(target);
      }
    },
    [savedCalculations]
  );

  const importCalculationsFromJson = useCallback(
    (jsonStr: string) => {
      const res = TradeDatabaseService.importFromJson(jsonStr);
      if (res.success) {
        setSavedCalculations(TradeDatabaseService.getAllCalculations());
      }
      return res;
    },
    []
  );

  const clearAllCalculations = useCallback(() => {
    TradeDatabaseService.clearDatabase();
    setSavedCalculations([]);
  }, []);

  // Calculations belonging to the active user (or all if not logged in or matching email/id)
  const userCalculations = user
    ? savedCalculations.filter(
        (c) =>
          c.metadata.userId === user.id ||
          (user.email && c.metadata.userEmail === user.email) ||
          (user.phoneNumber && c.metadata.userEmail === user.phoneNumber)
      )
    : savedCalculations;

  return (
    <SavedCalculationsContext.Provider
      value={{
        savedCalculations,
        userCalculations,
        saveCalculation,
        deleteCalculation,
        duplicateCalculation,
        getCalculationById,
        exportAllAsJson,
        exportSingleDossier,
        importCalculationsFromJson,
        clearAllCalculations,
        refreshFromDatabase,
      }}
    >
      {children}
    </SavedCalculationsContext.Provider>
  );
};

export const useSavedCalculations = (): SavedCalculationsContextType => {
  const context = useContext(SavedCalculationsContext);
  if (!context) {
    throw new Error('useSavedCalculations must be used within a SavedCalculationsProvider');
  }
  return context;
};
