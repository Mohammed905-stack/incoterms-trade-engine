import { ShipmentCostInputs, ShipmentMetadata } from '../types/trade';

export interface PresetShipment {
  id: string;
  category: string;
  name: string;
  description: string;
  metadata: ShipmentMetadata;
  inputs: ShipmentCostInputs;
}

export const PRESET_SHIPMENTS: PresetShipment[] = [
  {
    id: 'preset_machinery_de_us',
    category: 'Ocean Freight (FCL)',
    name: 'Precision CNC Milling Equipment (Germany to USA)',
    description: 'High-value industrial machinery shipped 40ft High-Cube container from Hamburg to Port of New York & New Jersey.',
    metadata: {
      id: 'preset_machinery_de_us',
      referenceNo: 'EXP-2026-DE8812',
      title: 'Precision CNC Milling Equipment',
      originCountry: 'Germany',
      originPort: 'Port of Hamburg',
      destinationCountry: 'United States',
      destinationPort: 'Port of New York / Newark (NY/NJ)',
      freightMode: 'OCEAN_FCL',
      commodity: '8457.10 - Machining Centers for Working Metal',
      hsCode: '8457.10.00',
      incotermCode: 'FCA',
      notes: 'Contains sensitive optical encoders. Requires seaworthy moisture-barrier crating and shock sensors.',
      createdAt: '2026-09-15T08:30:00Z',
      updatedAt: '2026-09-15T08:30:00Z',
    },
    inputs: {
      cargoValue: 185000,
      currency: 'USD',
      packagingCost: 3200,
      preCarriageCost: 1450,
      exportClearanceCost: 480,
      originThcCost: 650,
      mainCarriageFreight: 4200,
      insuranceRatePercent: 0.35,
      insuranceMinimum: 250,
      destinationThcCost: 780,
      importDutyTariffPercent: 4.2, // US HSN tariff for machine tools
      importVatPercent: 0, // No federal VAT in US (sales tax at state level)
      onCarriageCost: 1950,
      unloadingCost: 600,
    },
  },
  {
    id: 'preset_electronics_cn_ae',
    category: 'Air Freight',
    name: 'Smart IoT Controllers & Avionics Sensors (China to UAE)',
    description: 'Time-critical electronics shipped via Emirates SkyCargo from Shenzhen Baoan (SZX) to Dubai World Central (DWC).',
    metadata: {
      id: 'preset_electronics_cn_ae',
      referenceNo: 'AIR-2026-AE4409',
      title: 'Smart IoT Sensors & Telemetry Units',
      originCountry: 'China',
      originPort: 'Shenzhen Airport (SZX)',
      destinationCountry: 'United Arab Emirates',
      destinationPort: 'Dubai World Central (DWC)',
      freightMode: 'AIR_FREIGHT',
      commodity: '8526.91 - Radio navigational aid apparatus',
      hsCode: '8526.91.00',
      incotermCode: 'CIP',
      notes: 'Lithium battery section II compliance. Required ICC (A) all-risk insurance policy.',
      createdAt: '2026-09-18T10:15:00Z',
      updatedAt: '2026-09-18T10:15:00Z',
    },
    inputs: {
      cargoValue: 92000,
      currency: 'USD',
      packagingCost: 850,
      preCarriageCost: 620,
      exportClearanceCost: 350,
      originThcCost: 420,
      mainCarriageFreight: 3850,
      insuranceRatePercent: 0.45,
      insuranceMinimum: 180,
      destinationThcCost: 510,
      importDutyTariffPercent: 5.0, // Standard UAE GCC Common Customs Tariff
      importVatPercent: 5.0, // UAE 5% VAT
      onCarriageCost: 550,
      unloadingCost: 200,
    },
  },
  {
    id: 'preset_coffee_br_in',
    category: 'Ocean Freight (FCL)',
    name: 'Specialty Green Coffee Beans (Brazil to India)',
    description: 'Bulk agricultural commodity shipped in 20ft food-grade liner container from Port of Santos to Nhava Sheva (JNPT).',
    metadata: {
      id: 'preset_coffee_br_in',
      referenceNo: 'AGR-2026-IN0193',
      title: 'Specialty Arabica Green Coffee Beans',
      originCountry: 'Brazil',
      originPort: 'Port of Santos',
      destinationCountry: 'India',
      destinationPort: 'Nhava Sheva (JNPT), Mumbai',
      freightMode: 'OCEAN_FCL',
      commodity: '0901.11 - Coffee, not roasted, not decaffeinated',
      hsCode: '0901.11.00',
      incotermCode: 'CIF',
      notes: 'Requires Phytosanitary Certificate and Plant Quarantine clearance at JNPT Port.',
      createdAt: '2026-09-20T14:45:00Z',
      updatedAt: '2026-09-20T14:45:00Z',
    },
    inputs: {
      cargoValue: 64000,
      currency: 'USD',
      packagingCost: 1100,
      preCarriageCost: 950,
      exportClearanceCost: 380,
      originThcCost: 520,
      mainCarriageFreight: 3100,
      insuranceRatePercent: 0.28,
      insuranceMinimum: 150,
      destinationThcCost: 490,
      importDutyTariffPercent: 10.0, // Preferential / concessional tariff
      importVatPercent: 5.0, // Indian GST for agro commodities
      onCarriageCost: 820,
      unloadingCost: 350,
    },
  },
  {
    id: 'preset_automotive_jp_nl',
    category: 'Ocean Freight (FCL)',
    name: 'Electric Drivetrain Subassemblies (Japan to Netherlands)',
    description: 'Tier-1 automotive powertrain assemblies moving from Nagoya Port to Maasvlakte Terminal, Port of Rotterdam.',
    metadata: {
      id: 'preset_automotive_jp_nl',
      referenceNo: 'AUT-2026-NL5572',
      title: 'EV Permanent Magnet Motors & Inverters',
      originCountry: 'Japan',
      originPort: 'Port of Nagoya',
      destinationCountry: 'Netherlands',
      destinationPort: 'Port of Rotterdam',
      freightMode: 'OCEAN_FCL',
      commodity: '8501.52 - Multi-phase AC motors of output 750W to 75kW',
      hsCode: '8501.52.00',
      incotermCode: 'DAP',
      notes: 'EU-Japan EPA preferential origin rule applies with EUR.1 / Origin Statement for 0% duty.',
      createdAt: '2026-09-22T11:20:00Z',
      updatedAt: '2026-09-22T11:20:00Z',
    },
    inputs: {
      cargoValue: 240000,
      currency: 'USD',
      packagingCost: 2800,
      preCarriageCost: 1200,
      exportClearanceCost: 450,
      originThcCost: 720,
      mainCarriageFreight: 5100,
      insuranceRatePercent: 0.30,
      insuranceMinimum: 250,
      destinationThcCost: 680,
      importDutyTariffPercent: 0.0, // 0% under EPA agreement
      importVatPercent: 21.0, // Dutch standard VAT (recoverable by registered importer)
      onCarriageCost: 1150,
      unloadingCost: 450,
    },
  },
];
