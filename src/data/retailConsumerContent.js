/* ============================================================================
   retailConsumerContent.js — Production-grade consumer profiles and channel
   content generator strictly for Retail Sector micro-segments.

   All customer names are masked END-TO-END (e.g. M*** R***, J*** S***).
   Channel content is production-grade and formatted per channel type.
   ========================================================================= */

// Sample masked consumer pools tailored by micro-segment archetype
const MASKED_CONSUMER_SAMPLES = {
  "Shopping-elastic · Multi-vehicle Auto": [
    { policyId: "POL-849201", maskedName: "M*** R***", asset: "2023 Honda CR-V + 2021 Civic", premium: "$2,450/yr", tenure: "4.2 yrs", riskScore: "88% Shopping Risk", lead: "60d notice", channel: "Comparion agent" },
    { policyId: "POL-849202", maskedName: "J*** S***", asset: "2022 Ford F-150 + 2020 Explorer", premium: "$3,120/yr", tenure: "5.8 yrs", riskScore: "84% Shopping Risk", lead: "60d notice", channel: "Comparion agent" },
    { policyId: "POL-849203", maskedName: "A*** K***", asset: "2021 Toyota RAV4 + 2019 Camry", premium: "$2,280/yr", tenure: "3.5 yrs", riskScore: "91% Shopping Risk", lead: "45d notice", channel: "App / portal" },
    { policyId: "POL-849204", maskedName: "D*** B***", asset: "2024 Subaru Outback + 2022 Impreza", premium: "$2,780/yr", tenure: "6.1 yrs", riskScore: "82% Shopping Risk", lead: "60d notice", channel: "Comparion agent" },
  ],
  "Shopping-elastic · Standard Auto": [
    { policyId: "POL-738101", maskedName: "E*** W***", asset: "2022 Toyota Corolla SE", premium: "$1,480/yr", tenure: "2.8 yrs", riskScore: "86% Shopping Risk", lead: "45d notice", channel: "App / portal" },
    { policyId: "POL-738102", maskedName: "C*** T***", asset: "2021 Honda Accord EX", premium: "$1,620/yr", tenure: "3.4 yrs", riskScore: "89% Shopping Risk", lead: "45d notice", channel: "Email" },
    { policyId: "POL-738103", maskedName: "L*** M***", asset: "2023 Hyundai Elantra", premium: "$1,390/yr", tenure: "1.9 yrs", riskScore: "93% Shopping Risk", lead: "35d notice", channel: "App / portal" },
    { policyId: "POL-738104", maskedName: "P*** H***", asset: "2020 Nissan Altima", premium: "$1,540/yr", tenure: "4.1 yrs", riskScore: "81% Shopping Risk", lead: "45d notice", channel: "Email" },
  ],
  "Recent Claim · Rate-Sensitive Policy": [
    { policyId: "POL-920141", maskedName: "R*** N***", asset: "2022 Chevrolet Tahoe", premium: "$2,890/yr", tenure: "5.2 yrs", riskScore: "94% Attrition Risk", lead: "60d notice", channel: "Comparion agent" },
    { policyId: "POL-920142", maskedName: "S*** V***", asset: "2023 Jeep Grand Cherokee", premium: "$2,650/yr", tenure: "4.7 yrs", riskScore: "91% Attrition Risk", lead: "60d notice", channel: "Comparion agent" },
    { policyId: "POL-920143", maskedName: "G*** F***", asset: "2021 GMC Sierra 1500", premium: "$3,100/yr", tenure: "6.8 yrs", riskScore: "89% Attrition Risk", lead: "60d notice", channel: "Comparion agent" },
  ],
  "Digital-First Renewal Shopper": [
    { policyId: "POL-610291", maskedName: "K*** L***", asset: "2023 Tesla Model 3", premium: "$1,980/yr", tenure: "3.1 yrs", riskScore: "87% Shopping Risk", lead: "35d notice", channel: "App / portal" },
    { policyId: "POL-610292", maskedName: "N*** P***", asset: "2022 BMW 330i", premium: "$2,150/yr", tenure: "2.4 yrs", riskScore: "90% Shopping Risk", lead: "35d notice", channel: "App / portal" },
    { policyId: "POL-610293", maskedName: "V*** S***", asset: "2024 Hyundai Ioniq 5", premium: "$1,820/yr", tenure: "1.8 yrs", riskScore: "85% Shopping Risk", lead: "45d notice", channel: "Email" },
  ],
  "Disengaging · Pre-Shopper": [
    { policyId: "POL-550181", maskedName: "T*** C***", asset: "2020 Honda Civic LX", premium: "$1,420/yr", tenure: "4.5 yrs", riskScore: "78% Disengagement Risk", lead: "60d notice", channel: "App / portal" },
    { policyId: "POL-550182", maskedName: "B*** O***", asset: "2019 Ford Fusion", premium: "$1,380/yr", tenure: "5.1 yrs", riskScore: "75% Disengagement Risk", lead: "45d notice", channel: "Comparion agent" },
    { policyId: "POL-550183", maskedName: "M*** G***", asset: "2021 Kia Sportage", premium: "$1,510/yr", tenure: "3.9 yrs", riskScore: "82% Disengagement Risk", lead: "60d notice", channel: "App / portal" },
  ],
  "High-Value Household at Risk": [
    { policyId: "POL-990011", maskedName: "H*** E***", asset: "2024 Lexus RX 350 + Home", premium: "$4,250/yr", tenure: "8.9 yrs", riskScore: "92% Shopping Risk", lead: "60d notice", channel: "Comparion agent" },
    { policyId: "POL-990012", maskedName: "W*** A***", asset: "2023 Audi Q7 + Home", premium: "$4,890/yr", tenure: "10.4 yrs", riskScore: "89% Shopping Risk", lead: "60d notice", channel: "Comparion agent" },
    { policyId: "POL-990013", maskedName: "J*** D***", asset: "2022 Volvo XC90 + Umbrella", premium: "$3,950/yr", tenure: "7.6 yrs", riskScore: "94% Shopping Risk", lead: "60d notice", channel: "Comparion agent" },
  ],
  "Tenured Loyalist · Single Policy": [
    { policyId: "POL-440211", maskedName: "F*** R***", asset: "2018 Toyota Camry XLE", premium: "$1,290/yr", tenure: "12.3 yrs", riskScore: "72% Shopping Risk", lead: "45d notice", channel: "Email" },
    { policyId: "POL-440212", maskedName: "I*** T***", asset: "2017 Honda CR-V", premium: "$1,340/yr", tenure: "14.1 yrs", riskScore: "68% Shopping Risk", lead: "35d notice", channel: "Direct mail" },
    { policyId: "POL-440213", maskedName: "O*** Y***", asset: "2019 Subaru Forester", premium: "$1,310/yr", tenure: "11.8 yrs", riskScore: "74% Shopping Risk", lead: "45d notice", channel: "Email" },
  ],
  "Bundle-Anchorable Auto & Home": [
    { policyId: "POL-881021", maskedName: "Q*** Z***", asset: "2022 Acura MDX + Single Family Home", premium: "$3,650/yr", tenure: "6.8 yrs", riskScore: "83% Shopping Risk", lead: "45d notice", channel: "Comparion agent" },
    { policyId: "POL-881022", maskedName: "Y*** X***", asset: "2021 Toyota Highlander + Home", premium: "$3,420/yr", tenure: "7.2 yrs", riskScore: "79% Shopping Risk", lead: "45d notice", channel: "App / portal" },
    { policyId: "POL-881023", maskedName: "U*** I***", asset: "2023 Mazda CX-90 + Home", premium: "$3,810/yr", tenure: "5.9 yrs", riskScore: "85% Shopping Risk", lead: "45d notice", channel: "Comparion agent" },
  ],
  "Renters-to-Auto Cross-Sell Target": [
    { policyId: "POL-330191", maskedName: "K*** M***", asset: "2021 Mazda 3 (Renters held)", premium: "$1,180/yr", tenure: "2.1 yrs", riskScore: "79% Cross-sell Candidate", lead: "35d notice", channel: "App / portal" },
    { policyId: "POL-330192", maskedName: "G*** W***", asset: "2020 Honda Civic (Renters held)", premium: "$1,220/yr", tenure: "2.8 yrs", riskScore: "82% Cross-sell Candidate", lead: "45d notice", channel: "Email" },
  ],
};

// Fallback generator for any segment not explicitly listed above
export function getRetailConsumersForSegment(segmentName, count = 4) {
  if (MASKED_CONSUMER_SAMPLES[segmentName]) {
    return MASKED_CONSUMER_SAMPLES[segmentName];
  }
  // Generic masked generator with 100% masked names
  const maskedFirst = ["A***", "B***", "C***", "D***", "E***", "F***", "J***", "M***", "P***", "R***", "S***", "T***"];
  const maskedLast  = ["K***", "L***", "M***", "N***", "O***", "P***", "R***", "S***", "T***", "W***", "Y***", "Z***"];
  const vehicles    = ["2023 Honda CR-V", "2022 Toyota RAV4", "2021 Ford F-150", "2020 Chevrolet Equinox", "2024 Subaru Crosstrek"];

  const list = [];
  for (let i = 0; i < count; i++) {
    const id = 800000 + (Math.abs(segmentName.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) * 37 + i * 19) % 199999;
    const fn = maskedFirst[i % maskedFirst.length];
    const ln = maskedLast[(i + 3) % maskedLast.length];
    const veh = vehicles[i % vehicles.length];
    const prem = 1350 + (i * 280) % 1800;
    const ten = (2.5 + (i * 1.8) % 10).toFixed(1);
    const risk = 75 + (i * 6) % 20;

    list.push({
      policyId: `POL-${id}`,
      maskedName: `${fn} ${ln}`,
      asset: veh,
      premium: `$${prem.toLocaleString()}/yr`,
      tenure: `${ten} yrs`,
      riskScore: `${risk}% Shopping Risk`,
      lead: "45d notice",
      channel: i % 2 === 0 ? "App / portal" : "Email",
    });
  }
  return list;
}

/**
 * Production-grade Channel Content Generator
 * Generates tailored marketing / agent communications for each micro-segment.
 */
export function getChannelContentForSegment(segment) {
  const channel = (segment.channel || "Email").toLowerCase();
  const name = segment.name || "Micro-segment";
  const offer = segment.product || "Rate Cap";
  const bundle = segment.bundle && segment.bundle !== "—" ? segment.bundle : null;
  const lead = segment.reachOutDays ? `${segment.reachOutDays}-day` : "45-day";

  if (channel.includes("app") || channel.includes("push") || channel.includes("portal")) {
    return {
      channelType: "app",
      channelTitle: "App / Mobile Push Notification",
      pushTitle: "🔔 Liberty Mutual Renewal Rate Guarantee",
      pushBody: `Your 2026 Auto Renewal offer is live! Lock in your ${offer} rate cap and claim your $100 loyalty statement credit before your term ends.`,
      badge: "EXCLUSIVE APP OFFER · EXPIRES IN 14 DAYS",
      deepLink: "libertymutual://app/policy/renew/lock",
      ctaText: "Lock Rate in App",
      secondaryText: "Dismiss",
      previewMetadata: {
        targetSegment: name,
        leadHorizon: `${lead} renewal notice`,
        estimatedReach: segment.size ? `${segment.size.toLocaleString()} users` : "Targeted cohort",
      },
      htmlTemplate: `
        <div style="background: #111827; color: #fff; padding: 16px; border-radius: 12px; font-family: sans-serif; max-width: 360px; border: 1px solid #374151;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-size:11px; font-weight:700; color:#fbbf24; background:rgba(251,191,36,0.15); padding:3px 8px; border-radius:4px;">${lead.toUpperCase()} NOTICE</span>
            <span style="font-size:10px; color:#9ca3af;">Just now</span>
          </div>
          <div style="font-weight:700; font-size:14px; margin-bottom:6px; color:#f3f4f6;">🔔 Liberty Mutual Renewal Rate Lock</div>
          <div style="font-size:12.5px; color:#d1d5db; line-height:1.4; margin-bottom:12px;">
            Your renewal offer for <strong>${name}</strong> is ready. Capped at <strong>${offer}</strong> vs competitor market rates.
            ${bundle ? `<br/><span style="color:#60a5fa; font-weight:600;">Bundle bonus: ${bundle}</span>` : ""}
          </div>
          <button style="width:100%; padding:10px; background:#fbbf24; color:#111827; font-weight:700; border:none; border-radius:6px; cursor:pointer;">
            Lock My Renewal Rate
          </button>
        </div>
      `,
    };
  }

  if (channel.includes("banker") || channel.includes("rm") || channel.includes("agent") || channel.includes("comparion")) {
    const isCommercial = name.includes("High-balance") || name.includes("sensitive") || name.includes("SMB") || name.includes("Commercial") || name.includes("Relationship") || channel.includes("rm");
    if (isCommercial) {
      return {
        channelType: "banker",
        channelTitle: "Commercial Banker Brief & Account Proposal Brief",
        agentRole: "Primary Commercial Relationship Banker",
        openingLine: `"Hello [CFO / Treasury Lead], this is [Banker Name] with Liberty Mutual Commercial Banking. I'm calling regarding your operating balance structure and upcoming policy renewal."`,
        talkingPoints: [
          `Acknowledge commercial relationship: "Your account holds active operating balances and maintains an exemplary multi-year relationship with us."`,
          `Present minimum-effective rate reprice: "To address competitive rate pressures without compromising your treasury terms, we've approved a targeted minimum-effective yield reprice."`,
          bundle ? `Introduce treasury/policy bundle: "By maintaining your primary payroll and treasury clearing on-us, we can unlock an additional ${bundle} discount."` : `Offer Treasury Management fee waiver ($500/mo) and automated zero-balance sweep-on-deposit.`,
          `Highlight zero-penalty liquidity access and dedicated commercial relationship underwriter support.`
        ],
        objectionHandling: `"If customer mentions biBERK or Next Insurance quotes: 'We recognize competitor headline promo rates. Our minimum-effective repricing preserves your primary treasury clearing rails, zero-balance sweep capability, and local RM support without introductory decay after year 1.'"`
        ,
        agentAction: "Confirm Commercial Proposal Terms & Generate Bind Brief",
        previewMetadata: {
          targetSegment: name,
          leadHorizon: `${lead} outreach`,
          estimatedReach: segment.size ? `${segment.size.toLocaleString()} commercial accounts` : "Targeted cohort",
        }
      };
    }
    return {
      channelType: "banker",
      channelTitle: "Comparion Agent Teleprompter Script",
      agentRole: "Senior Comparion Retention Agent",
      openingLine: `"Hello [Customer Name], this is [Agent Name] with Liberty Mutual. I'm reaching out ${lead} prior to your upcoming auto policy renewal."`,
      talkingPoints: [
        `Highlight customer tenure and claim-free status: "Your loyalty qualifies your household for our pre-approved Rate Guarantee Program."`,
        `Address regional rate context: "While market quotes in your zip code have increased ~12%, your renewal is capped at ${offer}."`,
        bundle ? `Introduce contingent bundle play: "Adding your home policy today unlocks an additional ${bundle} discount."` : `Offer deductible restructuring or roadside value add-ons at no extra cost.`,
        `Emphasize 24-month rate guarantee with zero penalty if vehicle usage changes.`
      ],
      objectionHandling: `"If customer mentions shopping with Progressive or GEICO: 'I completely understand verifying options. With our rate guarantee and local Comparion agent support, your net 2-year cost is lower than introductory rates from competitor quotes after year 1.'"`
      ,
      agentAction: "Confirm Rate Guarantee & Log Agent Notes",
      previewMetadata: {
        targetSegment: name,
        leadHorizon: `${lead} outreach`,
        estimatedReach: segment.size ? `${segment.size.toLocaleString()} policyholders` : "Targeted cohort",
      }
    };
  }

  if (channel.includes("mail") || channel.includes("direct")) {
    return {
      channelType: "mail",
      channelTitle: "Direct Mail Personalized Letter",
      header: "LIBERTY MUTUAL INSURANCE — OFFICIAL RENEWAL RATE GUARANTEE",
      salutation: "Dear Valued Policyholder,",
      bodyText: `As a valued policyholder in our ${name} segment, we are pleased to issue your Official Renewal Rate Guarantee Certificate. Rather than subject your household to regional market price fluctuations, your policy qualifies for our ${offer} program.`,
      certificateBox: {
        title: "OFFICIAL RATE GUARANTEE CERTIFICATE",
        offerName: offer,
        bundleDiscount: bundle || "Standard Household Protection",
        validLead: `${lead} prior to renewal`,
      },
      ctaText: "Scan QR Code on Slip or Call 1-800-290-8206",
      previewMetadata: {
        targetSegment: name,
        leadHorizon: `${lead} mailing`,
        estimatedReach: segment.size ? `${segment.size.toLocaleString()} physical letters` : "Targeted cohort",
      }
    };
  }

  // Default / Email Channel
  return {
    channelType: "email",
    channelTitle: "Production HTML Email Template",
    subject: `Your Liberty Mutual Auto Renewal — ${offer} & $100 Loyalty Statement Credit`,
    preheader: `We've locked in your 2026 renewal rate cap and multi-policy savings ${lead} ahead of schedule.`,
    heroHeader: "Preferred Renewal Rate Cap Secured",
    bodyParagraph: `Dear Valued Policyholder,\n\nWe appreciate your continued trust in Liberty Mutual. Ahead of your upcoming renewal (${lead} notice), our pricing system has evaluated your account and qualified your household for our Preferred Rate Guarantee Program.`,
    offerBox: {
      rateCap: offer,
      credit: "$100 Loyalty Statement Credit applied to 1st billing cycle",
      bundleBonus: bundle ? `Contingent Bundle Savings: ${bundle}` : "Accident Forgiveness & Roadside Included",
    },
    ctaText: "Accept Rate Guarantee & Review Policy",
    unsubscribeFooter: "Liberty Mutual Insurance, 175 Berkeley Street, Boston, MA 02116. You received this email because your account qualifies for renewal rate lock program.",
    previewMetadata: {
      targetSegment: name,
      leadHorizon: `${lead} email send`,
      estimatedReach: segment.size ? `${segment.size.toLocaleString()} emails` : "Targeted cohort",
    }
  };
}
