export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CNY'
  | 'INR'
  | 'AED'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'SGD'
  | 'CHF'
  | 'HKD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  rateToUSD: number; // 1 USD = X Currency
  locale: string;
}

export type TransportMode = 'ANY_MODE' | 'SEA_INLAND_WATERWAY';

export type SupplyChainLegKey =
  | 'packaging'
  | 'pre_carriage'
  | 'export_clearance'
  | 'origin_thc'
  | 'main_carriage'
  | 'marine_insurance'
  | 'destination_thc'
  | 'import_clearance'
  | 'on_carriage'
  | 'unloading';

export type PartyObligation = 'SELLER' | 'BUYER' | 'NEGOTIABLE';

export interface SupplyChainLeg {
  id: SupplyChainLegKey;
  name: string;
  shortName: string;
  category: 'origin' | 'transit' | 'destination';
  description: string;
  iconName: string;
}

export interface IncotermDefinition {
  code: string; // EXW, FCA, CPT, CIP, DAP, DPU, DDP, FAS, FOB, CFR, CIF
  name: string;
  transportMode: TransportMode;
  tagline: string;
  summary: string;
  namedPlaceRule: string; // e.g., "Named Place of Delivery (Seller's Factory/Warehouse)"
  riskTransferPoint: string;
  costTransferPoint: string;
  insuranceRequirement: string;
  insuranceLevel: 'NONE_MANDATED' | 'ICC_C_MINIMAL' | 'ICC_A_MAXIMAL';
  exportCustomsParty: PartyObligation;
  importCustomsParty: PartyObligation;
  costs: Record<SupplyChainLegKey, PartyObligation>;
  risks: Record<SupplyChainLegKey, PartyObligation>;
  key2020Changes: string;
  bestUsedFor: string[];
  cautions: string[];
  exampleUse: string;
}

export interface CostBreakdownItem {
  id: SupplyChainLegKey | 'base_cargo' | 'import_tariffs' | 'import_vat';
  label: string;
  description: string;
  amountUSD: number;
  borneBy: PartyObligation;
  category: 'origin' | 'transit' | 'destination' | 'cargo' | 'taxes';
}

export interface ShipmentCostInputs {
  // Cargo base
  cargoValue: number;
  currency: CurrencyCode;
  
  // Origin legs
  packagingCost: number;
  preCarriageCost: number; // origin trucking
  exportClearanceCost: number; // export customs & docs
  originThcCost: number; // origin terminal handling

  // International transit
  mainCarriageFreight: number; // ocean / air / rail
  insuranceRatePercent: number; // e.g. 0.35%
  insuranceMinimum: number;

  // Destination legs
  destinationThcCost: number; // DTHC port handling
  importClearanceCost?: number; // Destination customs brokerage & entry filing
  importDutyTariffPercent: number; // e.g. 6.5% customs duty
  importVatPercent: number; // e.g. 19% or 5% or 18%
  onCarriageCost: number; // inland trucking to buyer site
  unloadingCost: number; // destination unloading at dock/warehouse
}

export interface ShipmentMetadata {
  id: string;
  referenceNo: string;
  title: string;
  originCountry: string;
  originPort: string;
  destinationCountry: string;
  destinationPort: string;
  freightMode: 'OCEAN_FCL' | 'OCEAN_LCL' | 'AIR_FREIGHT' | 'ROAD_RAIL';
  commodity: string;
  hsCode: string;
  incotermCode: string;
  notes?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  savedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalculationResult {
  metadata: ShipmentMetadata;
  inputs: ShipmentCostInputs;
  currency: CurrencyCode;
  items: CostBreakdownItem[];
  sellerTotal: number;
  buyerTotal: number;
  totalLandedCost: number;
  customsDutiableValue: number; // CIF/CIP or FOB depending on jurisdiction
  importDutyAmount: number;
  importVatAmount: number;
  sellerRiskPercentage: number;
  buyerRiskPercentage: number;
}

export interface TradeDocument {
  id: string;
  name: string;
  code: string;
  category: 'COMMERCIAL' | 'TRANSPORT' | 'CUSTOMS' | 'INSURANCE' | 'REGULATORY';
  procuredBy: 'SELLER' | 'BUYER' | 'CARRIER';
  description: string;
  purpose: string;
  timing: string;
  requiredForIncoterms: string[]; // ['ALL'] or specific codes
  riskNotes: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  phoneNumber?: string;
  fullName: string;
  companyName: string;
  companyRole: 'EXPORTER' | 'IMPORTER' | 'FREIGHT_FORWARDER' | 'CUSTOMS_BROKER' | 'TRADE_FINANCE';
  preferredCurrency: CurrencyCode;
  avatarUrl?: string;
  authMethod: 'GOOGLE' | 'PHONE_OTP';
  createdAt: string;
}
