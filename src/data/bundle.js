// TwinX · Money Movement data bundle.
// Authored from twinx-l2-spec.md stated values (bundle not supplied).
// Money amounts in CENTS (spec §conventions). reference_date 2026-04-30, seed 42.
// Ported verbatim from the legacy bundle.js IIFE — single source of truth for
// theme/cluster/hypothesis/simulation data across pages.

const manifest = {
  schema_version: "v1", master_seed: 42, reference_date: "2026-04-30",
  population_size: 50000, history_months: 24, transaction_count: 21730442,
  transaction_count_synthesised: 21730442,
  sha256: "1a6f1b31…0975", clusters_sha256: "051ff245…0f853",
  hypotheses_sha256: "b1303432…ac153", simulations_sha256: "523ad42f…61f73",
  cc_sha256: "96d7f1c9…b55c",
};

const themeMap = {
  gig:      { cluster: "cluster_gig_economy_high_velocity",    hyps: ["H-2026-04-12", "H-2026-05-01", "H-2026-05-09"], highlight: "H-2026-04-12" },
  churn:    { cluster: "cluster_mass_affluent_rate_sensitive", hyps: ["H-2026-05-02", "H-2026-05-10"], highlight: null },
  home:     { cluster: "cluster_young_affluent_emergent",      hyps: ["H-2026-04-18", "H-2026-05-08"], highlight: "H-2026-04-18" },
  sweep:    { cluster: "cluster_affluent_stable_multi_banker", hyps: ["H-2026-05-03", "H-2026-05-11"], highlight: null },
  limits:   { cluster: "cluster_small_business_seasonal",      hyps: ["H-2026-05-06"], highlight: null },
  mobile:   { cluster: "cluster_cold_start_new",               hyps: ["H-2026-05-04"], highlight: null },
  newcomer: { cluster: "cluster_mono_product_migrant",         hyps: ["H-2026-05-05"], highlight: null },
  elder:    { cluster: "cluster_retired_stable_low_velocity",  hyps: ["H-2026-04-15", "H-2026-05-07"], highlight: "H-2026-04-15" },
  wallet:   { cluster: null, hyps: [], highlight: null },
  branch:   { cluster: null, hyps: [], highlight: null },
};

const kindLabel = {
  ceiling_lift_on_pattern_match: "Money-Movement Lift",
  tighten_novel_counterparty: "Fraud Tighten",
  coordinated_transition_response: "Life-Event Surge",
  time_of_day_modifier: "Risk Window",
  amount_band_policy: "Rate-Window Policy",
  rail_specific_policy: "Rail Streamline",
};

const FEAT = ["transaction_velocity_30d", "transaction_velocity_90d", "channel_mix_mobile_share", "channel_mix_web_share", "channel_mix_branch_share", "channel_mix_phone_share", "counterparty_diversity_score", "counterparty_novelty_rate_30d", "balance_trajectory_slope_90d", "rail_diversity_score", "time_of_day_concentration", "weekend_share", "p2p_outbound_share", "avg_transaction_amount_cents", "fraud_exposure_history", "contact_centre_call_rate_90d", "digital_engagement_trend", "recurring_pattern_strength", "novel_high_value_rate", "zelle_outbound_share", "wire_outbound_share", "mobile_deposit_rate"];

const centroid = (o) => FEAT.map((f) => (o[f] !== undefined ? o[f] : 0));

const clusters = {
  cluster_gig_economy_high_velocity: {
    cluster_id: "cluster_gig_economy_high_velocity", semantic_name: "Gig Economy · High Velocity",
    population: 200000, population_share: 0.115, drift_state: "stable", current_policy_version: "v3",
    defining_signature: "Irregular multi-platform inflows on a Friday-evening cadence, high transaction velocity, strong recurring landlord rent-day pattern, and elevated P2P outbound share. Cadence and counterparty stability mark a coherent, currently-unowned cohort.",
    centroid: centroid({ transaction_velocity_30d: .88, transaction_velocity_90d: .82, channel_mix_mobile_share: .79, channel_mix_web_share: .14, channel_mix_branch_share: .02, channel_mix_phone_share: .05, counterparty_diversity_score: .71, counterparty_novelty_rate_30d: .34, balance_trajectory_slope_90d: .06, rail_diversity_score: .62, time_of_day_concentration: .68, weekend_share: .41, p2p_outbound_share: .73, avg_transaction_amount_cents: 142500, fraud_exposure_history: .08, contact_centre_call_rate_90d: .07, digital_engagement_trend: .66, recurring_pattern_strength: .81, novel_high_value_rate: .12, zelle_outbound_share: .58, wire_outbound_share: .04, mobile_deposit_rate: .44 }),
  },
  cluster_mass_affluent_rate_sensitive: {
    cluster_id: "cluster_mass_affluent_rate_sensitive", semantic_name: "Mass Affluent · Rate Sensitive",
    population: 6240, population_share: 0.125, drift_state: "rate_sensitive_drift", current_policy_version: "v2",
    defining_signature: "High balances with aggregator-login proxy spikes and small probing transfers to competitor institutions. Rate-elasticity concentrates in a thin sub-tier; the majority of balances are operationally sticky.",
    centroid: centroid({ transaction_velocity_30d: .46, transaction_velocity_90d: .44, channel_mix_mobile_share: .61, channel_mix_web_share: .27, channel_mix_branch_share: .08, channel_mix_phone_share: .04, counterparty_diversity_score: .55, counterparty_novelty_rate_30d: .28, balance_trajectory_slope_90d: -.12, rail_diversity_score: .58, time_of_day_concentration: .42, weekend_share: .22, p2p_outbound_share: .31, avg_transaction_amount_cents: 486000, fraud_exposure_history: .05, contact_centre_call_rate_90d: .11, digital_engagement_trend: .48, recurring_pattern_strength: .52, novel_high_value_rate: .18, zelle_outbound_share: .22, wire_outbound_share: .14, mobile_deposit_rate: .21 }),
  },
  cluster_young_affluent_emergent: {
    cluster_id: "cluster_young_affluent_emergent", semantic_name: "Young Affluent · Emergent",
    population: 3978, population_share: 0.080, drift_state: "stable", current_policy_version: "v2",
    defining_signature: "Long-stable balances broken by a recent large equity-event inflow and first-ever brokerage transfers, accompanied by first aggregator-login proxy events. A coordinated life-event transition with high primacy-capture potential.",
    centroid: centroid({ transaction_velocity_30d: .52, transaction_velocity_90d: .39, channel_mix_mobile_share: .74, channel_mix_web_share: .18, channel_mix_branch_share: .03, channel_mix_phone_share: .05, counterparty_diversity_score: .49, counterparty_novelty_rate_30d: .44, balance_trajectory_slope_90d: .18, rail_diversity_score: .51, time_of_day_concentration: .38, weekend_share: .28, p2p_outbound_share: .36, avg_transaction_amount_cents: 520000, fraud_exposure_history: .04, contact_centre_call_rate_90d: .06, digital_engagement_trend: .71, recurring_pattern_strength: .44, novel_high_value_rate: .39, zelle_outbound_share: .27, wire_outbound_share: .22, mobile_deposit_rate: .33 }),
  },
  cluster_affluent_stable_multi_banker: {
    cluster_id: "cluster_affluent_stable_multi_banker", semantic_name: "Affluent Stable · Multi-Banker",
    population: 5121, population_share: 0.102, drift_state: "stable", current_policy_version: "v2",
    defining_signature: "Stable high balances spread across multiple institutions, idle-cash accumulation, and recurring sweep-like transfers to external brokerage and high-yield destinations. Latent demand for an automated sweep-to-yield product.",
    centroid: centroid({ transaction_velocity_30d: .38, transaction_velocity_90d: .40, channel_mix_mobile_share: .58, channel_mix_web_share: .31, channel_mix_branch_share: .07, channel_mix_phone_share: .04, counterparty_diversity_score: .67, counterparty_novelty_rate_30d: .19, balance_trajectory_slope_90d: .04, rail_diversity_score: .69, time_of_day_concentration: .39, weekend_share: .18, p2p_outbound_share: .21, avg_transaction_amount_cents: 612000, fraud_exposure_history: .04, contact_centre_call_rate_90d: .08, digital_engagement_trend: .55, recurring_pattern_strength: .63, novel_high_value_rate: .14, zelle_outbound_share: .16, wire_outbound_share: .28, mobile_deposit_rate: .18 }),
  },
  cluster_small_business_seasonal: {
    cluster_id: "cluster_small_business_seasonal", semantic_name: "Small Business · Seasonal",
    population: 4406, population_share: 0.088, drift_state: "stable", current_policy_version: "v3",
    defining_signature: "Growing small-business cash flows hitting Zelle and ACH movement ceilings repeatedly, seasonal velocity peaks, and supplier-payment recurring patterns. Signals a need for higher movement tiers.",
    centroid: centroid({ transaction_velocity_30d: .69, transaction_velocity_90d: .58, channel_mix_mobile_share: .52, channel_mix_web_share: .38, channel_mix_branch_share: .06, channel_mix_phone_share: .04, counterparty_diversity_score: .74, counterparty_novelty_rate_30d: .31, balance_trajectory_slope_90d: .09, rail_diversity_score: .77, time_of_day_concentration: .55, weekend_share: .12, p2p_outbound_share: .42, avg_transaction_amount_cents: 328000, fraud_exposure_history: .06, contact_centre_call_rate_90d: .09, digital_engagement_trend: .61, recurring_pattern_strength: .72, novel_high_value_rate: .17, zelle_outbound_share: .49, wire_outbound_share: .16, mobile_deposit_rate: .29 }),
  },
  cluster_cold_start_new: {
    cluster_id: "cluster_cold_start_new", semantic_name: "Cold Start · New",
    population: 4980, population_share: 0.0996, drift_state: "stable", current_policy_version: "v1",
    defining_signature: "Newly opened, mobile-first relationships with sparse history, heavy mobile-deposit reliance, and elevated retry/complaint signatures on a single check-deposit flow. Service-friction risk in the onboarding window.",
    centroid: centroid({ transaction_velocity_30d: .34, transaction_velocity_90d: .21, channel_mix_mobile_share: .86, channel_mix_web_share: .09, channel_mix_branch_share: .01, channel_mix_phone_share: .04, counterparty_diversity_score: .32, counterparty_novelty_rate_30d: .52, balance_trajectory_slope_90d: .11, rail_diversity_score: .34, time_of_day_concentration: .46, weekend_share: .33, p2p_outbound_share: .38, avg_transaction_amount_cents: 96000, fraud_exposure_history: .07, contact_centre_call_rate_90d: .17, digital_engagement_trend: .58, recurring_pattern_strength: .21, novel_high_value_rate: .13, zelle_outbound_share: .31, wire_outbound_share: .03, mobile_deposit_rate: .74 }),
  },
  cluster_mono_product_migrant: {
    cluster_id: "cluster_mono_product_migrant", semantic_name: "Mono Product · Migrant",
    population: 4233, population_share: 0.0847, drift_state: "stable", current_policy_version: "v1",
    defining_signature: "Single-product, thin-file new-to-country households with established cross-border remittance corridors and low product attach. An under-served, growing inflow with deepening headroom.",
    centroid: centroid({ transaction_velocity_30d: .41, transaction_velocity_90d: .36, channel_mix_mobile_share: .81, channel_mix_web_share: .11, channel_mix_branch_share: .04, channel_mix_phone_share: .04, counterparty_diversity_score: .38, counterparty_novelty_rate_30d: .26, balance_trajectory_slope_90d: .07, rail_diversity_score: .44, time_of_day_concentration: .49, weekend_share: .31, p2p_outbound_share: .47, avg_transaction_amount_cents: 78000, fraud_exposure_history: .05, contact_centre_call_rate_90d: .10, digital_engagement_trend: .62, recurring_pattern_strength: .58, novel_high_value_rate: .09, zelle_outbound_share: .21, wire_outbound_share: .33, mobile_deposit_rate: .27 }),
  },
  cluster_retired_stable_low_velocity: {
    cluster_id: "cluster_retired_stable_low_velocity", semantic_name: "Retired Stable · Low Velocity",
    population: 5567, population_share: 0.111, drift_state: "stable", current_policy_version: "v2",
    defining_signature: "Long-tenured, low-velocity retirees with stable balances, high phone-channel reliance, and rare novel counterparties. Elevated exposure to first-ever high-value wires matching elder-financial-exploitation language.",
    centroid: centroid({ transaction_velocity_30d: .18, transaction_velocity_90d: .19, channel_mix_mobile_share: .24, channel_mix_web_share: .21, channel_mix_branch_share: .22, channel_mix_phone_share: .33, counterparty_diversity_score: .29, counterparty_novelty_rate_30d: .11, balance_trajectory_slope_90d: -.02, rail_diversity_score: .41, time_of_day_concentration: .51, weekend_share: .14, p2p_outbound_share: .12, avg_transaction_amount_cents: 214000, fraud_exposure_history: .13, contact_centre_call_rate_90d: .28, digital_engagement_trend: .22, recurring_pattern_strength: .69, novel_high_value_rate: .07, zelle_outbound_share: .08, wire_outbound_share: .19, mobile_deposit_rate: .06 }),
  },
};

const hypotheses = {
  "H-2026-04-12": { hypothesis_id: "H-2026-04-12", cluster_id: "cluster_gig_economy_high_velocity", lifecycle: "cc_winner", highlighted: true, source: "generator", generator_rule_id: "R-recurring-rent-ceiling", intervention: { kind: "ceiling_lift_on_pattern_match", description: "Lift the step-up ceiling by 20% when an inbound/outbound matches a verified recurring landlord rent-day pattern, removing Friday-evening friction for gig depositors.", parameters: { pattern: "recurring_landlord_rent_day", ceiling_lift_pct: 20, detection_window_months: 24, min_recurrence_months: 18, rail: "zelle" } }, predicted_outcome: { friction_events_delta: -236000, nii_contribution: 5600000000, contact_centre_cost_delta: -1680000000, complaint_exposure: -3360 } },
  "H-2026-05-01": { hypothesis_id: "H-2026-05-01", cluster_id: "cluster_gig_economy_high_velocity", lifecycle: "simulated", highlighted: false, source: "generator", generator_rule_id: "R-tod-gig-window", intervention: { kind: "time_of_day_modifier", description: "Relax step-up thresholds during the Friday 4–8 PM gig payout window where verified recurring inflows cluster.", parameters: { window: "fri_16_20", threshold_relax_pct: 15 } }, predicted_outcome: { friction_events_delta: -3100, nii_contribution: 90000000 } },
  "H-2026-05-09": { hypothesis_id: "H-2026-05-09", cluster_id: "cluster_gig_economy_high_velocity", lifecycle: "simulated", highlighted: false, source: "generator", generator_rule_id: "R-rail-p2p", intervention: { kind: "rail_specific_policy", description: "Streamline P2P/Zelle rail limits for high-velocity gig accounts with established counterparties.", parameters: { rail: "zelle", threshold_relax_pct: 10 } }, predicted_outcome: { friction_events_delta: -2200, nii_contribution: 60000000, contact_centre_cost_delta: -40000000 } },
  "H-2026-05-02": { hypothesis_id: "H-2026-05-02", cluster_id: "cluster_mass_affluent_rate_sensitive", lifecycle: "simulated", highlighted: false, source: "generator", generator_rule_id: "R-rate-band", intervention: { kind: "amount_band_policy", description: "Apply a relationship-priced amount-band policy for the rate-elastic affluent sub-tier to defend balances at the moment of probing transfers.", parameters: { bands: [{ lo: 0, hi: 5000000, rate_bps: 0 }, { lo: 5000000, hi: 25000000, rate_bps: 25 }, { lo: 25000000, hi: null, rate_bps: 40 }], pattern: "probing_transfer_to_competitor" } }, predicted_outcome: { nii_contribution: 110000000, friction_events_delta: -900, complaint_exposure: 8 } },
  "H-2026-05-10": { hypothesis_id: "H-2026-05-10", cluster_id: "cluster_mass_affluent_rate_sensitive", lifecycle: "simulated", highlighted: false, source: "generator", generator_rule_id: "R-rate-window", intervention: { kind: "amount_band_policy", description: "Time-boxed rate-window policy that fires only when competitor relative spread breaches a threshold.", parameters: { bands: [{ lo: 0, hi: null, rate_bps: 30 }], pattern: "relative_spread_breach", threshold_relax_pct: 0 } }, predicted_outcome: { nii_contribution: 76000000, complaint_exposure: 11 } },
  "H-2026-04-18": { hypothesis_id: "H-2026-04-18", cluster_id: "cluster_young_affluent_emergent", lifecycle: "cc_winner", highlighted: true, source: "generator", generator_rule_id: "R-equity-transition", intervention: { kind: "coordinated_transition_response", description: "On a detected equity-event transition (large inbound + first-ever brokerage transfer + aggregator-login proxy), open a 14-day primacy window with lifted ceilings, RM hand-off and a wealth-advisory introduction.", parameters: { primacy_window_days: 14, ceiling_lift_pct: 35, rm_handoff: true, wealth_advisory_introduction: true, pattern: "equity_event_transition" } }, predicted_outcome: { nii_contribution: 620000000, friction_events_delta: -640, multi_product_attach_rate_delta: 18, primacy_capture_rate: 25 } },
  "H-2026-05-08": { hypothesis_id: "H-2026-05-08", cluster_id: "cluster_young_affluent_emergent", lifecycle: "simulated", highlighted: false, source: "generator", generator_rule_id: "R-transition-light", intervention: { kind: "coordinated_transition_response", description: "Lighter-touch transition response: lifted ceilings and digital wealth nudge without RM hand-off.", parameters: { primacy_window_days: 10, ceiling_lift_pct: 20, rm_handoff: false, wealth_advisory_introduction: true, pattern: "equity_event_transition" } }, predicted_outcome: { nii_contribution: 210000000, multi_product_attach_rate_delta: 9, primacy_capture_rate: 14 } },
  "H-2026-05-03": { hypothesis_id: "H-2026-05-03", cluster_id: "cluster_affluent_stable_multi_banker", lifecycle: "simulated", highlighted: false, source: "generator", generator_rule_id: "R-sweep-yield", intervention: { kind: "coordinated_transition_response", description: "Detect idle-cash + external-sweep behaviour and introduce an automated sweep-to-yield product before balances leave for a competitor.", parameters: { idle_threshold_cents: 2500000, primacy_window_days: 21, wealth_advisory_introduction: true, pattern: "idle_cash_external_sweep" } }, predicted_outcome: { nii_contribution: 72000000, multi_product_attach_rate_delta: 11, primacy_capture_rate: 12 } },
  "H-2026-05-11": { hypothesis_id: "H-2026-05-11", cluster_id: "cluster_affluent_stable_multi_banker", lifecycle: "simulated", highlighted: false, source: "generator", generator_rule_id: "R-sweep-rail", intervention: { kind: "rail_specific_policy", description: "Streamline external-brokerage transfer rails for stable multi-bankers to keep sweep flows in-house.", parameters: { rail: "ach", threshold_relax_pct: 12 } }, predicted_outcome: { nii_contribution: 34000000, friction_events_delta: -1400 } },
  "H-2026-05-06": { hypothesis_id: "H-2026-05-06", cluster_id: "cluster_small_business_seasonal", lifecycle: "simulated", highlighted: false, source: "generator", generator_rule_id: "R-smb-ceiling", intervention: { kind: "ceiling_lift_on_pattern_match", description: "Lift Zelle/ACH movement ceilings for growing small businesses that repeatedly hit limits on verified supplier-payment patterns.", parameters: { pattern: "supplier_payment_recurring", ceiling_lift_pct: 30, detection_window_months: 12, rail: "zelle" } }, predicted_outcome: { nii_contribution: 210000000, friction_events_delta: -5200, contact_centre_cost_delta: -180000000 } },
  "H-2026-05-04": { hypothesis_id: "H-2026-05-04", cluster_id: "cluster_cold_start_new", lifecycle: "simulated", highlighted: false, source: "generator", generator_rule_id: "R-coldstart-deposit", intervention: { kind: "rail_specific_policy", description: "Streamline the mobile check-deposit flow that concentrates failed-retry and complaint signatures for new, mobile-first relationships.", parameters: { rail: "mobile_deposit", threshold_relax_pct: 0, flow_fix: "retry_friction" } }, predicted_outcome: { friction_events_delta: -4100, contact_centre_cost_delta: -160000000, complaint_exposure: -300, nii_contribution: 88000000 } },
  "H-2026-05-05": { hypothesis_id: "H-2026-05-05", cluster_id: "cluster_mono_product_migrant", lifecycle: "simulated", highlighted: false, source: "generator", generator_rule_id: "R-migrant-corridor", intervention: { kind: "coordinated_transition_response", description: "On established remittance-corridor activity, introduce a next-best product bundle to deepen mono-product newcomer relationships.", parameters: { primacy_window_days: 30, wealth_advisory_introduction: false, pattern: "remittance_corridor_established" } }, predicted_outcome: { nii_contribution: 64000000, multi_product_attach_rate_delta: 13, primacy_capture_rate: 11 } },
  "H-2026-04-15": { hypothesis_id: "H-2026-04-15", cluster_id: "cluster_retired_stable_low_velocity", lifecycle: "cc_winner", highlighted: true, source: "generator", generator_rule_id: "R-efe-novel-wire", intervention: { kind: "tighten_novel_counterparty", description: "On a first-ever high-value wire to a novel beneficiary whose stated purpose matches FinCEN BEC/EFE language, temporarily block and queue trusted-contact outreach.", parameters: { first_ever_threshold_cents: 1000000, pattern: "novel_beneficiary_high_value_with_efe_language", action: "temporary_block", trusted_contact_outreach: true } }, predicted_outcome: { fraud_rate_delta: -1.8, contact_centre_cost_delta: -48000000, complaint_exposure: 12 } },
  "H-2026-05-07": { hypothesis_id: "H-2026-05-07", cluster_id: "cluster_retired_stable_low_velocity", lifecycle: "simulated", highlighted: false, source: "generator", generator_rule_id: "R-efe-tod", intervention: { kind: "time_of_day_modifier", description: "Heighten scrutiny on novel high-value wires during weekday business hours when EFE coercion calls cluster.", parameters: { window: "weekday_10_16", threshold_relax_pct: -20 } }, predicted_outcome: { fraud_rate_delta: -0.7, complaint_exposure: 6 } },
};

const simHeader = { bootstrap_iterations: 1000, ci_level: 0.95, random_seed: 42, cluster_sample_size: 1100 };
const simulations = {
  "H-2026-04-12": { hypothesis_id: "H-2026-04-12", metrics: [{ metric_id: "friction_events_delta", point_estimate: -236000, ci_lower: -255000, ci_upper: -214000, unit: "count", direction: "negative_good" }, { metric_id: "nii_contribution", point_estimate: 5600000000, ci_lower: 3360000000, ci_upper: 7840000000, unit: "usd_cents", direction: "positive_good" }, { metric_id: "contact_centre_cost_delta", point_estimate: -1680000000, ci_lower: -2100000000, ci_upper: -1260000000, unit: "usd_cents", direction: "negative_good" }, { metric_id: "complaint_exposure", point_estimate: -3360, ci_lower: -5040, ci_upper: -1340, unit: "count", direction: "negative_good" }] },
  "H-2026-05-01": { hypothesis_id: "H-2026-05-01", metrics: [{ metric_id: "friction_events_delta", point_estimate: -3100, ci_lower: -3680, ci_upper: -2520, unit: "count", direction: "negative_good" }, { metric_id: "nii_contribution", point_estimate: 90000000, ci_lower: 40000000, ci_upper: 140000000, unit: "usd_cents", direction: "positive_good" }] },
  "H-2026-05-09": { hypothesis_id: "H-2026-05-09", metrics: [{ metric_id: "friction_events_delta", point_estimate: -2200, ci_lower: -2710, ci_upper: -1690, unit: "count", direction: "negative_good" }, { metric_id: "nii_contribution", point_estimate: 60000000, ci_lower: 22000000, ci_upper: 98000000, unit: "usd_cents", direction: "positive_good" }, { metric_id: "contact_centre_cost_delta", point_estimate: -40000000, ci_lower: -58000000, ci_upper: -22000000, unit: "usd_cents", direction: "negative_good" }] },
  "H-2026-05-02": { hypothesis_id: "H-2026-05-02", metrics: [{ metric_id: "nii_contribution", point_estimate: 110000000, ci_lower: 54000000, ci_upper: 166000000, unit: "usd_cents", direction: "positive_good" }, { metric_id: "friction_events_delta", point_estimate: -900, ci_lower: -1340, ci_upper: -460, unit: "count", direction: "negative_good" }, { metric_id: "complaint_exposure", point_estimate: 8, ci_lower: -2.1, ci_upper: 18.0, unit: "count", direction: "negative_good" }] },
  "H-2026-05-10": { hypothesis_id: "H-2026-05-10", metrics: [{ metric_id: "nii_contribution", point_estimate: 76000000, ci_lower: 30000000, ci_upper: 122000000, unit: "usd_cents", direction: "positive_good" }, { metric_id: "complaint_exposure", point_estimate: 11, ci_lower: 1.4, ci_upper: 21.0, unit: "count", direction: "negative_good" }] },
  "H-2026-04-18": { hypothesis_id: "H-2026-04-18", metrics: [{ metric_id: "nii_contribution", point_estimate: 620000000, ci_lower: 380000000, ci_upper: 860000000, unit: "usd_cents", direction: "positive_good" }, { metric_id: "friction_events_delta", point_estimate: -640, ci_lower: -980, ci_upper: -300, unit: "count", direction: "negative_good" }, { metric_id: "multi_product_attach_rate_delta", point_estimate: 18, ci_lower: 11, ci_upper: 25, unit: "pp", direction: "positive_good" }, { metric_id: "primacy_capture_rate", point_estimate: 25, ci_lower: 17, ci_upper: 33, unit: "pct", direction: "positive_good" }] },
  "H-2026-05-08": { hypothesis_id: "H-2026-05-08", metrics: [{ metric_id: "nii_contribution", point_estimate: 210000000, ci_lower: 96000000, ci_upper: 324000000, unit: "usd_cents", direction: "positive_good" }, { metric_id: "multi_product_attach_rate_delta", point_estimate: 9, ci_lower: 3, ci_upper: 15, unit: "pp", direction: "positive_good" }, { metric_id: "primacy_capture_rate", point_estimate: 14, ci_lower: 8, ci_upper: 20, unit: "pct", direction: "positive_good" }] },
  "H-2026-05-03": { hypothesis_id: "H-2026-05-03", metrics: [{ metric_id: "nii_contribution", point_estimate: 72000000, ci_lower: 34000000, ci_upper: 110000000, unit: "usd_cents", direction: "positive_good" }, { metric_id: "multi_product_attach_rate_delta", point_estimate: 11, ci_lower: 5, ci_upper: 17, unit: "pp", direction: "positive_good" }, { metric_id: "primacy_capture_rate", point_estimate: 12, ci_lower: 6, ci_upper: 18, unit: "pct", direction: "positive_good" }] },
  "H-2026-05-11": { hypothesis_id: "H-2026-05-11", metrics: [{ metric_id: "nii_contribution", point_estimate: 34000000, ci_lower: 12000000, ci_upper: 56000000, unit: "usd_cents", direction: "positive_good" }, { metric_id: "friction_events_delta", point_estimate: -1400, ci_lower: -1880, ci_upper: -920, unit: "count", direction: "negative_good" }] },
  "H-2026-05-06": { hypothesis_id: "H-2026-05-06", metrics: [{ metric_id: "nii_contribution", point_estimate: 210000000, ci_lower: 120000000, ci_upper: 300000000, unit: "usd_cents", direction: "positive_good" }, { metric_id: "friction_events_delta", point_estimate: -5200, ci_lower: -6040, ci_upper: -4360, unit: "count", direction: "negative_good" }, { metric_id: "contact_centre_cost_delta", point_estimate: -180000000, ci_lower: -220000000, ci_upper: -140000000, unit: "usd_cents", direction: "negative_good" }] },
  "H-2026-05-04": { hypothesis_id: "H-2026-05-04", metrics: [{ metric_id: "friction_events_delta", point_estimate: -4100, ci_lower: -4780, ci_upper: -3420, unit: "count", direction: "negative_good" }, { metric_id: "contact_centre_cost_delta", point_estimate: -160000000, ci_lower: -198000000, ci_upper: -122000000, unit: "usd_cents", direction: "negative_good" }, { metric_id: "complaint_exposure", point_estimate: -300, ci_lower: -372, ci_upper: -228, unit: "count", direction: "negative_good" }, { metric_id: "nii_contribution", point_estimate: 88000000, ci_lower: 42000000, ci_upper: 134000000, unit: "usd_cents", direction: "positive_good" }] },
  "H-2026-05-05": { hypothesis_id: "H-2026-05-05", metrics: [{ metric_id: "nii_contribution", point_estimate: 64000000, ci_lower: 28000000, ci_upper: 100000000, unit: "usd_cents", direction: "positive_good" }, { metric_id: "multi_product_attach_rate_delta", point_estimate: 13, ci_lower: 6, ci_upper: 20, unit: "pp", direction: "positive_good" }, { metric_id: "primacy_capture_rate", point_estimate: 11, ci_lower: 5, ci_upper: 17, unit: "pct", direction: "positive_good" }] },
  "H-2026-04-15": { hypothesis_id: "H-2026-04-15", metrics: [{ metric_id: "fraud_rate_delta", point_estimate: -1.8, ci_lower: -2.9, ci_upper: -0.2, unit: "bps", direction: "negative_good" }, { metric_id: "contact_centre_cost_delta", point_estimate: -48000000, ci_lower: -66000000, ci_upper: -30000000, unit: "usd_cents", direction: "negative_good" }, { metric_id: "complaint_exposure", point_estimate: 12, ci_lower: 5.1, ci_upper: 18.9, unit: "count", direction: "negative_good" }] },
  "H-2026-05-07": { hypothesis_id: "H-2026-05-07", metrics: [{ metric_id: "fraud_rate_delta", point_estimate: -0.7, ci_lower: -1.4, ci_upper: 0.1, unit: "bps", direction: "negative_good" }, { metric_id: "complaint_exposure", point_estimate: 6, ci_lower: -1.0, ci_upper: 13.0, unit: "count", direction: "negative_good" }] },
};

const championChallenger = {
  "H-2026-04-12": {
    hypothesis_id: "H-2026-04-12", primary_metric: "step_up_friction_rate",
    treatment_fraction: 0.95, weeks_simulated: 6, fires_at_week: 3, stopping_rule_resolution: "winner",
    stream: [
      { week: 1, treatment_n: 1521, control_n: 79, treatment_friction_rate: 0.1024, control_friction_rate: 0.1728, lift_point_estimate: -0.0704, lift_ci_lower: -0.156, lift_ci_upper: 0.004, stopping_rule_fired: false, stopping_rule_resolution: "pending" },
      { week: 2, treatment_n: 3038, control_n: 162, treatment_friction_rate: 0.0970, control_friction_rate: 0.1402, lift_point_estimate: -0.0432, lift_ci_lower: -0.100, lift_ci_upper: 0.005, stopping_rule_fired: false, stopping_rule_resolution: "pending" },
      { week: 3, treatment_n: 4553, control_n: 247, treatment_friction_rate: 0.0997, control_friction_rate: 0.1687, lift_point_estimate: -0.0690, lift_ci_lower: -0.117, lift_ci_upper: -0.024, stopping_rule_fired: true, stopping_rule_resolution: "winner" },
      { week: 4, treatment_n: 6066, control_n: 334, treatment_friction_rate: 0.1025, control_friction_rate: 0.1607, lift_point_estimate: -0.0582, lift_ci_lower: -0.099, lift_ci_upper: -0.021, stopping_rule_fired: true, stopping_rule_resolution: "winner" },
      { week: 5, treatment_n: 7585, control_n: 415, treatment_friction_rate: 0.1011, control_friction_rate: 0.1775, lift_point_estimate: -0.0764, lift_ci_lower: -0.113, lift_ci_upper: -0.041, stopping_rule_fired: true, stopping_rule_resolution: "winner" },
      { week: 6, treatment_n: 9108, control_n: 492, treatment_friction_rate: 0.0995, control_friction_rate: 0.1721, lift_point_estimate: -0.0726, lift_ci_lower: -0.106, lift_ci_upper: -0.041, stopping_rule_fired: true, stopping_rule_resolution: "winner" },
    ],
  },
};

const driftInjections = { total: 380, pattern: "rate_sensitive_drift", byCluster: { cluster_mass_affluent_rate_sensitive: 380 } };
const fraudInjections = { total: 50, pattern: "efe_variant", byCluster: { cluster_retired_stable_low_velocity: 50 } };

const counterpartyAnchors = [
  { node: "landlord", kind: "recurring_obligation", total_customers: 4120 },
  { node: "employer", kind: "income_source",        total_customers: 6890 },
  { node: "family",   kind: "p2p_personal",         total_customers: 5530 },
  { node: "utility",  kind: "recurring_obligation", total_customers: 7240 },
  { node: "broker",   kind: "wealth_destination",   total_customers: 2310 },
  { node: "merchant", kind: "discretionary_spend",  total_customers: 8650 },
];

const personas = [
  { persona_id: "persona_1", name: "Marcus Chen", cluster_id: "cluster_gig_economy_high_velocity",
    bound_hypothesis: "H-2026-04-12", expected_latency_band_ms: [140, 180],
    tagline: "Gig rent day", subtitle: "Multi-platform earner · Friday payout cadence",
    demo_moment: { segment: 2, summary: "Initiates a $1,425 Zelle to landlord on Friday 5:47 PM PT. Legacy $1,200 ceiling would fire a step-up.",
      facts: ["22 observed months of recurring landlord rent-day pattern", "Amount within 95% of historical", "Friday-evening window open"] },
    feature_vector: { transaction_velocity_30d: .91, channel_mix_mobile_share: .84, counterparty_diversity_score: .68, recurring_pattern_strength: .86, zelle_outbound_share: .62, p2p_outbound_share: .77, balance_trajectory_slope_90d: .05 },
    trace: [
      { step: "classify", lines: ["feature_vector → cluster_gig_economy_high_velocity", "latency budget: 140–180 ms"] },
      { step: "match", lines: ["transaction_overlay.landlord_token = recurring_landlord_marcus", "observed_months = 22 (≥ min_recurrence_months = 18) ✓", "friday_evening ✓; amount within 95% of historical ✓"] },
      { step: "policy", lines: ["hypotheses[H-2026-04-12].intervention", "kind = ceiling_lift_on_pattern_match", "ceiling_lift_pct = 20% → effective ceiling = $1,440"] },
      { step: "decision", lines: ["straight_through (under lifted ceiling)"] },
      { step: "outcome", lines: ["friction_events_delta −236,000; nii_contribution +$56M", "contact_centre_cost_delta −$16.8M; complaint_exposure −3,360"] },
    ] },
  { persona_id: "persona_2", name: "Helen Whitaker", cluster_id: "cluster_retired_stable_low_velocity",
    bound_hypothesis: "H-2026-04-15", expected_latency_band_ms: [150, 200],
    tagline: "First wire", subtitle: "Long-tenured retiree · phone-channel reliant",
    demo_moment: { segment: 3, summary: "Attempts an $89,000 wire to a first-ever beneficiary Thursday 2:15 PM PT. Stated purpose matches FinCEN BEC/EFE language.",
      facts: ["First-ever beneficiary (novel counterparty)", "Wire ≥ $10,000 first-ever threshold", "Purpose text matches FinCEN BEC/EFE language", "Phone-channel call rate 0.32 vs cluster median"] },
    feature_vector: { transaction_velocity_30d: .14, channel_mix_phone_share: .41, counterparty_novelty_rate_30d: .09, contact_centre_call_rate_90d: .32, wire_outbound_share: .22, novel_high_value_rate: .06, fraud_exposure_history: .18 },
    trace: [
      { step: "classify", lines: ["feature_vector → cluster_retired_stable_low_velocity"] },
      { step: "match", lines: ["wire_attempt_amount_cents = 8,900,000 (≥ first_ever_threshold_cents = 1,000,000) ✓", "wire_beneficiary_token = novel_beneficiary_bec_pattern (first-ever) ✓", "purpose text matches FinCEN BEC/EFE language ✓"] },
      { step: "policy", lines: ["hypotheses[H-2026-04-15].intervention", "kind = tighten_novel_counterparty", "action = temporary_block; trusted_contact_outreach = true"] },
      { step: "decision", lines: ["temporary_block; queue trusted-contact outreach"] },
      { step: "outcome", lines: ["fraud_rate_delta −1.8 bps; contact_centre_cost_delta −$480K", "complaint_exposure +12 (acceptable: ci_upper 18.9 ≤ 30)"] },
    ] },
  { persona_id: "persona_3", name: "Devon Park", cluster_id: "cluster_young_affluent_emergent",
    bound_hypothesis: "H-2026-04-18", expected_latency_band_ms: [150, 190],
    tagline: "Equity event", subtitle: "21-of-24 stable months · 3-month inflection",
    demo_moment: { segment: 4, summary: "$235,000 large inbound 3 weeks ago. $43,500 ACH to brokerage 4 days ago. Three aggregator-login proxy events (first-ever).",
      facts: ["balance_trajectory_slope_90d = 0.18 (inflection threshold crossed)", "First-ever brokerage transfer", "Aggregator-login proxy events ≥ 1"] },
    feature_vector: { transaction_velocity_30d: .55, channel_mix_mobile_share: .76, counterparty_novelty_rate_30d: .47, balance_trajectory_slope_90d: .18, novel_high_value_rate: .41, wire_outbound_share: .24, digital_engagement_trend: .73 },
    trace: [
      { step: "classify", lines: ["feature_vector → cluster_young_affluent_emergent", "balance_trajectory_slope_90d = 0.18 (inflection threshold crossed) ✓", "first_ever brokerage transfer ✓; aggregator-login proxy events ≥ 1 ✓"] },
      { step: "policy", lines: ["hypotheses[H-2026-04-18].intervention", "kind = coordinated_transition_response", "primacy_window_days = 14; ceiling_lift_pct = 35", "rm_handoff = true; wealth_advisory_introduction = true"] },
      { step: "decision", lines: ["straight_through (within lifted ceiling)", "schedule RM hand-off", "schedule wealth-advisory introduction"] },
      { step: "outcome", lines: ["nii_contribution +$6.2M; friction_events_delta −640", "multi_product_attach_rate_delta +18 pp; primacy_capture_rate 25%"] },
    ] },
];

const TWINX = { manifest, themeMap, kindLabel, FEAT, clusters, hypotheses, simHeader, simulations, championChallenger, driftInjections, fraudInjections, counterpartyAnchors, personas };
export default TWINX;
