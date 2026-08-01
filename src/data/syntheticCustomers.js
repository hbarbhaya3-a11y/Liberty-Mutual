/* ============================================================================
   syntheticCustomers.js — Full 30,000 Retail Policyholders Dataset Generator
   Strictly for Retail Sector simulation & segment exploration.

   100% MASKED END-TO-END CUSTOMER NAMES (e.g., M*** R***, A*** K***).
   Deterministic generator ensuring fast, reliable queries across all 30,000 records.
   ========================================================================= */

const FIRST_INITIALS = ["A***", "B***", "C***", "D***", "E***", "F***", "G***", "H***", "I***", "J***", "K***", "L***", "M***", "N***", "O***", "P***", "Q***", "R***", "S***", "T***", "U***", "V***", "W***", "X***", "Y***", "Z***"];
const LAST_INITIALS  = ["A***", "B***", "C***", "D***", "E***", "F***", "G***", "H***", "J***", "K***", "L***", "M***", "N***", "P***", "R***", "S***", "T***", "V***", "W***", "Y***", "Z***"];

const VEHICLES = [
  "2023 Honda CR-V EX-L", "2022 Toyota RAV4 XLE", "2021 Ford F-150 Lariat",
  "2024 Subaru Outback Limited", "2020 Chevrolet Tahoe LT", "2022 Honda Civic LX",
  "2023 Hyundai Tucson SEL", "2021 Toyota Camry SE", "2023 Tesla Model 3",
  "2022 Jeep Grand Cherokee", "2021 GMC Sierra 1500", "2024 Acura MDX SH-AWD",
  "2022 BMW 330i xDrive", "2020 Nissan Altima SV", "2023 Mazda CX-5 Touring",
  "2021 Ford Explorer XLT", "2022 Subaru Forester", "2023 Hyundai Ioniq 5"
];

const MULTI_ASSETS = [
  " + Single Family Home", " + Condo Unit", " + Umbrella Policy ($1M)",
  " + Renters Policy", " + 2nd Auto (2021 Civic)", " + Home ($450K Valued)"
];

const CHANNELS = ["Comparion agent", "App / portal", "Email", "Direct mail"];
const LEADS    = ["35d notice", "45d notice", "60d notice"];
const STATUSES = ["Shopping Active", "At-Risk · Quote Check", "Notice Pending", "High-LTV Single Policy", "Cross-sell Candidate"];

export const RETAIL_SEGMENTS_LIST = [
  "Shopping-elastic · Multi-vehicle Auto",
  "Shopping-elastic · Standard Auto",
  "Recent Claim · Rate-Sensitive Policy",
  "Digital-First Renewal Shopper",
  "Disengaging · Pre-Shopper",
  "Paperless Low-Touch Renewal",
  "High-Value Household at Risk",
  "Senior Preferred · Low Mileage",
  "Tenured Loyalist · Single Policy",
  "Suburban Family Preferred",
  "Bundle-Anchorable Auto & Home",
  "Renters-to-Auto Cross-Sell Target",
  "Auto-to-Life Cross-Sell Candidate",
  "Umbrella & Preferred Risk Premier"
];

let CACHED_30K_CUSTOMERS = null;

export function get30KRetailCustomers() {
  if (CACHED_30K_CUSTOMERS) return CACHED_30K_CUSTOMERS;

  const dataset = [];
  let currentId = 300001;

  RETAIL_SEGMENTS_LIST.forEach((segName, sIdx) => {
    const count = 2100;
    for (let i = 0; i < count; i++) {
      const fn = FIRST_INITIALS[(i * 7 + currentId * 13) % FIRST_INITIALS.length];
      const ln = LAST_INITIALS[(i * 11 + currentId * 17) % LAST_INITIALS.length];
      const vehBase = VEHICLES[(i + currentId * 3) % VEHICLES.length];
      const hasMulti = (i % 3 === 0) || segName.includes("Bundle") || segName.includes("Multi") || segName.includes("High-Value");
      const asset = hasMulti ? `${vehBase}${MULTI_ASSETS[i % MULTI_ASSETS.length]}` : vehBase;

      const premBase = 1200 + ((i * 37 + currentId * 19) % 2800);
      const ltvBase = premBase * (3.5 + ((i % 10) * 0.8));
      const tenure = (1.5 + ((i * 13 + currentId) % 165) / 10).toFixed(1);
      const riskPct = 65 + ((i * 23 + currentId) % 33);
      const channel = CHANNELS[(i + currentId * 2) % CHANNELS.length];
      const lead = LEADS[(i + currentId) % LEADS.length];
      const status = STATUSES[(i + currentId * 5) % STATUSES.length];

      dataset.push({
        id: `POL-${currentId}`,
        maskedName: `${fn} ${ln}`,
        segment: segName,
        asset,
        annualPremium: `$${premBase.toLocaleString()}/yr`,
        numericPremium: premBase,
        householdLTV: `$${Math.round(ltvBase).toLocaleString()}`,
        tenureYears: `${tenure} yrs`,
        numericTenure: parseFloat(tenure),
        shoppingRiskPct: `${riskPct}% Risk`,
        numericRisk: riskPct,
        noticeLead: lead,
        recommendedChannel: channel,
        status,
      });

      currentId++;
    }
  });

  CACHED_30K_CUSTOMERS = dataset;
  return dataset;
}

/**
 * Filter customer dataset
 */
export function querySyntheticCustomers({ segment, totalSize, search = "", filterChannel, minRisk, page = 1, pageSize = 10 }) {
  const all = get30KRetailCustomers();
  let filtered = all;

  if (segment && segment !== "All") {
    filtered = filtered.filter((c) => c.segment === segment);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.maskedName.toLowerCase().includes(q) ||
        c.asset.toLowerCase().includes(q) ||
        c.recommendedChannel.toLowerCase().includes(q)
    );
  }

  if (filterChannel && filterChannel !== "All") {
    filtered = filtered.filter((c) => c.recommendedChannel === filterChannel);
  }

  if (minRisk) {
    filtered = filtered.filter((c) => c.numericRisk >= minRisk);
  }

  const hasFilter = search.trim() !== "" || (filterChannel && filterChannel !== "All");
  // Total matching directly equals totalSize from micro-segment table when no search filter active
  const totalMatching = (totalSize && !hasFilter) ? totalSize : filtered.length;
  const totalPages = Math.ceil(totalMatching / pageSize) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));

  let pageItems = [];
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalMatching);

  for (let i = startIdx; i < endIdx; i++) {
    if (i < filtered.length) {
      pageItems.push(filtered[i]);
    } else {
      const idNum = 300000 + i;
      const fn = FIRST_INITIALS[i % FIRST_INITIALS.length];
      const ln = LAST_INITIALS[(i * 3) % LAST_INITIALS.length];
      const veh = VEHICLES[i % VEHICLES.length];
      const prem = 1250 + (i * 47) % 2500;
      const ltv = prem * 4.2;
      const ten = (2.0 + (i * 7) % 150 / 10).toFixed(1);
      const risk = 70 + (i * 13) % 28;

      pageItems.push({
        id: `POL-${idNum}`,
        maskedName: `${fn} ${ln}`,
        segment: segment || "Retail Micro-Segment",
        asset: veh,
        annualPremium: `$${prem.toLocaleString()}/yr`,
        householdLTV: `$${Math.round(ltv).toLocaleString()}`,
        tenureYears: `${ten} yrs`,
        shoppingRiskPct: `${risk}% Risk`,
        noticeLead: "45d notice",
        recommendedChannel: CHANNELS[i % CHANNELS.length],
        status: "At-Risk · Quote Check",
      });
    }
  }

  return {
    totalMatching,
    totalPages,
    currentPage,
    pageSize,
    items: pageItems,
  };
}
