import React, { useState } from "react";
import { OP_LABEL, attrById, defaultRule, customSegmentCount } from "@/data/customSegment";

/* CustomSegmentBuilder — a parallel cohort path: AND a few rules, Fetch details
   to get a customer count, then Use this segment (which the parent makes the
   active cohort, clearing the preset selection). Each attribute pre-fills a
   meaningful default value + unit; booleans show Yes/No.

   Props:
     attrs    — attribute definitions (RULE_ATTRS.liquidity / .wealth)
     base     — population the rules narrow (e.g. 75,000)
     rules    — current rule array (lifted state)
     setRules — setter for rules
     count    — fetched count (null until Fetch / after any edit)
     setCount — setter for count
     active   — is the custom segment the active cohort?
     onUse    — parent activates custom (clears presets)
     onClear  — parent deactivates custom (back to presets) */
export default function CustomSegmentBuilder({ attrs, base, rules, setRules, count, setCount, active, onUse, onClear }) {
  const [open, setOpen] = useState((rules && rules.length > 0) || active);

  const add = () => { setRules((cur) => [...cur, defaultRule(attrs)]); setCount(null); };
  const update = (i, patch) => {
    setRules((cur) => cur.map((r, idx) => {
      if (idx !== i) return r;
      const next = { ...r, ...patch };
      if (patch.feature) { const a = attrById(attrs, patch.feature); next.op = a.ops[0]; next.value = a.def; }
      return next;
    }));
    setCount(null);                 // any edit invalidates the fetched count
  };
  const remove = (i) => { setRules((cur) => cur.filter((_, idx) => idx !== i)); setCount(null); };
  const doFetch = () => setCount(customSegmentCount(attrs, rules, base));

  const hasRules = (rules || []).filter((r) => r && r.feature).length > 0;
  const pct = count != null && base ? Math.round((count / base) * 100) : 0;

  return (
    <div className={"csb" + (active ? " is-active" : "")}>
      <button type="button" className="csb-toggle" onClick={() => setOpen((o) => !o)}>
        <span className="csb-caret">{open ? "▾" : "▸"}</span>
        Build a custom segment
        <span className="csb-toggle-sub">rule-defined · alternative to a preset</span>
        {active && count != null && <span className="csb-toggle-badge">{count.toLocaleString()} selected</span>}
      </button>

      {open && (
        <div className="csb-body">
          {!hasRules && <div className="csb-empty">Add a rule to define who qualifies, then Fetch details for the count.</div>}

          {(rules || []).map((r, i) => {
            const attr = attrById(attrs, r.feature) || attrs[0];
            return (
              <div className="csb-rule" key={i}>
                <select className="csb-sel csb-attr" value={r.feature} onChange={(e) => update(i, { feature: e.target.value })}>
                  {attrs.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
                <select className="csb-sel csb-op" value={r.op} onChange={(e) => update(i, { op: e.target.value })}>
                  {attr.ops.map((o) => <option key={o} value={o}>{OP_LABEL[o]}</option>)}
                </select>
                {attr.type === "boolean" ? (
                  <select className="csb-sel csb-val" value={r.value ? "yes" : "no"} onChange={(e) => update(i, { value: e.target.value === "yes" })}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                ) : (
                  <span className="csb-valwrap">
                    {attr.type === "currency" && <span className="csb-pre">$</span>}
                    <input
                      type="number" className="csb-val csb-num"
                      value={r.value} min={attr.min} max={attr.max} step={attr.step}
                      onChange={(e) => update(i, { value: e.target.value === "" ? "" : Number(e.target.value) })}
                    />
                    {attr.unit && attr.type !== "currency" && <span className="csb-unit">{attr.unit}</span>}
                  </span>
                )}
                <button type="button" className="csb-rm" onClick={() => remove(i)} aria-label="Remove rule">×</button>
              </div>
            );
          })}

          <div className="csb-actions">
            <button type="button" className="csb-add" onClick={add}>+ Add rule</button>
            <button type="button" className="csb-fetch" onClick={doFetch} disabled={!hasRules}>Fetch details</button>
          </div>

          {count != null && (
            <div className="csb-result">
              <div className="csb-result-num">
                <span className="csb-result-v">{count.toLocaleString()}</span>
                <span className="csb-result-l">customers match · {pct}% of {base.toLocaleString()}</span>
              </div>
              {active
                ? <button type="button" className="csb-use is-on" onClick={onClear}>✓ Using this segment · switch back to presets</button>
                : <button type="button" className="csb-use" onClick={onUse}>Use this segment →</button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
