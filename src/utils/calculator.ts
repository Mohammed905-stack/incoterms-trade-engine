import {
  CalculationResult,
  CostBreakdownItem,
  CurrencyCode,
  IncotermDefinition,
  PartyObligation,
  ShipmentCostInputs,
  ShipmentMetadata,
  SupplyChainLegKey,
} from '../types/trade';
import { getIncotermByCode, SUPPLY_CHAIN_LEGS } from '../data/incotermsData';
import { convertToUSD } from './currencies';

export const calculateLandedCost = (
  inputs: ShipmentCostInputs,
  metadata: ShipmentMetadata,
  overrideIncoterm?: string,
  customRates?: Record<CurrencyCode, number>
): CalculationResult => {
  const incotermCode = overrideIncoterm || metadata.incotermCode;
  const incoterm = getIncotermByCode(incotermCode);

  // Normalize all input costs into USD for calculation consistency
  const baseCurrency = inputs.currency || 'USD';
  const cargoValUSD = convertToUSD(inputs.cargoValue, baseCurrency, customRates);
  const packagingUSD = convertToUSD(inputs.packagingCost, baseCurrency, customRates);
  const preCarriageUSD = convertToUSD(inputs.preCarriageCost, baseCurrency, customRates);
  const exportClearanceUSD = convertToUSD(inputs.exportClearanceCost, baseCurrency, customRates);
  const originThcUSD = convertToUSD(inputs.originThcCost, baseCurrency, customRates);
  const mainFreightUSD = convertToUSD(inputs.mainCarriageFreight, baseCurrency, customRates);

  // Insurance calculation (typically 110% of CIF/CIP value or % of cargo value)
  const roughCifEstimate = cargoValUSD + mainFreightUSD;
  const insuranceBase = roughCifEstimate * 1.1; // 110% ICC standard
  const insuranceRate = inputs.insuranceRatePercent || 0;
  const calcInsurance = (insuranceBase * insuranceRate) / 100;
  const minInsurance = inputs.insuranceMinimum || 0;
  const insuranceUSD = (insuranceRate > 0 || minInsurance > 0)
    ? Math.max(calcInsurance, convertToUSD(minInsurance, baseCurrency, customRates))
    : 0;

  const destThcUSD = convertToUSD(inputs.destinationThcCost || 0, baseCurrency, customRates);
  const onCarriageUSD = convertToUSD(inputs.onCarriageCost || 0, baseCurrency, customRates);
  const unloadingUSD = convertToUSD(inputs.unloadingCost || 0, baseCurrency, customRates);

  // Determine Dutiable Customs Value (most WTO members use CIF / CIP value for customs assessment, US uses FOB)
  // CIF value = Cargo + Packaging + PreCarriage + Export Clearance + Origin THC + Main Freight + Marine Insurance
  const cifValueUSD =
    cargoValUSD +
    packagingUSD +
    preCarriageUSD +
    exportClearanceUSD +
    originThcUSD +
    mainFreightUSD +
    insuranceUSD;

  // Customs Tariff calculation
  const importDutyUSD = (cifValueUSD * (inputs.importDutyTariffPercent || 0)) / 100;

  // Import VAT/GST calculation (Base is Dutiable CIF Value + Customs Duty + Port DTHC in many regimes)
  const vatTaxableBaseUSD = cifValueUSD + importDutyUSD + destThcUSD;
  const importVatUSD = (vatTaxableBaseUSD * (inputs.importVatPercent || 0)) / 100;

  // Import clearance entry fee: user-specified raw input or 0
  const importClearanceUSD = convertToUSD(inputs.importClearanceCost || 0, baseCurrency, customRates);

  // Build the itemized cost breakdown
  const items: CostBreakdownItem[] = [
    {
      id: 'base_cargo',
      label: 'Base Commercial Cargo Value (FOB/EXW Base)',
      description: 'The contracted commercial invoice valuation of the goods.',
      amountUSD: cargoValUSD,
      borneBy: 'BUYER', // The buyer ultimately pays the seller for the cargo
      category: 'cargo',
    },
    {
      id: 'packaging',
      label: 'Export Packaging, Marking & Palletizing',
      description: 'Industrial packaging suitable for international freight.',
      amountUSD: packagingUSD,
      borneBy: incoterm.costs.packaging,
      category: 'origin',
    },
    {
      id: 'pre_carriage',
      label: 'Origin Pre-Carriage & Drayage',
      description: 'Inland transport from seller facility to loading port or terminal.',
      amountUSD: preCarriageUSD,
      borneBy: incoterm.costs.pre_carriage,
      category: 'origin',
    },
    {
      id: 'export_clearance',
      label: 'Export Customs Clearance & Documentation',
      description: 'Export licensing, EEI/AES filing, and origin clearance formalities.',
      amountUSD: exportClearanceUSD,
      borneBy: incoterm.costs.export_clearance,
      category: 'origin',
    },
    {
      id: 'origin_thc',
      label: 'Origin Terminal Handling Charges (OTHC)',
      description: 'Terminal handling, wharfage, and loading onto outbound vessel.',
      amountUSD: originThcUSD,
      borneBy: incoterm.costs.origin_thc,
      category: 'origin',
    },
    {
      id: 'main_carriage',
      label: 'International Main Freight (Ocean / Air)',
      description: 'Primary international freight crossing international borders/waters.',
      amountUSD: mainFreightUSD,
      borneBy: incoterm.costs.main_carriage,
      category: 'transit',
    },
    {
      id: 'marine_insurance',
      label: 'Cargo Transit Insurance Premium',
      description: 'Marine cargo protection (ICC A or C at 110% insured value).',
      amountUSD: insuranceUSD,
      borneBy: incoterm.costs.marine_insurance,
      category: 'transit',
    },
    {
      id: 'destination_thc',
      label: 'Destination Terminal Handling Charges (DTHC)',
      description: 'Discharge, container yard handling, and gate-out at port of arrival.',
      amountUSD: destThcUSD,
      borneBy: incoterm.costs.destination_thc,
      category: 'destination',
    },
    {
      id: 'import_clearance',
      label: 'Import Customs Brokerage Clearance Fee',
      description: 'Professional customs broker fee for filing import declaration.',
      amountUSD: importClearanceUSD,
      borneBy: incoterm.costs.import_clearance,
      category: 'taxes',
    },
    {
      id: 'import_tariffs',
      label: `Import Customs Duties & Tariffs (${inputs.importDutyTariffPercent}%)`,
      description: 'Statutory import tariffs assessed on customs CIF value.',
      amountUSD: importDutyUSD,
      borneBy: incoterm.code === 'DDP' ? 'SELLER' : 'BUYER',
      category: 'taxes',
    },
    {
      id: 'import_vat',
      label: `Import VAT / GST / Local Consumption Tax (${inputs.importVatPercent}%)`,
      description: 'Government value-added tax assessed on imported goods and duties.',
      amountUSD: importVatUSD,
      borneBy: incoterm.code === 'DDP' ? 'SELLER' : 'BUYER',
      category: 'taxes',
    },
    {
      id: 'on_carriage',
      label: 'Destination On-Carriage & Final Drayage',
      description: 'Inland trucking from destination port/railhead to buyer facility.',
      amountUSD: onCarriageUSD,
      borneBy: incoterm.costs.on_carriage,
      category: 'destination',
    },
    {
      id: 'unloading',
      label: 'Destination Unloading Service',
      description: 'Mechanical discharge and destuffing at the destination warehouse.',
      amountUSD: unloadingUSD,
      borneBy: incoterm.costs.unloading,
      category: 'destination',
    },
  ];

  // Calculate direct seller outlay vs direct buyer outlay
  // Under trade mechanics:
  // Seller incurs expenses for all items where borneBy === 'SELLER'.
  // These seller expenses are factored into the seller's commercial quotation to the buyer.
  // The buyer pays the seller's quote (which covers cargo + seller logistics) PLUS pays directly for any items where borneBy === 'BUYER' (excluding base cargo, which was already in the invoice).
  let sellerDirectLogisticsUSD = 0;
  let buyerDirectLogisticsAndTaxesUSD = 0;

  items.forEach((item) => {
    if (item.id === 'base_cargo') return;
    if (item.borneBy === 'SELLER') {
      sellerDirectLogisticsUSD += item.amountUSD;
    } else {
      buyerDirectLogisticsAndTaxesUSD += item.amountUSD;
    }
  });

  // Total invoice value billed by Seller to Buyer = Base Cargo Value + Seller Direct Logistics
  const sellerInvoiceQuoteUSD = cargoValUSD + sellerDirectLogisticsUSD;

  // Total Landed Cost incurred by Buyer = Invoice paid to Seller + Buyer's direct outlays
  const totalLandedCostUSD = sellerInvoiceQuoteUSD + buyerDirectLogisticsAndTaxesUSD;

  // Calculate Risk Exposure Split:
  // Count how many of the 10 core supply chain legs have transit risk on Seller vs Buyer
  let sellerRiskLegCount = 0;
  let buyerRiskLegCount = 0;

  SUPPLY_CHAIN_LEGS.forEach((leg) => {
    const riskBearer = incoterm.risks[leg.id];
    if (riskBearer === 'SELLER') {
      sellerRiskLegCount++;
    } else {
      buyerRiskLegCount++;
    }
  });

  const totalLegs = SUPPLY_CHAIN_LEGS.length;
  const sellerRiskPercentage = Math.round((sellerRiskLegCount / totalLegs) * 100);
  const buyerRiskPercentage = 100 - sellerRiskPercentage;

  return {
    metadata: {
      ...metadata,
      incotermCode: incoterm.code,
    },
    inputs,
    currency: baseCurrency,
    items,
    sellerTotal: sellerInvoiceQuoteUSD,
    buyerTotal: totalLandedCostUSD,
    totalLandedCost: totalLandedCostUSD,
    customsDutiableValue: cifValueUSD,
    importDutyAmount: importDutyUSD,
    importVatAmount: importVatUSD,
    sellerRiskPercentage,
    buyerRiskPercentage,
  };
};

export interface ScenarioComparison {
  incotermA: IncotermDefinition;
  incotermB: IncotermDefinition;
  resultA: CalculationResult;
  resultB: CalculationResult;
  sellerDeltaUSD: number; // ResultB - ResultA
  buyerLandedDeltaUSD: number;
  sellerRiskDelta: number;
  buyerRiskDelta: number;
  keyDifferences: string[];
}

export const compareIncoterms = (
  inputs: ShipmentCostInputs,
  metadata: ShipmentMetadata,
  codeA: string,
  codeB: string,
  customRates?: Record<CurrencyCode, number>
): ScenarioComparison => {
  const incotermA = getIncotermByCode(codeA);
  const incotermB = getIncotermByCode(codeB);

  const resultA = calculateLandedCost(inputs, metadata, codeA, customRates);
  const resultB = calculateLandedCost(inputs, metadata, codeB, customRates);

  const sellerDeltaUSD = resultB.sellerTotal - resultA.sellerTotal;
  const buyerLandedDeltaUSD = resultB.totalLandedCost - resultA.totalLandedCost;
  const sellerRiskDelta = resultB.sellerRiskPercentage - resultA.sellerRiskPercentage;
  const buyerRiskDelta = resultB.buyerRiskPercentage - resultA.buyerRiskPercentage;

  const keyDifferences: string[] = [];

  if (incotermA.transportMode !== incotermB.transportMode) {
    keyDifferences.push(
      `Transport Mode difference: ${incotermA.code} is for ${incotermA.transportMode === 'ANY_MODE' ? 'Any Mode (Multimodal)' : 'Sea & Inland Waterway Only'}, while ${incotermB.code} is for ${incotermB.transportMode === 'ANY_MODE' ? 'Any Mode (Multimodal)' : 'Sea & Inland Waterway Only'}.`
    );
  }

  if (incotermA.exportCustomsParty !== incotermB.exportCustomsParty) {
    keyDifferences.push(
      `Export clearance changes: Borne by ${incotermA.exportCustomsParty} in ${incotermA.code} vs. ${incotermB.exportCustomsParty} in ${incotermB.code}.`
    );
  }

  if (incotermA.importCustomsParty !== incotermB.importCustomsParty) {
    keyDifferences.push(
      `Import duties & taxes: Borne by ${incotermA.importCustomsParty} in ${incotermA.code} vs. ${incotermB.importCustomsParty} in ${incotermB.code}.`
    );
  }

  if (incotermA.insuranceLevel !== incotermB.insuranceLevel) {
    keyDifferences.push(
      `Insurance requirement: ${incotermA.code} specifies ${incotermA.insuranceLevel}, while ${incotermB.code} specifies ${incotermB.insuranceLevel}.`
    );
  }

  keyDifferences.push(
    `Point of Risk Transfer shifts from "${incotermA.riskTransferPoint}" under ${incotermA.code} to "${incotermB.riskTransferPoint}" under ${incotermB.code}.`
  );

  return {
    incotermA,
    incotermB,
    resultA,
    resultB,
    sellerDeltaUSD,
    buyerLandedDeltaUSD,
    sellerRiskDelta,
    buyerRiskDelta,
    keyDifferences,
  };
};
