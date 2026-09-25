import { TradeDocument } from '../types/trade';

export const TRADE_DOCUMENTS_MASTER: TradeDocument[] = [
  {
    id: 'doc_comm_invoice',
    name: 'Commercial Invoice (CI)',
    code: 'CI-01',
    category: 'COMMERCIAL',
    procuredBy: 'SELLER',
    description:
      'The primary accounting document detailing the contract terms, seller & buyer legal entities, itemized cargo description, HSN codes, unit pricing, Incoterm with named place, and currency.',
    purpose: 'Required for customs clearance, currency declaration, foreign exchange remittance, and duty assessment.',
    timing: 'Issued prior to origin customs filing and goods dispatch.',
    requiredForIncoterms: ['ALL'],
    riskNotes:
      'Must clearly state the exact 3-letter Incoterm followed by the specific named location (e.g., "FCA Hamburg Terminal 2, Incoterms 2020"). Omitting the version or exact place causes customs holds.',
  },
  {
    id: 'doc_packing_list',
    name: 'Detailed Packing List (PL)',
    code: 'PL-02',
    category: 'COMMERCIAL',
    procuredBy: 'SELLER',
    description:
      'Comprehensive breakdown of cartons, pallets, net weight, gross weight, cubic meter dimensions (CBM), serial numbers, and container seal IDs.',
    purpose: 'Enables port handlers, freight forwarders, and customs inspectors to physically verify package contents without opening every crate.',
    timing: 'Issued simultaneously with the Commercial Invoice.',
    requiredForIncoterms: ['ALL'],
    riskNotes:
      'Discrepancies between gross weight on PL and the SOLAS Verified Gross Mass (VGM) certificate can cause maritime loading rejections.',
  },
  {
    id: 'doc_bill_of_lading',
    name: 'Ocean Bill of Lading (B/L) / Sea Waybill',
    code: 'BL-03',
    category: 'TRANSPORT',
    procuredBy: 'CARRIER',
    description:
      'Legal contract of carriage, receipt of cargo, and document of title (negotiable if consigned "to order"). For air shipments, an Air Waybill (AWB non-negotiable) is used.',
    purpose: 'Transfers possession of goods at destination port upon presentation of endorsed original or electronic telex release.',
    timing: 'Issued by ocean carrier immediately after vessel sails.',
    requiredForIncoterms: ['FAS', 'FOB', 'CFR', 'CIF', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'],
    riskNotes:
      'Under 2020 FCA, seller can request carrier to issue an on-board notation B/L to satisfy bank Letter of Credit before vessel departure.',
  },
  {
    id: 'doc_coo',
    name: 'Certificate of Origin (COO / Form A / EUR.1)',
    code: 'COO-04',
    category: 'CUSTOMS',
    procuredBy: 'SELLER',
    description:
      'Official declaration certified by a Chamber of Commerce or customs authority verifying the economic nationality and manufacturing origin of the goods.',
    purpose: 'Qualifies the shipment for preferential or zero customs duty rates under bilateral Free Trade Agreements (FTA).',
    timing: 'Certified prior to export departure.',
    requiredForIncoterms: ['ALL'],
    riskNotes:
      'Non-compliant rules of origin or lack of certified seal leads to retroactive duty assessments and administrative fines at destination.',
  },
  {
    id: 'doc_insurance_cert',
    name: 'Marine Cargo Insurance Certificate',
    code: 'INS-05',
    category: 'INSURANCE',
    procuredBy: 'SELLER',
    description:
      'Formal policy evidence issued by maritime underwriter insuring the cargo for at least 110% of CIF/CIP contract value.',
    purpose: 'Protects buyer and financing bank against perils of the sea, general average, jettison, piracy, and physical damage.',
    timing: 'Bound and dated on or before the date of loading / dispatch.',
    requiredForIncoterms: ['CIF', 'CIP'],
    riskNotes:
      'CIP mandates high Institute Cargo Clauses (A) "All Risks". CIF requires only Institute Cargo Clauses (C) minimal named-peril coverage.',
  },
  {
    id: 'doc_export_decl',
    name: 'Export Customs Declaration (AES / EAD)',
    code: 'EXP-06',
    category: 'CUSTOMS',
    procuredBy: 'SELLER',
    description:
      'Electronic export filing (EEI via AES in the US, EAD in Europe, Shipping Bill in India) lodged with national export authorities.',
    purpose: 'Authorizes cargo to exit customs jurisdiction and generates export tax refunds or GST zero-rating proof.',
    timing: 'Lodged prior to container gate-in or terminal cut-off.',
    requiredForIncoterms: ['FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'],
    riskNotes:
      'Under EXW, the BUYER must file this, which is often legally challenging for foreign buyers with no domestic tax identity.',
  },
  {
    id: 'doc_import_entry',
    name: 'Import Entry Summary (CBP 7501 / SAD / Bill of Entry)',
    code: 'IMP-07',
    category: 'CUSTOMS',
    procuredBy: 'BUYER',
    description:
      'Formal import declaration itemizing tariff classification, customs valuation basis, country of origin, and duty/tax payments.',
    purpose: 'Releases goods from customs custody into home consumption or bonded warehouse.',
    timing: 'Filed within designated statutory window upon vessel arrival.',
    requiredForIncoterms: ['ALL'],
    riskNotes:
      'Under DDP, the SELLER must act as importer of record (IOR) or hire a licensed fiscal representative, requiring local VAT registration.',
  },
  {
    id: 'doc_inspection_cert',
    name: 'Pre-Shipment Inspection / Phytosanitary Certificate',
    code: 'PSI-08',
    category: 'REGULATORY',
    procuredBy: 'SELLER',
    description:
      'Certificate issued by accredited inspection agency (SGS, Bureau Veritas) or national plant/health agency certifying compliance with agricultural, sanitary, or electrical standards.',
    purpose: 'Mandatory for food, plants, wood packaging (ISPM 15), medical devices, or countries with Pre-Shipment Inspection regimes.',
    timing: 'Inspected and certified at origin warehouse before container stuffing.',
    requiredForIncoterms: ['ALL'],
    riskNotes:
      'Missing ISPM 15 wood pallet stamp can result in mandatory re-export or immediate fumigation holds at destination port.',
  },
];
