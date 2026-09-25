import { CalculationResult, ShipmentCostInputs, ShipmentMetadata, UserProfile } from '../types/trade';
import { calculateLandedCost } from '../utils/calculator';

const DB_STORAGE_KEY = 'incoterms_enterprise_trade_db_v1';
const LEGACY_STORAGE_KEY = 'incoterms_saved_calculations_v2';

export class TradeDatabaseService {
  /**
   * Retrieves all saved calculations from the persistent store.
   * Starts completely empty for fresh or new sessions.
   */
  public static getAllCalculations(): CalculationResult[] {
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Clean out any legacy mock dummy records
          const realRecords = parsed.filter(
            (r) =>
              r &&
              r.metadata &&
              r.metadata.id !== 'audit_rec_fca_801' &&
              r.metadata.id !== 'audit_rec_cif_902' &&
              r.metadata.referenceNo !== 'PO-2026-FCA-4491' &&
              r.metadata.referenceNo !== 'PO-2026-CIF-9102'
          );
          if (realRecords.length !== parsed.length) {
            localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(realRecords));
          }
          return realRecords;
        }
      }

      // Check legacy key if present
      const legacyStored = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyStored) {
        const parsedLegacy = JSON.parse(legacyStored);
        if (Array.isArray(parsedLegacy)) {
          const realRecords = parsedLegacy.filter(
            (r) =>
              r &&
              r.metadata &&
              r.metadata.id !== 'audit_rec_fca_801' &&
              r.metadata.id !== 'audit_rec_cif_902' &&
              r.metadata.referenceNo !== 'PO-2026-FCA-4491' &&
              r.metadata.referenceNo !== 'PO-2026-CIF-9102'
          );
          localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(realRecords));
          return realRecords;
        }
      }

      return [];
    } catch (err) {
      console.error('Error reading from trade database:', err);
      return [];
    }
  }

  /**
   * Saves or updates a calculation in the persistent store
   */
  public static saveCalculation(
    calc: CalculationResult,
    user: UserProfile | null
  ): CalculationResult {
    const records = this.getAllCalculations();
    const nowIso = new Date().toISOString();

    const existingIndex = records.findIndex((r) => r.metadata.id === calc.metadata.id);

    const enrichedCalculation: CalculationResult = {
      ...calc,
      metadata: {
        ...calc.metadata,
        userId: user?.id || calc.metadata.userId || 'guest_user',
        userEmail: user?.email || user?.phoneNumber || calc.metadata.userEmail || 'guest@enterprise.local',
        userName: user?.fullName || calc.metadata.userName || 'Trade Analyst',
        updatedAt: nowIso,
        savedAt: nowIso,
      },
    };

    let updatedRecords: CalculationResult[];
    if (existingIndex >= 0) {
      updatedRecords = [...records];
      updatedRecords[existingIndex] = enrichedCalculation;
    } else {
      updatedRecords = [enrichedCalculation, ...records];
    }

    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(updatedRecords));
    } catch (err) {
      console.error('Error saving calculation to trade database:', err);
    }

    return enrichedCalculation;
  }

  /**
   * Deletes a calculation from the store by ID
   */
  public static deleteCalculation(id: string): boolean {
    const records = this.getAllCalculations();
    const filtered = records.filter((r) => r.metadata.id !== id);

    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (err) {
      console.error('Error deleting calculation from trade database:', err);
      return false;
    }
  }

  /**
   * Duplicates a calculation with a new unique reference
   */
  public static duplicateCalculation(
    id: string,
    user: UserProfile | null
  ): CalculationResult | undefined {
    const records = this.getAllCalculations();
    const source = records.find((r) => r.metadata.id === id);
    if (!source) return undefined;

    const newId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const duplicated: CalculationResult = {
      ...source,
      metadata: {
        ...source.metadata,
        id: newId,
        referenceNo: `${source.metadata.referenceNo}-REV`,
        title: `${source.metadata.title} (Revision)`,
        userId: user?.id || source.metadata.userId,
        userEmail: user?.email || user?.phoneNumber || source.metadata.userEmail,
        userName: user?.fullName || source.metadata.userName,
        createdAt: nowIso,
        updatedAt: nowIso,
        savedAt: nowIso,
      },
    };

    const updatedRecords = [duplicated, ...records];
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(updatedRecords));
    } catch (err) {
      console.error('Error persisting duplicated calculation:', err);
    }

    return duplicated;
  }

  /**
   * Export a single calculation dossier as JSON
   */
  public static exportSingleDossier(calc: CalculationResult): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(calc, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    const safeRef = calc.metadata.referenceNo.replace(/[^a-zA-Z0-9_-]/g, '_');
    anchor.setAttribute('download', `trade_audit_${safeRef}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  /**
   * Export all database records as enterprise backup JSON
   */
  public static exportAllRecords(records: CalculationResult[]): void {
    const payload = {
      exportVersion: '2.0',
      exportDate: new Date().toISOString(),
      recordCount: records.length,
      records,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `enterprise_trade_audits_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  /**
   * Imports calculation records from JSON
   */
  public static importFromJson(jsonStr: string): { success: boolean; count: number } {
    try {
      const parsed = JSON.parse(jsonStr);
      let itemsToImport: CalculationResult[] = [];

      if (Array.isArray(parsed)) {
        itemsToImport = parsed;
      } else if (parsed && Array.isArray(parsed.records)) {
        itemsToImport = parsed.records;
      }

      if (itemsToImport.length > 0) {
        const existing = this.getAllCalculations();
        const existingIds = new Set(existing.map((e) => e.metadata.id));
        const merged = [...itemsToImport.filter((item) => !existingIds.has(item.metadata.id)), ...existing];

        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(merged));
        return { success: true, count: itemsToImport.length };
      }
      return { success: false, count: 0 };
    } catch (err) {
      console.error('Error importing JSON into trade database:', err);
      return { success: false, count: 0 };
    }
  }

  /**
   * Resets database to empty state
   */
  public static clearDatabase(): void {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify([]));
  }
}
