/* ============================================================================
   ConversationalCohortBuilder.jsx — Natural language AI Cohort Builder
   for Section 1 (CUSTOMER) lever in Retail What-If and If-What simulations.
   ========================================================================= */
import { useState } from "react";
import Icon from "@/components/Icon";

const RETAIL_SAMPLE_PROMPTS = [
  {
    label: "🎯 High-LTV Auto Shoppers",
    prompt: "High-LTV auto policyholders with tenure > 5 yrs and shopping risk > 80%",
    matchedCount: 12400,
    parsedFilter: "LTV > $10K · Tenure > 5.0 yrs · Shopping Risk > 80% · Multi-line target"
  },
  {
    label: "⚡ Rate-Sensitive Single Policyholders",
    prompt: "Single-line auto policyholders paying > $1,800/yr with recent rate increase",
    matchedCount: 18200,
    parsedFilter: "Auto Single-Policy · Premium > $1,800/yr · Price Elasticity Tier 1"
  },
  {
    label: "🏠 Suburban Multi-Vehicle + Home Target",
    prompt: "Suburban households with 2+ vehicles and unbundled home insurance",
    matchedCount: 15600,
    parsedFilter: "2+ Vehicles · Unbundled Home · Household LTV > $14K · Preferred Tier"
  },
  {
    label: "📉 Disengaging Pre-Shopper Cohort",
    prompt: "Policyholders with portal logins dropping >20% and paperless opens decaying",
    matchedCount: 9800,
    parsedFilter: "Digital Activity -22% YoY · Paperless Decay · Pre-Shopping Window (60d)"
  }
];

const COMMERCIAL_SAMPLE_PROMPTS = [
  {
    label: "🏢 Commercial Real Estate & Prop Mgmt",
    prompt: "Commercial Property Mgmt accounts with $250K+ deposits, tenure > 3 yrs, and rate-shopping 3 carriers",
    matchedCount: 7300,
    parsedFilter: "Prop Mgmt · Balances > $250K · Rate Elasticity High · Acquirer Intact"
  },
  {
    label: "⚙️ Manufacturing & Metal Fabrication",
    prompt: "Manufacturing accounts with payroll +14%, improving mod factor, and leaving prior carrier on service",
    matchedCount: 9100,
    parsedFilter: "Manufacturing WC+GL · Payroll +14% · Service Wedge · Rate Uplift Eligible"
  },
  {
    label: "💼 High-Balance Rate-Sensitive Operating Accounts",
    prompt: "SMB operating deposit accounts with $1M+ balances and partial outflows in last 60 days",
    matchedCount: 12600,
    parsedFilter: "Operating Balances > $1M · Outflow Velocity -18% · Minimum-Effective Reprice Target"
  },
  {
    label: "🍽️ Multi-Unit Hospitality & Franchise Accounts",
    prompt: "Hospitality & Restaurant groups with BOP + Liquor Liability shopping competitor quotes",
    matchedCount: 5800,
    parsedFilter: "Hospitality · BOP+Liquor · Loss Control Conditional · Margin Floor Clear"
  }
];

export default function ConversationalCohortBuilder({ onApplyCohort, isAutopilot = false, isCommercial = false }) {
  const samplePrompts = isCommercial ? COMMERCIAL_SAMPLE_PROMPTS : RETAIL_SAMPLE_PROMPTS;
  const [promptInput, setPromptInput] = useState("");
  const [appliedAiCohort, setAppliedAiCohort] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRunAiPrompt = (promptText, matchedN, filterDetails) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const customCohort = {
        id: `ai-cohort-${Date.now()}`,
        name: promptText,
        count: matchedN || 14200,
        parsedFilter: filterDetails || "Natural language criteria matched across 30,000 synthetic customer records"
      };
      setAppliedAiCohort(customCohort);
      if (onApplyCohort) {
        onApplyCohort(customCohort);
      }
    }, 400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    const input = promptInput.trim();
    // Simulate smart matching count based on prompt length
    const matchedN = 8000 + (Math.abs(input.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) * 43) % 18000;
    handleRunAiPrompt(input, matchedN, `Custom NLP Filter: "${input}"`);
  };

  return (
    <div className="sim-ai-cohort-builder" style={{ background: "var(--bg-2)", border: "1px solid var(--hair)", borderRadius: 10, padding: 14, marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, font: "700 12.5px/1 var(--ui)", color: "var(--violet, #b794f6)" }}>
          <Icon name="sparkles" size={14} />
          <span>Conversational Cohort Builder (AI Natural Language)</span>
        </div>
        <span style={{ font: "600 10.5px/1 var(--ui)", color: "var(--ink-3)", background: "var(--panel)", padding: "3px 8px", borderRadius: 4, border: "1px solid var(--hair)" }}>
          {isCommercial ? "41,200 Commercial Accounts" : "30,000 Customer Directory"}
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder={isCommercial ? "Type in natural language e.g. 'Commercial Prop Mgmt accounts with $250K+ deposits and rate-shopping 3 carriers'" : "Type in natural language e.g. 'High-LTV auto policyholders with tenure > 5 yrs and shopping risk > 80%'"}
          disabled={isAutopilot || isProcessing}
          style={{
            flex: 1,
            padding: "9px 12px",
            fontSize: 12.5,
            fontFamily: "var(--ui)",
            background: "var(--panel)",
            border: "1px solid var(--hair)",
            borderRadius: 7,
            color: "var(--ink)",
            outline: "none"
          }}
        />
        <button
          type="submit"
          disabled={isAutopilot || isProcessing || !promptInput.trim()}
          className="tj-btn tj-btn-primary"
          style={{ padding: "8px 14px", background: "var(--violet, #b794f6)", borderColor: "var(--violet, #b794f6)", color: "#14102b", fontWeight: 700, fontSize: 12 }}
        >
          <Icon name="sparkles" size={13} /> {isProcessing ? "Parsing…" : "Build Cohort"}
        </button>
      </form>

      {/* Quick Prompt Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isAutopilot || isProcessing}
            onClick={() => {
              setPromptInput(p.prompt);
              handleRunAiPrompt(p.prompt, p.matchedCount, p.parsedFilter);
            }}
            style={{
              padding: "4px 9px",
              fontSize: 11.5,
              fontWeight: 500,
              fontFamily: "var(--ui)",
              background: "var(--panel)",
              border: "1px solid var(--hair)",
              borderRadius: 6,
              color: "var(--ink-2)",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--violet, #b794f6)")}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--hair)")}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Applied AI Cohort Feedback */}
      {appliedAiCohort && (
        <div style={{ marginTop: 12, padding: 10, background: "rgba(183, 148, 246, 0.12)", border: "1px solid rgba(183, 148, 246, 0.35)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ font: "700 12px/1.2 var(--ui)", color: "var(--ink)", marginBottom: 3 }}>
              ✨ Applied AI Cohort: <b>{appliedAiCohort.name}</b>
            </div>
            <div style={{ font: "400 11px/1.2 var(--ui)", color: "var(--ink-3)" }}>
              {appliedAiCohort.parsedFilter}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ font: "700 14px/1 var(--mono)", color: "var(--violet, #b794f6)" }}>
              {appliedAiCohort.count.toLocaleString()}
            </div>
            <div style={{ font: "500 10px/1 var(--ui)", color: "var(--ink-4)", marginTop: 2 }}>
              Target Customers
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
