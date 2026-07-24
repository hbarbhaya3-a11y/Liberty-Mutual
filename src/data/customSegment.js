/* ============================================================================
   Custom-segment rule builder — model + attribute definitions.

   A parallel way to define the experiment cohort: instead of picking a preset
   segment, the user AND-s a few rules (attribute · operator · value) and clicks
   "Fetch details" to get a customer count. The count is a deterministic mock —
   each rule narrows the addressable base, tighter thresholds → fewer customers
   — so changing $5K → $10K visibly drops the count.

   Each attribute carries a meaningful default + unit + type so the value box is
   pre-filled the moment the attribute is chosen.
   ========================================================================= */

export const OP_LABEL = { gte: "≥", lte: "≤", eq: "is" };

/* type: currency | number | percent | boolean
   baseSel: fraction of the base that matches this rule AT its default value
   half:    the value delta (in the stricter direction) that halves the fraction
   trueSel: (boolean) fraction of the base for which the signal is true */
export const RULE_ATTRS = {
  liquidity: [
    { id: "balance_min",     label: "Idle cash balance",            type: "currency", unit: "$",    def: 5000,   min: 0, max: 250000, step: 1000, ops: ["gte", "lte"], baseSel: 0.95, half: 30000 },
    { id: "dormancy_days",   label: "Days dormant",                 type: "number",   unit: "days", def: 60,     min: 30, max: 365,   step: 5,    ops: ["gte", "lte"], baseSel: 0.90, half: 90 },
    { id: "current_apy",     label: "Current APY earned",           type: "percent",  unit: "%",    def: 0.10,   min: 0, max: 4,      step: 0.05, ops: ["lte", "gte"], baseSel: 0.85, half: 0.15 },
    { id: "yield_gap",       label: "Yield gap vs market",          type: "number",   unit: "pp",   def: 3.5,    min: 0, max: 5,      step: 0.1,  ops: ["gte", "lte"], baseSel: 0.65, half: 1.0 },
    { id: "yield_searches",  label: "In-app yield searches · 90d",  type: "number",   unit: "",     def: 1,      min: 0, max: 10,     step: 1,    ops: ["gte"],        baseSel: 0.42, half: 1.5 },
    { id: "aggregator_login",label: "Aggregator login · 90d",       type: "boolean",  def: true,    ops: ["eq"], trueSel: 0.30 },
    { id: "products_held",   label: "Products held",                type: "number",   unit: "",     def: 1,      min: 1, max: 8,      step: 1,    ops: ["lte", "gte"], baseSel: 0.48, half: 1.3 },
    { id: "tenure_months",   label: "Tenure",                       type: "number",   unit: "mo",   def: 24,     min: 0, max: 240,    step: 6,    ops: ["gte", "lte"], baseSel: 0.78, half: 60 },
  ],
  wealth: [
    { id: "investable_min",  label: "Investable assets",            type: "currency", unit: "$",    def: 100000, min: 0, max: 1000000, step: 10000, ops: ["gte", "lte"], baseSel: 0.55, half: 120000 },
    { id: "held_away",       label: "Held-away / external assets",  type: "currency", unit: "$",    def: 50000,  min: 0, max: 1000000, step: 10000, ops: ["gte"],        baseSel: 0.50, half: 80000 },
    { id: "readiness_days",  label: "Advice-readiness recency",     type: "number",   unit: "days", def: 90,     min: 7, max: 180,     step: 7,     ops: ["lte"],        baseSel: 0.70, half: 60 },
    { id: "external_movement",label: "External-movement signal · 90d", type: "boolean", def: true,  ops: ["eq"], trueSel: 0.35 },
    { id: "planning_intent", label: "Planning / digital intent · 90d", type: "number", unit: "",    def: 1,      min: 0, max: 10,      step: 1,     ops: ["gte"],        baseSel: 0.45, half: 1.5 },
    { id: "products_held",   label: "Products held",                type: "number",   unit: "",     def: 2,      min: 1, max: 8,       step: 1,     ops: ["lte", "gte"], baseSel: 0.60, half: 1.5 },
    { id: "tenure_months",   label: "Tenure",                       type: "number",   unit: "mo",   def: 36,     min: 0, max: 240,     step: 6,     ops: ["gte", "lte"], baseSel: 0.70, half: 72 },
    { id: "life_event",      label: "Life-event signal",            type: "boolean",  def: true,    ops: ["eq"], trueSel: 0.25 },
  ],
};

export const attrById = (attrs, id) => attrs.find((a) => a.id === id);

/* A fresh rule defaults to the first attribute at its default operator + value. */
export function defaultRule(attrs) {
  const a = attrs[0];
  return { feature: a.id, op: a.ops[0], value: a.def };
}

/* Fraction of the base that satisfies one rule. The default value yields the
   attribute's baseSel; moving in the stricter direction halves it every `half`. */
export function ruleSelectivity(attr, op, value) {
  if (!attr) return 1;
  if (attr.type === "boolean") {
    const yes = value === true || value === "true" || value === "yes" || value === 1;
    return yes ? attr.trueSel : Math.max(0.02, 1 - attr.trueSel);
  }
  const v = Number(value), d = attr.def, half = attr.half || 1;
  let sel;
  if (op === "lte") sel = attr.baseSel * Math.pow(0.5, (d - v) / half);
  else if (op === "eq") sel = attr.baseSel * 0.45;
  else sel = attr.baseSel * Math.pow(0.5, (v - d) / half); // gte
  return Math.min(0.98, Math.max(0.02, sel));
}

/* Count of customers matching ALL rules, narrowing the base population. */
export function customSegmentCount(attrs, rules, base) {
  const active = (rules || []).filter((r) => r && r.feature);
  if (!active.length) return 0;
  let frac = 1;
  active.forEach((r) => { frac *= ruleSelectivity(attrById(attrs, r.feature), r.op, r.value); });
  return Math.max(50, Math.round(base * frac));
}

export function formatRuleValue(attr, value) {
  if (!attr) return String(value);
  if (attr.type === "boolean") return value ? "Yes" : "No";
  if (attr.type === "currency") return "$" + Number(value).toLocaleString();
  if (attr.type === "percent") return Number(value).toFixed(2) + "%";
  return Number(value).toLocaleString() + (attr.unit ? " " + attr.unit : "");
}
