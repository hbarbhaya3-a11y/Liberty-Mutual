/* ============================================================================
   ExperimentWorkflow — the inline expansion content for any row in the
   Deploy portfolio table. Renders the full post-staging journey for one
   experiment:

       Staged  →  Approval  →  Compliance  →  Live Pilot (RCT)  →  Promoted

   The horizontal timeline at the top shows which stages are done, which
   one is currently active, which are pending. Underneath, only the
   *currently relevant* panels render — past stages collapse to a one-line
   confirmation, the active stage gets the rich panel, future stages stay
   hidden until reached.

   Live Pilot is the most substantial panel: it's the RCT view, tracking
   realised values against the original simulated predictions week by
   week. The presenter can point at variance and answer "is this on
   track to land where the simulation said it would?"
   ========================================================================= */
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { PERSONA } from "@/components/GlobalTopBar";
import { fmtUnit } from "@/data/projectedRct";

/* ----------------------------------------------------------------------------
   LiveTicker — a small synthetic live-activity strip for the Live Pilot
   header. Three pieces:
     - Pulsing red dot + "LIVE" badge
     - Rotating event text ("47 events in last hour" → "wk 3 day 4 · 18:42" → ...)
     - "Last data refresh · 12s ago" countup
   Updates every 2-3 seconds so the panel visibly *behaves* like a live
   monitor when the user lands on the experiment.
---------------------------------------------------------------------------- */
/* Derive pilot progress from the row's timestamp + total. Two paths:
   - Mock-history rows carry an explicit `pilotWeek` (e.g. 3, 6, 7) — those
     are canned demo states and we honor them verbatim.
   - User-staged rows get pilotWeek=0 on launch — for those we DERIVE from
     pilotStartedAt so the ticker reads "Wk 1 day 1" immediately after
     Go-Live, not the bogus default that used to fall through `|| 3`. */
function derivePilotProgress(row) {
  const pilotTotal = row.pilotTotal || 8;
  /* Mock-history rows: explicit positive pilotWeek wins. */
  if (row.pilotWeek != null && row.pilotWeek > 0) {
    const week = Math.min(pilotTotal, row.pilotWeek);
    const dayOfWeek = 4;
    const day = (week - 1) * 7 + dayOfWeek;
    return { day, week, dayOfWeek, pilotTotal };
  }
  /* Live pilots that just launched: derive everything from pilotStartedAt. */
  if (!row.pilotStartedAt) {
    return { day: 1, week: 1, dayOfWeek: 1, pilotTotal };
  }
  const elapsedMs = Date.now() - row.pilotStartedAt;
  const day = Math.max(1, Math.min(pilotTotal * 7, 1 + Math.floor(elapsedMs / 86_400_000)));
  const week = Math.min(pilotTotal, Math.max(1, Math.ceil(day / 7)));
  const dayOfWeek = ((day - 1) % 7) + 1;
  return { day, week, dayOfWeek, pilotTotal };
}

function LiveTicker({ row }) {
  /* Stable per-row values — computed once from the row's seed, not on every
     render. In a real pilot these snapshot at intake; they don't flicker. */
  const seed = (row.id || "x").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const eligibleInHour = 1240 + (seed * 17) % 380;
  const sentinelAgoSec = 10 + (seed * 7) % 30;
  const { week: pilotWeek, dayOfWeek } = derivePilotProgress(row);

  const events = [
    `${eligibleInHour.toLocaleString()} eligible payments processed in last hour`,
    `Wk ${pilotWeek} day ${dayOfWeek} · treatment cohort active`,
    `Latest fair-lending check · within 0.85 floor`,
    `Auto-rollback armed · last sentinel sweep ${sentinelAgoSec}s ago`,
    `Treatment ${(row.treatmentN || 34500).toLocaleString()} · Control ${(row.controlN || 3850).toLocaleString()} · matched`,
  ];
  const [eventIdx, setEventIdx] = useState(0);
  const [refreshSec, setRefreshSec] = useState(8);
  useEffect(() => {
    const r = setInterval(() => setRefreshSec((s) => (s >= 30 ? 1 : s + 1)), 1000);
    const e = setInterval(() => setEventIdx((i) => (i + 1) % events.length), 3200);
    return () => { clearInterval(r); clearInterval(e); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="wf-live-ticker">
      <span className="wf-live-badge">
        <span className="wf-live-dot" />
        LIVE NOW
      </span>
      <span className="wf-live-event">{events[eventIdx]}</span>
      <span className="wf-live-refresh">data refresh · {refreshSec}s ago</span>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Stage status helpers — derive ordered status array from a row's date
   fields. A row that's currently in approval has staged=done, approval=
   current, everything else pending. A row in live pilot has the first
   three done, pilot current.
---------------------------------------------------------------------------- */
function stagesFor(row) {
  const stagedDone     = !!row.stagedAt;
  const approvalDone   = !!row.approvedAt;
  const complianceDone = !!row.complianceAt;
  const pilotStarted   = !!row.pilotStartedAt;
  const pilotDone      = !!row.pilotEndedAt;
  const promoted       = !!row.promotedAt;

  const sts = (done, isCurrent) =>
    done ? "done" : (isCurrent ? "current" : "pending");

  return [
    { key: "staged",     label: "Staged",     status: sts(true,           !approvalDone && stagedDone),    date: row.stagedAt },
    { key: "approval",   label: "Approval",   status: sts(approvalDone,   stagedDone && !approvalDone),    date: row.approvedAt },
    { key: "compliance", label: "Compliance", status: sts(complianceDone, approvalDone && !complianceDone), date: row.complianceAt },
    { key: "pilot",      label: "Live Pilot", status: sts(pilotDone,      complianceDone && !pilotDone && pilotStarted),    date: row.pilotStartedAt },
    { key: "promoted",   label: "Promoted",   status: sts(promoted,       pilotDone && !promoted),         date: row.promotedAt },
  ];
}

function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ----------------------------------------------------------------------------
   WorkflowTimeline — horizontal stepper across the 5 stages. Done stages
   carry a check + date; current pulses; pending stays muted.
---------------------------------------------------------------------------- */
function WorkflowTimeline({ stages }) {
  return (
    <div className="wf-timeline">
      {stages.map((s, i) => {
        const isLast = i === stages.length - 1;
        return (
          <div key={s.key} className={`wf-step wf-step-${s.status}`}>
            <div className="wf-step-chip">
              {s.status === "done" && <Icon name="check" size={11} strokeWidth={2.5} />}
              {s.status === "current" && <span className="wf-step-pulse" />}
              {s.status === "pending" && <span className="wf-step-pip">{i + 1}</span>}
            </div>
            <div className="wf-step-body">
              <div className="wf-step-label">{s.label}</div>
              <div className="wf-step-date">{s.date ? fmtDate(s.date) : ""}</div>
            </div>
            {!isLast && <div className={`wf-connector wf-connector-${s.status === "done" ? "done" : "pending"}`} />}
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   ApprovalDetail — multi-department parallel sign-off.

   A policy needs sign-off from THREE departments before it can move to
   compliance + RCT launch:
     · Risk (CRO)              — credit + operational risk exposure
     · Business Lead           — the PM running the play (THE USER)
     · Model Risk Management   — SR 11-7 model governance

   For the demo, Risk and MRM are pre-cleared (those teams reviewed the
   pre-flight pack overnight). The Business Lead (you, per the persona)
   is the explicit human-in-the-loop action — you click Approve / Reject /
   Request Changes. When all three depts clear, the row moves to Compliance.
---------------------------------------------------------------------------- */

/* The Business-Lead approver follows the use case: B2C deposit franchises vs
   the B2B commercial bank. Keyed on the themeId carried from Simulate. */
export const BIZ_APPROVER = {
  liquidity: { dept: "Business Lead · Retail & Business Banking",  name: PERSONA.name, role: "Director · Retail & Business Banking" },
  retention: { dept: "Business Lead · Retail & Business Banking",    name: PERSONA.name, role: "Director · Retail & Business Banking" },
  smbrate:   { dept: "Business Lead · Commercial Banking",  name: "Raj Patel",    role: "MD · Commercial Banking" },
  smbgrowth: { dept: "Business Lead · Commercial Banking",  name: "Raj Patel",    role: "MD · Commercial Banking" },
  gig:       { dept: "Business Lead · Retail & Business Banking",      name: PERSONA.name, role: "Director · Retail & Business Banking" },
};
function ApprovalDetail({ row, isCurrent, onApprove, onReject, onRequestChanges }) {
  const rejected = !!row._rejected;
  const changesRequested = !!row._changesRequested;

  /* Department sign-off list. Risk + MRM are pre-cleared on the demo;
     Business Lead is the user's action. When the user approves, the
     row's approvedAt is set and the stage moves on. */
  const userApproved = !!row.approvedAt;
  // The signing-off line of business follows the use case (B2C deposits/idle/gig
  // vs B2B commercial) — keyed on the themeId carried from Simulate.
  const biz = (BIZ_APPROVER[(row.themeId || "").toLowerCase()] || BIZ_APPROVER.gig);
  const depts = row.departmentApprovals || [
    {
      key: "risk", label: "Risk · CRO Office",
      approver: "L. Okafor", role: "Chief Risk Officer", at: row.stagedAt - 6 * 3600 * 1000,
      status: "approved",
      note: "Credit + operational exposure within Q1 envelope; rate-sensitive drift unrelated.",
    },
    {
      key: "biz", label: biz.dept,
      approver: biz.name, role: biz.role,
      at: userApproved ? row.approvedAt : null,
      status: userApproved ? "approved" : (rejected ? "rejected" : (changesRequested ? "changes" : "pending")),
      isYou: true,
      note: userApproved ? (row.approverDecision || "Cleared to advance to compliance review.") : null,
    },
    {
      key: "mrm", label: "Model Risk Management",
      approver: "P. Reyes", role: "MRM lead", at: row.stagedAt - 4 * 3600 * 1000,
      status: "approved",
      note: "SR 11-7 sign-off · model card v3.4 · validation window 0.91 R² pre-pilot.",
    },
  ];

  const allApproved = depts.every((d) => d.status === "approved");
  const youDept = depts.find((d) => d.isYou);

  const statusBadge = allApproved
    ? <><Icon name="check" size={11} strokeWidth={2.5} /> ALL CLEARED</>
    : rejected
      ? <><Icon name="x" size={11} /> REJECTED</>
      : changesRequested
        ? <><Icon name="edit" size={11} /> CHANGES REQUESTED</>
        : <><span className="wf-status-pulse" /> AWAITING YOUR SIGN-OFF</>;

  return (
    <section className={`wf-panel ${isCurrent && !allApproved ? "wf-panel-current" : "wf-panel-done"}`}>
      <header className="wf-panel-h">
        <div className="wf-panel-h-l">
          <span className="wf-panel-status wf-status-done">{statusBadge}</span>
          <span className="wf-panel-title">Approval · 3 departments</span>
          {row.approvedAt && <span className="wf-panel-date">{fmtDate(row.approvedAt)}</span>}
        </div>
        <div className="wf-panel-h-r">
          <span className="wf-approval-progress">
            {depts.filter((d) => d.status === "approved").length} of {depts.length} cleared
          </span>
        </div>
      </header>
      <div className="wf-panel-body">
        <table className="wf-dept-table">
          <tbody>
            {depts.map((d) => (
              <tr key={d.key} className={`wf-dept-row wf-dept-${d.status}`}>
                <td className="wf-dept-status">
                  {d.status === "approved" && <span className="wf-dept-pill wf-dept-pill-ok"><Icon name="check" size={9} strokeWidth={2.5} /> approved</span>}
                  {d.status === "pending"  && <span className="wf-dept-pill wf-dept-pill-pend"><span className="wf-status-pulse" /> pending</span>}
                  {d.status === "rejected" && <span className="wf-dept-pill wf-dept-pill-bad"><Icon name="x" size={9} /> rejected</span>}
                  {d.status === "changes"  && <span className="wf-dept-pill wf-dept-pill-warn"><Icon name="edit" size={9} /> changes</span>}
                </td>
                <td className="wf-dept-dept">
                  <div className="wf-dept-name">
                    {d.label}
                  </div>
                  <div className="wf-dept-sub">
                    {d.approver} · {d.role}
                    {d.at && <> · <span className="wf-dept-date">{fmtDate(d.at)}</span></>}
                  </div>
                </td>
                <td className="wf-dept-note">{d.note || <span className="wf-dept-note-empty">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Action area — only shown when the Business Lead (you) hasn't
            yet acted. Once you approve, the whole row clears and Compliance
            kicks in automatically. */}
        {youDept && youDept.status === "pending" && (
          <div className="wf-pending-actions">
            <button className="wf-btn wf-btn-primary" onClick={() => onApprove && onApprove(row)}>
              <Icon name="check" size={11} strokeWidth={2.5} /> Approve · sign off as Business Lead
            </button>
            <button className="wf-btn" onClick={() => onReject && onReject(row)}>
              <Icon name="x" size={11} /> Reject
            </button>
            <button className="wf-btn" onClick={() => onRequestChanges && onRequestChanges(row)}>
              Request changes
            </button>
          </div>
        )}
        {youDept && youDept.status === "changes" && (
          <div className="wf-pending-actions">
            <div className="wf-pending wf-pending-inline">
              Changes requested · {fmtDate(row._changesRequestedAt)}. Send back to Simulate to adjust the policy, then re-stage.
            </div>
            <button className="wf-btn wf-btn-primary" onClick={() => onApprove && onApprove(row)}>
              <Icon name="check" size={11} strokeWidth={2.5} /> Approve anyway
            </button>
          </div>
        )}
        {youDept && youDept.status === "rejected" && (
          <div className="wf-pending wf-pending-inline">
            Rejected by you · {fmtDate(row._rejectedAt)}. Row is parked in approval — re-open from the row menu to revisit.
          </div>
        )}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   ComplianceDetail — MRM + fair-lending + fraud sign-offs.
---------------------------------------------------------------------------- */
function ComplianceDetail({ row, isCurrent }) {
  const checks = row.complianceChecks || [
    { k: "MRM model card", v: "SR 11-7 compliant · v3.4 audited",     pass: true },
    { k: "Fair-lending",   v: "ECOA cleared · 0.94 disparity margin", pass: true },
    { k: "Fraud envelope", v: "Within Q1 envelope",                    pass: true },
  ];
  return (
    <section className={`wf-panel ${isCurrent ? "wf-panel-current" : "wf-panel-done"}`}>
      <header className="wf-panel-h">
        <div className="wf-panel-h-l">
          <span className="wf-panel-status wf-status-done">
            {isCurrent
              ? <><span className="wf-status-pulse" /> IN COMPLIANCE REVIEW</>
              : <><Icon name="check" size={11} strokeWidth={2.5} /> CLEARED</>}
          </span>
          <span className="wf-panel-title">Compliance</span>
          {row.complianceAt && <span className="wf-panel-date">{fmtDate(row.complianceAt)}</span>}
        </div>
      </header>
      <div className="wf-panel-body">
        <table className="wf-checks">
          <tbody>
            {checks.map((c, i) => (
              <tr key={i}>
                <td className="wf-checks-k">{c.k}</td>
                <td className="wf-checks-v">{c.v}</td>
                <td className="wf-checks-pass">
                  {c.pass
                    ? <span className="wf-pass-good"><Icon name="check" size={10} strokeWidth={2.5} /> pass</span>
                    : <span className="wf-pass-bad"><Icon name="x" size={10} /> fail</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {row.complianceReviewer && (
          <div className="wf-kv-row wf-kv-row-foot">
            <span className="wf-k">Reviewer</span>
            <span className="wf-v">{row.complianceReviewer}</span>
          </div>
        )}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   PilotTrackingChart — RCT chart showing three lines:
     - Treatment cohort realised (solid coloured line) — actual outcomes
     - Control cohort realised   (solid grey line)     — same segment, no policy
     - Predicted treatment effect (dashed blue)        — what the simulation said
   A shaded region fills between the treatment and control lines through
   week N — that area IS the causal lift the experiment is generating.
---------------------------------------------------------------------------- */
function PilotTrackingChart({ kpi, weekNow, weekTotal, preReadout = false }) {
  /* Chart viewBox sizing. H + PB bumped so the line has real vertical
     room and the x-axis labels are legible without squinting. The SVG
     scales horizontally to the card width, so wider cards just give the
     line more horizontal canvas — viewBox numbers stay the same. */
  const W = 340, H = 180, PL = 38, PR = 14, PT = 14, PB = 42;
  const Wks = weekTotal;
  const [hoverWeek, setHoverWeek] = useState(null);

  // Predicted treatment trajectory — full curve, all weeks
  const sim = [];
  for (let w = 0; w <= Wks; w++) sim.push({ w, v: kpi.simShape(w) });

  // Treatment realised — only weeks 0..weekNow, with policy-specific drift
  const treatment = [];
  for (let w = 0; w <= weekNow; w++) {
    const n = (kpi.driftSeed * (w + 1) * 13) % 100 / 100 - 0.5;
    treatment.push({
      w,
      v: kpi.simShape(w) * (1 + (kpi.drift * w / Wks)) + n * 0.01 * Math.abs(kpi.simShape(Wks)),
    });
  }

  // Control realised — small natural drift, no policy effect. Roughly 5-12%
  // of the predicted treatment-effect amplitude with its own noise pattern.
  const control = [];
  for (let w = 0; w <= weekNow; w++) {
    const n = (kpi.driftSeed * 7 * (w + 1)) % 100 / 100 - 0.5;
    const ctrlRamp = kpi.simShape(w) * 0.06;  // tiny natural drift in the same direction
    control.push({
      w,
      v: ctrlRamp + n * 0.012 * Math.abs(kpi.simShape(Wks)),
    });
  }

  const all = sim.map((s) => s.v)
    .concat(treatment.map((s) => s.v))
    .concat(control.map((s) => s.v));
  let mn = Math.min(...all, 0);
  let mx = Math.max(...all, 0);
  if (mn === mx) { mn -= 1; mx += 1; }
  const pad = (mx - mn) * 0.18; mn -= pad; mx += pad;
  const X = (w) => PL + (w / Wks) * (W - PL - PR);
  const Y = (v) => PT + (1 - (v - mn) / (mx - mn)) * (H - PT - PB);

  const simPath = sim.map((s) => `${X(s.w).toFixed(1)},${Y(s.v).toFixed(1)}`).join(" ");
  const txPath = treatment.map((s) => `${X(s.w).toFixed(1)},${Y(s.v).toFixed(1)}`).join(" ");
  const ctrlPath = control.map((s) => `${X(s.w).toFixed(1)},${Y(s.v).toFixed(1)}`).join(" ");

  // Lift area — polygon between treatment and control through week N.
  const liftArea = (() => {
    if (treatment.length < 2) return null;
    const top = treatment.map((s) => `${X(s.w).toFixed(1)},${Y(s.v).toFixed(1)}`);
    const bot = control.slice().reverse().map((s) => `${X(s.w).toFixed(1)},${Y(s.v).toFixed(1)}`);
    return [...top, ...bot].join(" ");
  })();

  // Treatment colour varies by KPI (NII blue, blocked & complaints green,
  // fair-lending green). Control always grey.
  const txColor = kpi.txColor || "var(--green, #42e08b)";
  const liftFill = kpi.txColor === "var(--acq, #5b9dff)" ? "var(--acq, #5b9dff)" : "var(--green, #42e08b)";

  return (
    <div className="wf-tracking-wrap">
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" className="wf-tracking-svg" preserveAspectRatio="xMidYMid meet">
      {/* Now marker — vertical line at week N */}
      <line x1={X(weekNow)} y1={PT} x2={X(weekNow)} y2={H - PB}
            stroke="var(--acc, #ffb15a)" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
      <text x={X(weekNow) + 4} y={PT + 9} fontSize="7" fontWeight="700" fontFamily="var(--mono)"
            fill="var(--acc, #ffb15a)">wk {weekNow}</text>

      {/* Zero baseline */}
      <line x1={PL} y1={Y(0).toFixed(1)} x2={W - PR} y2={Y(0).toFixed(1)}
            stroke="var(--ink-4)" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.4" />

      {/* Lift area — shaded region between treatment and control. Suppressed
          during pre-readout (wk 0–1) — no causal claim yet, so no shading. */}
      {!preReadout && liftArea && (
        <polygon points={liftArea} fill={liftFill} opacity="0.22" />
      )}

      {/* Predicted treatment effect (thin dashed reference) — always shown.
          During pre-readout this is the ONLY visible line: the prediction
          we're going to measure against once cohort enrolment completes. */}
      <polyline points={simPath} fill="none"
                stroke="var(--ink-3)" strokeWidth={preReadout ? "1.6" : "1.2"}
                strokeDasharray="5 4" opacity={preReadout ? "0.75" : "0.55"}
                strokeLinejoin="round" strokeLinecap="round" />

      {/* Control cohort — thin dashed grey line + small RING markers per week.
          Distinct from treatment (solid bold + filled markers) so the eye
          reads them as different even in monochrome / colorblind contexts. */}
      {!preReadout && (
        <>
          <polyline points={ctrlPath} fill="none"
                    stroke="var(--ink-3)" strokeWidth="1.6"
                    strokeDasharray="2 2" opacity="0.85"
                    strokeLinejoin="round" strokeLinecap="round" />
          {control.map((s) => (
            <circle key={`ctrl-m-${s.w}`}
                    cx={X(s.w).toFixed(1)} cy={Y(s.v).toFixed(1)} r="3"
                    fill="var(--panel)" stroke="var(--ink-3)" strokeWidth="1.4" />
          ))}
        </>
      )}

      {/* Treatment cohort — solid bold coloured line + FILLED markers per
          week + soft drop-shadow glow underneath. This is the headline
          line — every styling cue (weight, fill, shadow) emphasises it
          against the thin dashed control. Suppressed pre-readout. */}
      {!preReadout && (
        <>
          {/* Soft halo glow under the treatment line — duplicate stroke
              with low opacity + wider weight gives a subtle prominence
              without needing a CSS filter. */}
          <polyline points={txPath} fill="none"
                    stroke={txColor} strokeWidth="7" opacity="0.18"
                    strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={txPath} fill="none"
                    stroke={txColor} strokeWidth="3"
                    strokeLinejoin="round" strokeLinecap="round" />
          {treatment.map((s, i) => {
            const isLast = i === treatment.length - 1;
            return (
              <circle key={`tx-m-${s.w}`}
                      cx={X(s.w).toFixed(1)} cy={Y(s.v).toFixed(1)}
                      r={isLast ? "4.5" : "3.4"}
                      fill={txColor} stroke="var(--panel)" strokeWidth="1.5" />
            );
          })}
        </>
      )}

      {/* Pre-readout overlay — small label over the chart's empty area so
          the user understands the dashed line is the *prediction*, not the
          realised effect. */}
      {preReadout && (
        <text x={(PL + W - PR) / 2} y={PT + (H - PT - PB) / 2} textAnchor="middle"
              fontSize="7" fontWeight="700" fontFamily="var(--mono)"
              fill="var(--ink-3)" letterSpacing="0.08em">
          PREDICTED CURVE · NO READOUT YET
        </text>
      )}

      {/* X-axis ticks */}
      {Array.from({ length: Wks + 1 }, (_, i) => i).map((w) => (
        <text key={w} x={X(w)} y={H - PB + 14} textAnchor="middle"
              fontSize="7" fontWeight="600" fontFamily="var(--mono)" fill="var(--ink-3)">
          {w === 0 ? "0" : `${w}`}
        </text>
      ))}
      {/* X-axis label — small and unobtrusive so the chart's body (the
          actual lines + lift area) reads as the primary content, not the
          labels around it. */}
      <text x={(PL + W - PR) / 2} y={H - 6} textAnchor="middle"
            fontSize="6.5" fontFamily="var(--mono)" fill="var(--ink-4)"
            letterSpacing="0.08em">
        WEEKS SINCE START
      </text>

      {/* Hover crosshair + markers — only shows when hoverWeek is set and
          within the realised range (hovering future weeks just shows the
          predicted dot on the dashed line). */}
      {hoverWeek != null && (() => {
        const txAt   = treatment[Math.min(treatment.length - 1, hoverWeek)];
        const ctrlAt = control[Math.min(control.length - 1, hoverWeek)];
        const predAt = sim[hoverWeek];
        const hasRealised = hoverWeek <= weekNow;
        return (
          <g pointerEvents="none">
            <line x1={X(hoverWeek)} y1={PT} x2={X(hoverWeek)} y2={H - PB}
                  stroke="var(--ink)" strokeWidth="0.8" opacity="0.32" />
            {hasRealised && txAt && (
              <circle cx={X(txAt.w).toFixed(1)} cy={Y(txAt.v).toFixed(1)}
                      r="3.5" fill={txColor} stroke="var(--panel)" strokeWidth="1.2" />
            )}
            {hasRealised && ctrlAt && (
              <circle cx={X(ctrlAt.w).toFixed(1)} cy={Y(ctrlAt.v).toFixed(1)}
                      r="2.8" fill="var(--ink-3)" stroke="var(--panel)" strokeWidth="1" />
            )}
            {predAt && (
              <circle cx={X(predAt.w).toFixed(1)} cy={Y(predAt.v).toFixed(1)}
                      r="2.5" fill="var(--ink-3)" stroke="var(--panel)" strokeWidth="1"
                      strokeDasharray="2 1.5" opacity="0.7" />
            )}
          </g>
        );
      })()}

      {/* Hit-target rects — one per integer week, wider than the visible
          cell so hover is forgiving. Pointer events stay on these
          transparent rects; the rest of the chart is decorative. */}
      {Array.from({ length: Wks + 1 }, (_, i) => i).map((w) => {
        const cellW = (W - PL - PR) / Wks;
        return (
          <rect
            key={`h-${w}`}
            x={X(w) - cellW / 2} y={0}
            width={cellW} height={H}
            fill="transparent"
            onMouseEnter={() => setHoverWeek(w)}
            onMouseLeave={() => setHoverWeek(null)}
            style={{ cursor: "crosshair" }}
          />
        );
      })}
    </svg>

    {hoverWeek != null && (() => {
      const txAt   = treatment[Math.min(treatment.length - 1, hoverWeek)];
      const ctrlAt = control[Math.min(control.length - 1, hoverWeek)];
      const predAt = sim[hoverWeek];
      const hasRealised = hoverWeek <= weekNow;
      const liftV = (txAt && ctrlAt && hasRealised) ? (txAt.v - ctrlAt.v) : null;
      return (
        <div className="wf-rct-tip">
          <div className="wf-rct-tip-h">wk {hoverWeek}{hoverWeek > weekNow && <span className="wf-rct-tip-future"> · future</span>}</div>
          {hasRealised ? (
            <>
              <div className="wf-rct-tip-row">
                <span className="wf-rct-tip-sw" style={{ background: txColor }} />
                <span className="wf-rct-tip-k">treatment</span>
                <span className="wf-rct-tip-v">{formatKpi(kpi, txAt.v)}</span>
              </div>
              <div className="wf-rct-tip-row">
                <span className="wf-rct-tip-sw" style={{ background: "var(--ink-3)" }} />
                <span className="wf-rct-tip-k">control</span>
                <span className="wf-rct-tip-v">{formatKpi(kpi, ctrlAt.v)}</span>
              </div>
              {liftV != null && (
                <div className="wf-rct-tip-row wf-rct-tip-row-lift">
                  <span className="wf-rct-tip-k">causal lift</span>
                  <span className="wf-rct-tip-v">{formatKpi(kpi, liftV)}</span>
                </div>
              )}
            </>
          ) : (
            <div className="wf-rct-tip-row wf-rct-tip-row-future">
              <span className="wf-rct-tip-k">treatment realised will land here once the pilot reaches this week</span>
            </div>
          )}
          {predAt && (
            <div className="wf-rct-tip-row">
              <span className="wf-rct-tip-sw wf-rct-tip-sw-dashed" />
              <span className="wf-rct-tip-k">predicted</span>
              <span className="wf-rct-tip-v">{formatKpi(kpi, predAt.v)}</span>
            </div>
          )}
        </div>
      );
    })()}
    </div>
  );
}

/* Legend used once at the top of the RCT grid (rather than redrawing it on
   every chart). Three small swatches with labels. */
function LiveLegend() {
  return (
    <div className="wf-rct-legend">
      <span className="wf-rct-leg-item">
        <span className="wf-rct-leg-sw wf-rct-leg-tx" />
        Treatment cohort (realised)
      </span>
      <span className="wf-rct-leg-item">
        <span className="wf-rct-leg-sw wf-rct-leg-ctrl" />
        Control cohort (realised)
      </span>
      <span className="wf-rct-leg-item">
        <span className="wf-rct-leg-sw wf-rct-leg-pred" />
        Predicted effect (simulation)
      </span>
      <span className="wf-rct-leg-item">
        <span className="wf-rct-leg-sw wf-rct-leg-lift" />
        Causal lift (treatment − control)
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   buildRctKpis — pick the metrics an RCT actually measures based on what
   the experiment is testing. Three archetypes:

     · friction       (gig ceiling lift, payout-window relax, rail re-route)
                      → NII · Blocked · Complaints
     · deepening      (subscription stacking, B2B ladder, life-event capture)
                      → NII · Adoption · Attach · Engagement
     · loss-prevention (elder protection, fraud-pattern wire hold)
                      → Fraud rate · Loss avoided · False-positive holds

   A friction experiment without `includeDeepening` should NOT show
   "Follow-on attach" — that's a deepening metric and irrelevant to the
   policy being tested. Detection priority: explicit row.experimentType
   first, then row.includeDeepening flag, then cluster + name heuristics.
---------------------------------------------------------------------------- */
function buildRctKpis(row) {
  const name = (row.name || "").toLowerCase();
  const cluster = (row.cluster || "").toLowerCase();
  const explicit = row.experimentType;

  /* Per-row hash drives deterministic variation across pilots so every
     RCT has its own chart fingerprint — same row always renders the
     same shapes, different rows look visibly different. */
  const rowSeed = (row.id || "x").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hashAt = (n) => {
    const x = Math.sin(rowSeed * 1031 + n * 137.3) * 10000;
    return x - Math.floor(x); // [0, 1)
  };
  /* magScale: ±22% of the base magnitude per KPI slot. */
  const magScale = (n) => 0.78 + hashAt(n) * 0.44;
  /* tauScale: ±28% of the base time constant — controls how fast the
     KPI ramps to steady state. Slower-ramp pilots feel different from
     fast-ramp pilots even at the same asymptote. */
  const tauScale = (n) => 0.72 + hashAt(n + 7) * 0.56;
  /* driftScale: ±40% on how much treatment diverges from prediction.
     Some pilots over-perform vs sim, others under-perform — gives the
     variance chips real diversity instead of all reading "lift on track". */
  const driftScale = (n) => 0.6 + hashAt(n + 13) * 0.8;
  /* Per-row driftSeed offset so the per-week noise pattern looks unique
     per pilot. The seed is added to the base seed for each KPI slot. */
  const seedOffset = (n) => Math.floor(hashAt(n + 19) * 97);

  /* Use-case-aware KPI sets, keyed off the staged policy's themeId. This
     takes priority over the name/cluster regexes below (the deepening
     regex matches "primacy"/"b2b"/"wealth" and would otherwise wrongly
     capture retention/SMB rows). Magnitudes are tuned to the formatKpi
     conventions: $M-ish keys render as +$X.XXM, *_pp keys as +X.X pp,
     count-ish keys as plain numbers. Each KPI keeps the per-row scaling
     (magScale/tauScale/driftScale/seedOffset) so pilots still vary. */
  const theme = (row.themeId || "").toLowerCase();
  const expo = (mag, tau) => (w) => mag * (1 - Math.exp(-w / tau));

  /* CONTEXTUAL PATH — when the staged policy carries projected outcomes, the
     RCT tracks THOSE exact KPIs. The predicted curve ramps to each projected
     value (no magnitude jitter, so the dashed line matches what the user saw
     in results); per-row tau/drift still give the realised line its texture.
     Each KPI carries its own unit formatter. */
  if (row.projected?.kpis?.length) {
    return row.projected.kpis.map((kpi, idx) => {
      const n = idx + 1;
      const mag = kpi.value;                              // predicted asymptote = the projection
      const tau = (kpi.tau || 2.2) * tauScale(n);
      return {
        key: kpi.key,
        label: kpi.label,
        fmt: (v) => fmtUnit(v, kpi.unit),
        simShape: (w) => mag * (1 - Math.exp(-w / tau)),
        drift: (kpi.drift ?? 0.04) * driftScale(n),
        driftSeed: (13 + idx * 10) + seedOffset(n),
        simAtEnd: mag,
      };
    });
  }

  if (theme === "liquidity") {
    const a = 11.4 * magScale(1), b = -7.2 * magScale(2), c = 8.0 * magScale(3);
    return [
      { key: "nii",          label: "Net interest income",     simShape: expo(a, 2.2 * tauScale(1)), drift: 0.04 * driftScale(1), driftSeed: 13 + seedOffset(1), simAtEnd: a },
      { key: "flight_pp",    label: "Idle-cash flight (Δ pp)",  simShape: expo(b, 1.8 * tauScale(2)), drift: 0.05 * driftScale(2), driftSeed: 23 + seedOffset(2), simAtEnd: b },
      { key: "activated_pp", label: "Balances activated (pp)",  simShape: expo(c, 2.2 * tauScale(3)), drift: 0.04 * driftScale(3), driftSeed: 37 + seedOffset(3), simAtEnd: c },
    ];
  }
  if (theme === "retention") {
    const a = 11.0 * magScale(1), b = -5.4 * magScale(2), c = 8.0 * magScale(3);
    return [
      { key: "retained_pp", label: "Retained deposits",            simShape: expo(a, 2.2 * tauScale(1)), drift: 0.04 * driftScale(1), driftSeed: 13 + seedOffset(1), simAtEnd: a },
      { key: "runoff_pp",   label: "Deposit runoff (Δ pp)",        simShape: expo(b, 1.8 * tauScale(2)), drift: 0.05 * driftScale(2), driftSeed: 23 + seedOffset(2), simAtEnd: b },
      { key: "dd_pp",       label: "Direct-deposit recovery (pp)", simShape: expo(c, 2.4 * tauScale(3)), drift: 0.04 * driftScale(3), driftSeed: 37 + seedOffset(3), simAtEnd: c },
    ];
  }
  if (theme === "smbrate") {
    const a = 41.0 * magScale(1), b = -6.5 * magScale(2), c = 5.2 * magScale(3);
    return [
      { key: "margin_m",      label: "Margin defended ($M/yr)",         simShape: expo(a, 2.2 * tauScale(1)), drift: 0.04 * driftScale(1), driftSeed: 13 + seedOffset(1), simAtEnd: a },
      { key: "deflection_pp", label: "Rate-shopping deflection (Δ pp)", simShape: expo(b, 1.8 * tauScale(2)), drift: 0.05 * driftScale(2), driftSeed: 23 + seedOffset(2), simAtEnd: b },
      { key: "retained_pp",   label: "Balances retained (pp)",          simShape: expo(c, 2.2 * tauScale(3)), drift: 0.04 * driftScale(3), driftSeed: 37 + seedOffset(3), simAtEnd: c },
    ];
  }
  if (theme === "smbgrowth") {
    const a = 28.0 * magScale(1), b = 6.0 * magScale(2), c = 5.5 * magScale(3);
    return [
      { key: "balances_m",  label: "New deposit balances ($M)", simShape: expo(a, 2.4 * tauScale(1)), drift: 0.05 * driftScale(1), driftSeed: 13 + seedOffset(1), simAtEnd: a },
      { key: "growth_pp",   label: "Relationship growth (pp)",  simShape: expo(b, 2.0 * tauScale(2)), drift: 0.06 * driftScale(2), driftSeed: 23 + seedOffset(2), simAtEnd: b },
      { key: "attach_pp",   label: "Cross-sell attach (pp)",    simShape: expo(c, 2.4 * tauScale(3)), drift: 0.04 * driftScale(3), driftSeed: 37 + seedOffset(3), simAtEnd: c },
    ];
  }
  /* Wealth attach — investable-assets / advisory metric set. Used as the
     fallback for mock wealth rows; staged wealth pilots take the projected
     path above with their own computed magnitudes. */
  if (theme === "wealth") {
    const a = 9.2 * magScale(1), b = 184 * magScale(2), c = -2.4 * magScale(3), d = 320 * magScale(4);
    return [
      { key: "aum_m",     label: "Incremental AUM ($M)",       simShape: expo(a, 2.4 * tauScale(1)), drift: 0.05 * driftScale(1), driftSeed: 13 + seedOffset(1), simAtEnd: a },
      { key: "newrel",    label: "New wealth relationships",   simShape: expo(b, 2.2 * tauScale(2)), drift: 0.04 * driftScale(2), driftSeed: 23 + seedOffset(2), simAtEnd: b, fmt: (v) => `+${Math.round(v).toLocaleString()}` },
      { key: "flight_pp", label: "External flight (Δ pp)",     simShape: expo(c, 1.8 * tauScale(3)), drift: 0.05 * driftScale(3), driftSeed: 37 + seedOffset(3), simAtEnd: c },
      { key: "fee_k",     label: "Fee revenue ($K)",           simShape: expo(d, 2.0 * tauScale(4)), drift: 0.04 * driftScale(4), driftSeed: 47 + seedOffset(4), simAtEnd: d, fmt: (v) => `+$${Math.round(v).toLocaleString()}K` },
    ];
  }

  /* Loss-prevention / fraud experiments — completely different metric set. */
  const isLossPrev = explicit === "loss-prevention"
    || /elder|fraud|wire.hold|exploitation/.test(name + " " + cluster);
  if (isLossPrev) {
    const fraudMag = -2.1 * magScale(1);
    const fraudTau = 1.8  * tauScale(1);
    const lossMag  = 3.8  * magScale(2);
    const lossTau  = 2.0  * tauScale(2);
    const fprMag   = 1.7  * magScale(3);
    const fprTau   = 2.4  * tauScale(3);
    return [
      { key: "fraud_bps", label: "Fraud rate (Δ bps)",
        simShape: (w) => fraudMag * (1 - Math.exp(-w / fraudTau)),
        drift: 0.05 * driftScale(1), driftSeed: 17 + seedOffset(1),
        simAtEnd: fraudMag },
      { key: "loss_avoided", label: "Loss avoided",
        simShape: (w) => lossMag * (1 - Math.exp(-w / lossTau)),
        drift: 0.03 * driftScale(2), driftSeed: 29 + seedOffset(2),
        simAtEnd: lossMag },
      { key: "fpr", label: "False-positive holds",
        simShape: (w) => fprMag * (1 - Math.exp(-w / fprTau)),
        drift: 0.04 * driftScale(3), driftSeed: 43 + seedOffset(3),
        simAtEnd: fprMag },
    ];
  }

  /* Deepening experiments — cross-sell / attach / adoption focus. */
  const isDeepening = explicit === "deepening"
    || row.includeDeepening === true
    || /subscription|b2b|wholesale|ladder|sma.bridge|earned.wage|life.event|wealth|primacy|attach/.test(name + " " + cluster);
  if (isDeepening) {
    const niiMag    = 7.2   * magScale(1);
    const niiTau    = 2.2   * tauScale(1);
    const adoptMag  = 0.184 * magScale(2);
    const adoptTau  = 2.0   * tauScale(2);
    const attachMag = 0.178 * magScale(3);
    const attachTau = 2.4   * tauScale(3);
    const engMag    = 1.6   * magScale(4);
    const engTau    = 1.9   * tauScale(4);
    return [
      { key: "nii", label: "Net Interest Income",
        simShape: (w) => niiMag * (1 - Math.exp(-w / niiTau)),
        drift: 0.05 * driftScale(1), driftSeed: 13 + seedOffset(1),
        simAtEnd: niiMag },
      { key: "adoption", label: "Adoption rate",
        simShape: (w) => adoptMag * (1 - Math.exp(-w / adoptTau)),
        drift: 0.06 * driftScale(2), driftSeed: 19 + seedOffset(2),
        simAtEnd: adoptMag },
      { key: "attach", label: "Follow-on attach",
        simShape: (w) => attachMag * (1 - Math.exp(-w / attachTau)),
        drift: 0.03 * driftScale(3), driftSeed: 41 + seedOffset(3),
        simAtEnd: attachMag },
      { key: "engagement", label: "Engagement (sessions/wk)",
        simShape: (w) => engMag * (1 - Math.exp(-w / engTau)),
        drift: 0.04 * driftScale(4), driftSeed: 53 + seedOffset(4),
        simAtEnd: engMag },
    ];
  }

  /* Default — friction-removal experiments (the most common). NO attach
     here; that's a deepening metric. */
  const niiMag      = 11.9    * magScale(1);
  const niiTau      = 2.2     * tauScale(1);
  const blockedMag  = -29300  * magScale(2);
  const blockedTau  = 1.6     * tauScale(2);
  const compMag     = -840    * magScale(3);
  const compTau     = 2.0     * tauScale(3);
  return [
    { key: "nii", label: "Net Interest Income",
      simShape: (w) => niiMag * (1 - Math.exp(-w / niiTau)),
      drift: 0.04 * driftScale(1), driftSeed: 13 + seedOffset(1),
      simAtEnd: niiMag },
    { key: "blocked", label: "Blocked payments",
      simShape: (w) => blockedMag * (1 - Math.exp(-w / blockedTau)),
      drift: -0.08 * driftScale(2), driftSeed: 21 + seedOffset(2),
      simAtEnd: blockedMag },
    { key: "comp", label: "Complaints",
      simShape: (w) => compMag * (1 - Math.exp(-w / compTau)),
      drift: 0.16 * driftScale(3), driftSeed: 31 + seedOffset(3),
      simAtEnd: compMag },
  ];
}

/* ----------------------------------------------------------------------------
   LiveRctPage — the dedicated live-RCT page that opens as an overlay
   when the user clicks "View live RCT" from the row or the link panel.
   This is the only renderer for live performance — the inline expanded
   row shows just a compact LiveRctLinkPanel.

   Page composition:
     1. HEADER — name, hypothesis ID, week badge, start date, close button
     2. INTEGRATION & APPROVAL TRAIL — SFMC, sentinels, audit, approver,
        compliance reviewer · one strip across the page
     3. LIVE PERFORMANCE — 2-col grid of PilotTrackingChart cards, each
        with treatment / control / lift figures + variance chip
     4. INTERIM LEARNINGS — week-tagged observations gathered so far
     5. FOOTER — next milestone + auto-rollback status pinned at bottom

   The chart-aspect-ratio bug (`preserveAspectRatio="none"` stretching
   the SVG horizontally) is fixed via CSS `aspect-ratio` on the wrapper
   so the SVG always renders in its native 340×180 proportion.
---------------------------------------------------------------------------- */
export function LiveRctPage({ row, onClose }) {
  /* Synthetic-but-deterministic KPI tracking. simShape is the original
     simulated curve; drift is how the realised diverges (small for
     well-tracking KPIs, larger for off-track). Pilot progress is derived
     from pilotStartedAt — see derivePilotProgress() above — so a freshly
     launched pilot reads "Wk 1" rather than the previously-defaulted Wk 3. */
  const { week: wkNow, pilotTotal: wkTotal } = derivePilotProgress(row);

  /* PRE-READOUT GATE — for the first ~2 weeks of a real RCT, cohort
     enrolment is still ramping and there's nothing statistically meaningful
     to report. Suppress all "realised value" UI in that window and show
     enrolment progress instead. Mock-history rows all have pilotWeek >= 2
     so this only affects freshly-launched (user-staged + approved) rows. */
  const PRE_READOUT_THRESHOLD = 2;
  const isPreReadout = wkNow < PRE_READOUT_THRESHOLD;
  const fullTreatmentN = row.treatmentN || 34500;
  const fullControlN   = row.controlN   || 3850;
  /* Enrolment ramp — fresh pilots accrue customers over real time.
     The math: linear ramp from 0% → 100% across the 2-week pre-readout
     window (336 hours). A pilot that just launched a minute ago reads
     ~0.005% enrolled, not the previously-hardcoded 22%. We clamp to a
     small minimum (a handful of customers always show as "first in") so
     the screen never reads "0 enrolled, RCT live". Mock-history rows
     past wk 2 hit the `else` branch and show full enrolment. */
  const elapsedMs   = row.pilotStartedAt ? Math.max(0, Date.now() - row.pilotStartedAt) : 0;
  const elapsedHrs  = elapsedMs / 3_600_000;
  const PRE_READOUT_WINDOW_HRS = PRE_READOUT_THRESHOLD * 7 * 24; // 336h
  const enrolmentPct = isPreReadout
    ? Math.min(0.98, Math.max(0.003, elapsedHrs / PRE_READOUT_WINDOW_HRS))
    : 1.0;
  const treatmentNow = Math.round(fullTreatmentN * enrolmentPct);
  const controlNow   = Math.round(fullControlN   * enrolmentPct);
  const readoutWeek  = Math.max(PRE_READOUT_THRESHOLD, wkNow + 1);
  /* Sub-day granularity for the "Wk 1 day 1 · hour H" label that
     fresh-launch users see — once the first day rolls over, the
     normal week/day display takes over. */
  const isFirstDay = isPreReadout && elapsedHrs < 24;
  const hoursIn    = Math.max(1, Math.floor(elapsedHrs)) + (elapsedHrs < 1 ? 0 : 0);
  /* RCT KPIs are experiment-type-aware. Friction-removal pilots track
     NII / Blocked / Complaints. Deepening pilots add Attach. Loss-
     prevention pilots track Fraud / Loss-avoided / False-positive holds
     instead. Mock-history rows can override the whole thing via
     row.rctKpis; otherwise we derive from row.experimentType + flags. */
  const kpis = row.rctKpis || buildRctKpis(row);

  /* For each KPI compute the realised value for *both* cohorts at week N,
     then express the causal lift (treatment − control) and compare it to
     the predicted lift (simShape at N). Variance status is graded on
     |lift − predicted| relative to the magnitude of the predicted effect. */
  const enriched = kpis.map((k) => {
    const predictedNow = k.simShape(wkNow);
    const txNoise   = (k.driftSeed * (wkNow + 1) * 13) % 100 / 100 - 0.5;
    const ctrlNoise = (k.driftSeed * 7 * (wkNow + 1)) % 100 / 100 - 0.5;
    const txNow   = k.simShape(wkNow) * (1 + (k.drift * wkNow / wkTotal))
                    + txNoise * 0.01 * Math.abs(k.simShape(wkTotal));
    const ctrlNow = k.simShape(wkNow) * 0.06
                    + ctrlNoise * 0.012 * Math.abs(k.simShape(wkTotal));
    const liftNow = txNow - ctrlNow;
    const liftAtEnd = k.simShape(wkTotal) * 0.94;

    // % difference of realised lift vs predicted effect
    const simAbs = Math.abs(predictedNow) || 1;
    const variancePct = ((liftNow - predictedNow) / simAbs) * 100;
    const absV = Math.abs(variancePct);
    const status = absV < 7 ? "ok" : absV < 15 ? "warn" : "bad";
    return { ...k, predictedNow, txNow, ctrlNow, liftNow, liftAtEnd, variancePct, status };
  });

  /* Integration & approval trail — synthesizes status pills for the
     downstream systems the policy is wired into, plus the human approval
     trail. Each pill carries a label, a one-line `detail`, and a list
     of `metrics` (k/v pairs) that include realistic system IDs so the
     user can cross-reference the pilot in each downstream system. IDs
     follow each system's actual conventions:
       · SFMC Journey resources use 8-4-4-4-12 hex GUIDs
       · SFMC Data Extension external keys are uppercase_with_underscores
       · Internal services use prefix-numeric IDs (POL-/SENT-/AUDIT-/RT-) */
  const seed = (row.stagedAt || 1700000000000) % 100000;
  const hex = (n, len) => (n.toString(16) + "0".repeat(len)).slice(0, len);
  const journeyGuid =
    `${hex(0xa3b2c1 + seed, 8)}-${hex(0x4d7f + seed, 4)}-${hex(0x4a2c + seed, 4)}-${hex(0xb1e6 + seed, 4)}-${hex(0x9c4f2d + seed, 12)}`;
  const policyId   = `POL-${(row.id || "rct").toString().slice(-6).toUpperCase()}-${(seed % 1000).toString().padStart(3, "0")}`;
  const sentinelId = `SENT-${5800 + (seed % 400)}`;
  const ticketId   = `AUDIT-${24000 + (seed % 5000)}`;
  const routeId    = `RT-${1000 + (seed % 900)}`;
  const txPct  = Math.round(fullTreatmentN / (fullTreatmentN + fullControlN) * 100);
  const ctrlPct = 100 - txPct;

  const integrationPills = [
    {
      id: "sfmc",
      label: "SFMC · Marketing Cloud",
      detail: isPreReadout
        ? "Comms journey injecting cohort"
        : "Comms journey live · all channels healthy",
      ok: true,
      metrics: [
        { k: "Journey",          v: "RTP-Lift · Pre-payday · v3" },
        { k: "Journey ID",       v: journeyGuid },
        { k: "Data Extension",   v: "DE_RTPLift_Treatment" },
        { k: "Org",              v: "usb_mc_prod · MID 7104822" },
        { k: "Channels",         v: "In-app · Push · Email" },
        { k: "Delivery rate",    v: isPreReadout ? "22% (ramping)" : "96.4%" },
        { k: "Cadence",          v: "3 / wk · pre-payday window" },
        { k: "Last sync",        v: "14s ago" },
      ],
    },
    {
      id: "sentinels",
      label: "Auto-rollback sentinels",
      detail: "Fair-lending + fraud envelope · armed",
      ok: true,
      metrics: [
        { k: "Sentinel ID",      v: sentinelId },
        { k: "Fair-lending",     v: "margin 0.94 · floor 0.85" },
        { k: "Fraud envelope",   v: "−0.02 bps · within Q1 bound" },
        { k: "Trip action",      v: "Auto-suspend + alert" },
        { k: "Pager",            v: "Risk on-call · A. Mehta · #risk-paging" },
      ],
    },
    {
      id: "audit",
      label: "Audit scheduler",
      detail: `Next interim · wk ${Math.min(wkTotal, wkNow + 2)}`,
      ok: true,
      metrics: [
        { k: "Ticket ID",        v: ticketId },
        { k: "Next interim",     v: `Wk ${Math.min(wkTotal, wkNow + 2)} · fair-lending margin check` },
        { k: "Quarterly ECOA",   v: "Apr 14 · scheduled" },
        { k: "Reviewer",         v: row.complianceReviewer?.replace(/.*·\s*/, "") || "Risk & Compliance" },
        { k: "Model card",       v: "v3.4 · SR 11-7 valid" },
      ],
    },
    {
      id: "gateway",
      label: "Policy gateway",
      detail: `Routing ${isPreReadout ? "ramping" : "stable"} · ${Math.round(enrolmentPct * 100)}% enrolled`,
      ok: true,
      metrics: [
        { k: "Policy ID",        v: policyId },
        { k: "Route ID",         v: routeId },
        { k: "Status",           v: isPreReadout ? "Cohort ramp in progress" : "Stable — production traffic" },
        { k: "Enrolled",         v: `${Math.round(enrolmentPct * 100)}% of ${(fullTreatmentN + fullControlN).toLocaleString()}` },
        { k: "Split (tx/ctrl)",  v: `${txPct} / ${ctrlPct}` },
        { k: "p95 latency",      v: "47 ms" },
      ],
    },
  ];
  const approvalPills = [
    row.approverName && { id: "approver", label: "Approved by",
      detail: `${row.approverName}${row.approverRole ? " · " + row.approverRole : ""}${row.approvedAt ? " · " + fmtDate(row.approvedAt) : ""}`,
      ok: true },
    row.complianceReviewer && { id: "compliance", label: "Compliance",
      detail: `${row.complianceReviewer}${row.complianceAt ? " · " + fmtDate(row.complianceAt) : ""}`,
      ok: true },
  ].filter(Boolean);

  return (
    <div className="lrp">
      {/* HEADER — three clearly-separated zones, no auto-margin reflow
          collisions. Row 1: back button alone. Row 2: title + status
          badge. Row 3: meta + cohort summary. */}
      <header className="lrp-h">
        <div className="lrp-h-back-row">
          <button className="lrp-back" onClick={onClose} title="Back to Deploy (Esc)">
            <Icon name="arrowLeft" size={13} /> Back to Deploy
          </button>
        </div>
        <div className="lrp-h-title-row">
          <h1 className="lrp-h-name">{row.name}</h1>
          <span className="lrp-h-status">
            <span className="wf-status-pulse" />
            LIVE PILOT · {isFirstDay
              ? `DAY 1 · HR ${hoursIn}`
              : `WK ${wkNow} / ${wkTotal}`}
          </span>
        </div>
        <div className="lrp-h-meta-row">
          <span className="lrp-h-meta">
            Hypothesis {row.hypothesis}
            {row.pilotStartedAt && <> · started {fmtDate(row.pilotStartedAt)}</>}
            {row.stagedBy && <> · staged by {row.stagedBy === "autopilot" ? "Autopilot" : "User"}</>}
          </span>
          <span className="lrp-h-cohorts">
            Treatment <b>{treatmentNow.toLocaleString()}</b> · Control <b>{controlNow.toLocaleString()}</b>
            {isPreReadout && <> · enrolling ({Math.round(enrolmentPct * 100)}%)</>}
          </span>
        </div>
      </header>

      {/* INTEGRATION + APPROVAL — both rendered as `<details>` accordions
          collapsed by default so the live performance section is the
          first substantive content the user sees. The summaries surface
          a "N systems · all ok" count so the user knows the metadata is
          there without expanding. */}
      <details className="lrp-acc">
        <summary className="lrp-acc-h">
          <span className="lrp-acc-h-l">
            <h2 className="lrp-acc-title">Integration</h2>
            <span className="lrp-acc-sub">
              {integrationPills.length} downstream systems · all ok
            </span>
          </span>
          <span className="lrp-acc-chev">
            <Icon name="chevronDown" size={13} />
          </span>
        </summary>
        <div className="lrp-acc-body">
          <div className="lrp-trail-grid">
            {integrationPills.map((p) => (
              <div key={p.id} className={"lrp-pill " + (p.ok ? "lrp-pill-ok" : "lrp-pill-warn")}>
                <span className="lrp-pill-dot" />
                <div className="lrp-pill-body">
                  <span className="lrp-pill-l">{p.label}</span>
                  <span className="lrp-pill-d">{p.detail}</span>
                  {p.metrics && p.metrics.length > 0 && (
                    <ul className="lrp-pill-metrics">
                      {p.metrics.map((m, i) => (
                        <li key={i}>
                          <span className="lrp-pill-metric-k">{m.k}</span>
                          <span className="lrp-pill-metric-v">{m.v}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>

      {approvalPills.length > 0 && (
        <details className="lrp-acc">
          <summary className="lrp-acc-h">
            <span className="lrp-acc-h-l">
              <h2 className="lrp-acc-title">Approval & compliance trail</h2>
              <span className="lrp-acc-sub">
                {approvalPills.length} sign-off{approvalPills.length === 1 ? "" : "s"} on file
              </span>
            </span>
            <span className="lrp-acc-chev">
              <Icon name="chevronDown" size={13} />
            </span>
          </summary>
          <div className="lrp-acc-body">
            <div className="lrp-trail-grid">
              {approvalPills.map((p) => (
                <div key={p.id} className="lrp-pill lrp-pill-approval">
                  <span className="lrp-pill-icon">
                    <Icon name="check" size={10} strokeWidth={2.5} />
                  </span>
                  <div className="lrp-pill-body">
                    <span className="lrp-pill-l">{p.label}</span>
                    <span className="lrp-pill-d">{p.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {/* LIVE TICKER — rotating sample events. Sells "the system is doing
          work right now." */}
      <LiveTicker row={row} />

      {/* LIVE PERFORMANCE — the core charts. 2-col grid; each card holds
          the KPI label + variance chip + treatment / control / lift /
          predicted values + the tracking chart. The chart wrapper
          enforces aspect-ratio so the SVG never stretches. */}
      <section className="lrp-perf">
        <div className="lrp-section-h">
          <h2 className="lrp-section-title">Live performance</h2>
          <p className="lrp-section-sub">
            {isPreReadout
              ? <>Cohort enrolment in progress · no causal readout yet. First interim readout at <b>wk {readoutWeek}</b>.</>
              : <>Treatment vs control measurement against the predicted effect. The shaded area between the lines is the <b>causal lift</b> the policy is producing.</>}
          </p>
        </div>
        <LiveLegend />
        <div className="lrp-perf-grid">
          {enriched.map((k) => (
            <div key={k.key} className="lrp-kpi-card">
              {/* Top band — KPI label + variance chip, plus hero number
                  and support inline. Compact: leaves the bulk of the
                  card height to the chart underneath. */}
              <div className="lrp-kpi-top">
                <div className="lrp-kpi-top-l">
                  <div className="lrp-kpi-label">{k.label}</div>
                  <div className="lrp-kpi-hero-k">
                    {isPreReadout ? "Treatment enrolled" : "Causal lift · wk " + wkNow}
                  </div>
                  <div className={"lrp-kpi-hero-v " + (isPreReadout ? "lrp-kpi-hero-v-tx" : "lrp-kpi-hero-v-lift")}>
                    {isPreReadout ? treatmentNow.toLocaleString() : formatKpi(k, k.liftNow)}
                  </div>
                </div>
                <div className="lrp-kpi-top-r">
                  {isPreReadout ? (
                    <span className="wf-rct-variance wf-rct-variance-pre">
                      <span className="wf-status-pulse" /> pre-significance · wk {readoutWeek}
                    </span>
                  ) : (
                    <span className={`wf-rct-variance wf-rct-variance-${k.status}`}>
                      {k.status === "ok" && <><Icon name="check" size={9} strokeWidth={2.5} /> lift on track</>}
                      {k.status === "warn" && <>± {Math.abs(k.variancePct).toFixed(1)}% drift vs predicted</>}
                      {k.status === "bad" && <>± {Math.abs(k.variancePct).toFixed(1)}% off predicted</>}
                    </span>
                  )}
                  <div className="lrp-kpi-support">
                    {isPreReadout ? (
                      <>
                        <span><span className="lrp-kpi-support-k">control</span><span className="lrp-kpi-support-v lrp-kpi-support-v-ctrl">{controlNow.toLocaleString()}</span></span>
                        <span><span className="lrp-kpi-support-k">predicted wk {wkTotal}</span><span className="lrp-kpi-support-v">{formatKpi(k, k.simShape(wkTotal))}</span></span>
                      </>
                    ) : (
                      <>
                        <span><span className="lrp-kpi-support-k">treatment</span><span className="lrp-kpi-support-v lrp-kpi-support-v-tx">{formatKpi(k, k.txNow)}</span></span>
                        <span><span className="lrp-kpi-support-k">control</span><span className="lrp-kpi-support-v lrp-kpi-support-v-ctrl">{formatKpi(k, k.ctrlNow)}</span></span>
                        <span><span className="lrp-kpi-support-k">predicted</span><span className="lrp-kpi-support-v">{formatKpi(k, k.predictedNow)}</span></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* CHART — now gets the body of the card (~240px tall) so
                  the trajectory is actually readable. The values above
                  give the precise numbers; the chart shows the shape. */}
              <div className="lrp-chart-wrap">
                <PilotTrackingChart kpi={k} weekNow={wkNow} weekTotal={wkTotal} preReadout={isPreReadout} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INTERIM LEARNINGS — week-tagged observations captured during
          the live pilot. Renders only when the row has findings (mock
          data so user-staged rows skip this until findings are added). */}
      {row.interimFindings && row.interimFindings.length > 0 && (
        <section className="lrp-interim">
          <div className="lrp-section-h">
            <h2 className="lrp-section-title">Interim learnings · weeks 1–{wkNow}</h2>
            <p className="lrp-section-sub">Observations captured during the live pilot — not final, may shift as more data lands.</p>
          </div>
          <ul className="wf-rct-interim-list">
            {row.interimFindings.map((f, i) => (
              <li key={i} className={"wf-rct-interim-item wf-rct-interim-item-" + (f.tone || "neutral")}>
                <span className="wf-rct-interim-wk">wk {f.wk}</span>
                <span className={"wf-rct-interim-dot wf-rct-interim-dot-" + (f.tone || "neutral")} />
                <span className="wf-rct-interim-text">{f.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* FOOTER — next milestone + auto-rollback status. Pinned to the
          bottom of the page. */}
      <footer className="lrp-foot">
        <div className="lrp-foot-l">
          <span className="lrp-foot-k">Next milestone</span>
          <span className="lrp-foot-v">
            {isPreReadout
              ? `Wk ${readoutWeek} · first causal readout (cohort enrolment complete)`
              : (row.nextMilestone || `Wk ${Math.min(wkTotal, wkNow + 2)} · interim fair-lending audit`)}
          </span>
        </div>
        <div className="lrp-foot-r">
          <span className="wf-rct-foot-pill wf-rct-foot-pill-good">
            <Icon name="check" size={10} strokeWidth={2.5} /> Auto-rollback armed
          </span>
        </div>
      </footer>
    </div>
  );
}

function formatKpi(k, v) {
  if (typeof k.fmt === "function") return k.fmt(v);
  if (k.key === "nii")          return `${v >= 0 ? "+" : ""}$${v.toFixed(2)}M`;
  if (k.key === "fair")         return v.toFixed(2);
  if (k.key === "blocked")      return Math.round(v).toLocaleString();
  if (k.key === "comp")         return Math.round(v).toLocaleString();
  if (k.key === "attach")       return `${(v * 100).toFixed(1)}%`;
  if (k.key === "adoption")     return `${(v * 100).toFixed(1)}%`;
  if (k.key === "engagement")   return `${v.toFixed(1)}/wk`;
  if (k.key === "fraud_bps")    return `${v >= 0 ? "+" : ""}${v.toFixed(1)} bps`;
  if (k.key === "loss_avoided") return `$${v.toFixed(1)}M`;
  if (k.key === "fpr")          return `${v.toFixed(1)}%`;
  /* Use-case KPI keys: *_m render as $M income/balances, *_pp as pp deltas. */
  if (k.key.endsWith("_m"))     return `${v >= 0 ? "+" : ""}$${v.toFixed(1)}M`;
  if (k.key.endsWith("_pp"))    return `${v >= 0 ? "+" : ""}${v.toFixed(1)} pp`;
  return v.toFixed(2);
}

/* ----------------------------------------------------------------------------
   GoLiveReadyDetail — explicit human-in-the-loop CTA between Compliance
   clearing and the RCT actually launching. Shows the pilot config summary
   (duration, cohort sizes, KPIs we'll measure, guardrails armed) and the
   big "Go Live with RCT" button. This is the moment the user explicitly
   decides to put real customer traffic through the policy.
---------------------------------------------------------------------------- */
function GoLiveReadyDetail({ row, onGoLive }) {
  const wkTotal = row.pilotTotal || 8;
  /* Total enrolled cohort N is fixed by the upstream sim — what the user
     controls here is the SPLIT between treatment and control. Default
     90/10 is the standard for a high-statistical-power RCT (control is
     just the audit baseline). User can step to 80/20 (faster causal
     readout at lower power) or 50/50 (equal-arm classical RCT). */
  const fixedTotal = (row.treatmentN || 34500) + (row.controlN || 3850);
  const [treatmentPct, setTreatmentPct] = useState(() => {
    const t = row.treatmentN || 34500;
    const c = row.controlN || 3850;
    return Math.round((t / (t + c)) * 100);
  });
  const treatmentN = Math.round((fixedTotal * treatmentPct) / 100);
  const controlN = fixedTotal - treatmentN;

  /* Power readout shifts with the split. 90/10 = strong NII point estimate,
     weaker control precision; 50/50 = symmetric, tighter both-side CI but
     fewer treated customers helped during the pilot. */
  const powerLabel =
    treatmentPct >= 85 ? "High treatment power · audit-class control"
    : treatmentPct >= 70 ? "Balanced power · classical RCT"
    : "Equal-arm RCT · symmetric precision";

  const launch = () => {
    /* Pass the user-edited split through to handleGoLive so the launching
       sequence and live pilot read the right cohort sizes. */
    onGoLive && onGoLive({ ...row, treatmentN, controlN });
  };

  return (
    <section className="wf-panel wf-panel-current wf-panel-golive">
      <header className="wf-panel-h">
        <div className="wf-panel-h-l">
          <span className="wf-panel-status wf-status-pilot">
            <span className="wf-status-pulse" /> READY TO LAUNCH
          </span>
          <span className="wf-panel-title">Go Live with RCT</span>
        </div>
      </header>
      <div className="wf-panel-body">
        <div className="wf-golive-note">
          All three departmental approvals cleared. Compliance checks passed. The policy is ready to enter a controlled RCT. Adjust the treatment/control split below if you want different statistical power — auto-rollback is armed and will trip on any guardrail breach.
        </div>

        {/* Treatment / control split control. Three presets cover the
            common operating points; the resulting absolute cohort sizes
            update live so the user sees the consequence of their choice
            before launching. */}
        <div className="wf-golive-split">
          <div className="wf-golive-split-h">
            <div>
              <div className="wf-golive-split-l">Treatment / Control split</div>
              <div className="wf-golive-split-power">{powerLabel}</div>
            </div>
            <div className="wf-golive-split-presets">
              {[90, 80, 50].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={"wf-golive-split-preset" + (treatmentPct === p ? " is-on" : "")}
                  onClick={() => setTreatmentPct(p)}
                >
                  {p} / {100 - p}
                </button>
              ))}
            </div>
          </div>
          <div className="wf-golive-split-bar">
            <div className="wf-golive-split-bar-tx" style={{ flex: treatmentPct }}>
              <div className="wf-golive-split-bar-label">
                <span className="wf-golive-split-bar-pct">{treatmentPct}%</span>
                <span className="wf-golive-split-bar-name">Treatment</span>
                <span className="wf-golive-split-bar-n">{treatmentN.toLocaleString()} customers</span>
              </div>
            </div>
            <div className="wf-golive-split-bar-ctrl" style={{ flex: 100 - treatmentPct }}>
              <div className="wf-golive-split-bar-label">
                <span className="wf-golive-split-bar-pct">{100 - treatmentPct}%</span>
                <span className="wf-golive-split-bar-name">Control</span>
                <span className="wf-golive-split-bar-n">{controlN.toLocaleString()} customers</span>
              </div>
            </div>
          </div>
          <div className="wf-golive-split-foot">
            Total enrolled <b>{fixedTotal.toLocaleString()}</b> customers · matched on cluster signature · split applied at policy-gateway routing
          </div>
        </div>

        <div className="wf-golive-summary">
          <div className="wf-golive-summary-cell">
            <span className="wf-golive-k">Duration</span>
            <span className="wf-golive-v">{wkTotal} weeks</span>
          </div>
          <div className="wf-golive-summary-cell">
            <span className="wf-golive-k">Primary KPIs</span>
            <span className="wf-golive-v">{buildRctKpis(row).map((k) => k.label).join(" · ")}</span>
          </div>
          <div className="wf-golive-summary-cell">
            <span className="wf-golive-k">Guardrails</span>
            <span className="wf-golive-v">Fair-lending floor · fraud envelope · auto-rollback</span>
          </div>
          <div className="wf-golive-summary-cell">
            <span className="wf-golive-k">First interim audit</span>
            <span className="wf-golive-v">Wk 2 · fair-lending margin check</span>
          </div>
        </div>
        <div className="wf-golive-actions">
          <button className="wf-btn wf-btn-primary wf-btn-lg" onClick={launch}>
            <Icon name="play" size={12} /> Go Live with RCT
          </button>
          <span className="wf-golive-hint">
            Auto-rollback armed · interim audits scheduled · you'll be alerted on any guardrail trip
          </span>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   LaunchingDetail — the transition between "Ready to Go Live" and the
   actual live pilot. Renders when handleGoLive has been called but
   pilotStartedAt hasn't been set yet (the ~3-second launch window).

   Walks through a small staged sequence ("allocating treatment cohort
   → routing first traffic → arming sentinels → connected") so the user
   sees the system doing visible work rather than the UI snapping from
   Ready straight into Live.
---------------------------------------------------------------------------- */
/* ----------------------------------------------------------------------------
   LaunchingModal — prominent viewport-level modal rendered by the parent
   DeployWorkspace while a row's `_launching` flag is true. Shows the
   SFMC + sentinel + audit + gateway handshake sequence center-stage so
   the integration plumbing is unmistakably the story during launch.

   Each step carries:
     - `system`   : upstream service label (chip color-coded)
     - `text`     : the action being taken right now
     - `meta`     : optional ID line surfacing realistic identifiers from
                    the respective system (SFMC Journey GUIDs, DE keys,
                    sentinel pager IDs, audit ticket IDs, route IDs)
   ID shapes follow the actual conventions of each system — SFMC uses
   8-4-4-4-12 GUIDs for Journey API resources + uppercase external-key
   strings for Data Extensions; internal services use prefix-numeric
   conventions (POL-/SENT-/AUDIT-/RT-).
---------------------------------------------------------------------------- */
export function LaunchingModal({ row }) {
  const treatmentRaw = row.treatmentN || 34500;
  const controlRaw   = row.controlN   || 3850;
  const treatment = treatmentRaw.toLocaleString();
  const control   = controlRaw.toLocaleString();
  /* Treatment / control split percentages — surfaced in the policy
     gateway step's meta line so the user sees the same split they
     chose on the Go-Live panel echoed back during launch. */
  const txPct   = Math.round((treatmentRaw / (treatmentRaw + controlRaw)) * 100);
  const ctrlPct = 100 - txPct;
  /* Realistic IDs derived from the row's stagedAt timestamp so they're
     deterministic per pilot but unique across pilots. */
  const seed = (row.stagedAt || Date.now()) % 100000;
  const hex = (n, len) => (n.toString(16) + "0".repeat(len)).slice(0, len);
  const journeyGuid =
    `${hex(0xa3b2c1 + seed, 8)}-${hex(0x4d7f + seed, 4)}-${hex(0x4a2c + seed, 4)}-${hex(0xb1e6 + seed, 4)}-${hex(0x9c4f2d + seed, 12)}`;
  const ticketId    = `AUDIT-${24000 + (seed % 5000)}`;
  const sentinelId  = `SENT-${5800 + (seed % 400)}`;
  const policyId    = `POL-${(row.id || "rct").toString().slice(-6).toUpperCase()}-${(seed % 1000).toString().padStart(3, "0")}`;
  const routeId     = `RT-${1000 + (seed % 900)}`;

  /* Step short-key derived from the policy seed — used inside SFMC
     external-key strings so a viewer can read the realistic resource
     naming convention. */
  const seedShort = seed.toString().padStart(5, "0");

  /* The SFMC integration is intentionally given the most granular
     coverage in this sequence (7 substeps) so the user can follow each
     piece of the Marketing Cloud handshake: OAuth → Journey fetch → DE
     upsert (treatment + control) → Send Classification → Frequency-cap
     + suppression → Journey entry event. This is the part of the launch
     that's most failure-prone in real deployments, so it gets the
     visual airtime. */
  const steps = [
    // ── Cohort engine ──
    { system: "cohort",  text: `Allocating treatment cohort · ${treatment} customers`,
      meta: `cohort_id=${policyId}-TX · cluster=gig-economy` },
    { system: "cohort",  text: `Allocating control cohort · ${control} customers · matched on cluster signature`,
      meta: `cohort_id=${policyId}-CTRL · match=propensity-score k=8` },

    // ── SFMC (7 substeps, the prominent block) ──
    { system: "sfmc",    text: "Requesting OAuth 2.0 token from Salesforce Marketing Cloud",
      meta: `endpoint=auth.exacttargetapis.com · grant_type=client_credentials · scope=journeys.write+contacts.write` },
    { system: "sfmc",    text: `Fetching Journey "RTP-Lift · Pre-payday" definition`,
      meta: `journey_id=${journeyGuid} · version=3 · status=Published` },
    { system: "sfmc",    text: `Upserting treatment cohort into Data Extension`,
      meta: `DE=DE_RTPLift_Treatment · external_key=RTP_LIFT_TX_${seedShort} · rows=${treatment}` },
    { system: "sfmc",    text: `Upserting control cohort into Data Extension`,
      meta: `DE=DE_RTPLift_Control · external_key=RTP_LIFT_CTRL_${seedShort} · rows=${control}` },
    { system: "sfmc",    text: "Validating Send Classification & Sender Profile",
      meta: `send_class=SC_Marketing_Default · sender_profile=USB_Money_Movement · CAN-SPAM ok` },
    { system: "sfmc",    text: "Applying frequency-cap rules · global suppression list honored",
      meta: `freq_cap=3/wk · suppression=GLOBAL_HONOR + COMPLIANCE_OPT_OUT + DO_NOT_CONTACT` },
    { system: "sfmc",    text: "Triggering Journey entry event for treatment cohort",
      meta: `event=usb_rtp_lift_enter · journey_status=Running · contacts_entering=${treatment}` },

    // ── Policy gateway ──
    { system: "gateway", text: "Routing first treatment-arm traffic through policy gateway",
      meta: `route_id=${routeId} · weight=tx:${txPct} ctrl:${ctrlPct} · ramp=5 min` },

    // ── Sentinels ──
    { system: "sentinel", text: "Arming auto-rollback sentinels · fair-lending margin + fraud envelope",
      meta: `sentinel_id=${sentinelId} · pager=risk-oncall-A.Mehta · trip=auto-suspend` },

    // ── Audit ──
    { system: "audit",   text: "Scheduling interim audits · wk 2 fair-lending check · wk 4 ECOA snapshot",
      meta: `ticket_id=${ticketId} · reviewer=J.Reyes · cadence=interim+quarterly` },

    // ── Live ──
    { system: "live",    text: "RCT live · routing production traffic",
      meta: `policy_id=${policyId} · status=active` },
  ];
  /* Per-step delay tuned so the user can actually READ each step — 700ms
     gives a comfortable beat between transitions. SFMC steps are
     identical in cadence to other steps; the prominence comes from there
     being more of them in a row (~5s of SFMC attention out of ~9s total). */
  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => {
    if (stepIdx >= steps.length - 1) return;
    const t = setTimeout(() => setStepIdx((i) => i + 1), 700);
    return () => clearTimeout(t);
  }, [stepIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const completedSteps = steps.slice(0, stepIdx);
  const activeStep = steps[stepIdx];
  const totalSteps = steps.length;
  const progressPct = Math.round((stepIdx / (totalSteps - 1)) * 100);

  return (
    <div className="lm-overlay" role="dialog" aria-modal="true" aria-label="Launching RCT">
      <div className="lm-overlay-bg" />
      <div className="lm-card">
        <header className="lm-h">
          <div className="lm-h-status">
            <span className="wf-status-pulse" /> LAUNCHING · {progressPct}%
          </div>
          <h2 className="lm-h-title">Going live · {row.name}</h2>
          <p className="lm-h-sub">
            Connecting downstream systems · {totalSteps} steps · this takes a few seconds.
          </p>
        </header>

        {/* HERO active step — big and central so the user can see exactly
            what system is being touched right now. */}
        <div className="lm-active">
          <div className={"lm-active-system lm-active-system-" + activeStep.system}>
            {SYSTEM_LABEL[activeStep.system] || activeStep.system}
          </div>
          <div className="lm-active-text">
            <span className="lm-active-spinner" />
            {activeStep.text}
          </div>
          {activeStep.meta && (
            <div className="lm-active-meta">{activeStep.meta}</div>
          )}
        </div>

        {/* Progress bar — visual track of how far through the sequence. */}
        <div className="lm-progress">
          <div className="lm-progress-bar" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Completed steps below — compact list so the user sees the
            full handshake trail accumulating as it goes. */}
        <div className="lm-trail">
          <div className="lm-trail-h">Handshake trail</div>
          <ul className="lm-trail-list">
            {completedSteps.map((s, i) => (
              <li key={i} className="lm-trail-item">
                <span className="lm-trail-check">
                  <Icon name="check" size={9} strokeWidth={3} />
                </span>
                <span className={"lm-trail-system lm-trail-system-" + s.system}>
                  {SYSTEM_LABEL[s.system] || s.system}
                </span>
                <span className="lm-trail-text">{s.text}</span>
                {s.meta && <span className="lm-trail-meta">{s.meta}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* Display labels for the system chips in the launching modal. */
const SYSTEM_LABEL = {
  cohort:   "Cohort engine",
  sfmc:     "SFMC · Marketing Cloud",
  gateway:  "Policy gateway",
  sentinel: "Sentinels",
  audit:    "Audit scheduler",
  live:     "Live",
};

/* ----------------------------------------------------------------------------
   LearningsDetail — post-RCT retrospective. Renders after the pilot
   period ends. Shows: what landed vs predicted (final view), what
   surprised us, what didn't work, and the system's recommended next move
   (promote / iterate / refuse). This is the moment the bank decides
   whether to scale the policy or send it back for revision.
---------------------------------------------------------------------------- */
function LearningsDetail({ row }) {
  /* Full-screen overlay state — mirrors LivePilotDetail. Post-pilot
     retrospective lives in its own focused view when the user wants to
     read it without the surrounding row-table chrome. */
  const [isFullScreen, setIsFullScreen] = useState(false);
  useEffect(() => {
    if (!isFullScreen) return;
    const onKey = (e) => { if (e.key === "Escape") setIsFullScreen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isFullScreen]);

  return (
    <>
      <LearningsContent
        row={row}
        isFullScreen={false}
        onOpenFullScreen={() => setIsFullScreen(true)}
      />
      {isFullScreen && (
        <div className="lrp-overlay" role="dialog" aria-modal="true" aria-label="Pilot retrospective">
          <div className="lrp-overlay-bg" onClick={() => setIsFullScreen(false)} />
          <div className="lrp-overlay-card">
            <LearningsContent
              row={row}
              isFullScreen={true}
              onCloseFullScreen={() => setIsFullScreen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

/* Extracted Learnings content — renders either inline or inside the
   full-screen overlay. `isFullScreen` toggles open/close buttons. */
/* Use-case-aware fallback for the post-pilot Learnings retrospective.
   Gig rows (themeId "gig" or absent) keep the original gig default
   verbatim. The deposit/SMB themes build their actuals table straight
   off buildRctKpis(row) so the KPI names match the use case, with a
   short use-case-plausible narrative. */
function defaultLearnings(row) {
  const theme = (row.themeId || "").toLowerCase();

  /* Gig (or unknown) — original default, untouched. */
  if (theme !== "liquidity" && theme !== "retention" && theme !== "smbrate" && theme !== "smbgrowth") {
    return {
      headline: "Policy landed within CI on 3 of 4 primary KPIs · ready to promote.",
      actuals: [
        { k: "NII",                 predicted: "+$11.9M / 8wk",   actual: "+$11.4M",       delta: "−4% vs prediction", tone: "ok" },
        { k: "Blocked payments",    predicted: "−29,300 / qtr",   actual: "−27,900",       delta: "within CI",         tone: "ok" },
        { k: "Complaints",          predicted: "−840 / qtr",      actual: "−812",          delta: "within CI",         tone: "ok" },
        { k: "Fair-lending margin", predicted: "0.94",            actual: "0.93",          delta: "+0.08 above floor", tone: "ok" },
      ],
      surprises: [
        "Follow-on attach landed +2.1pp higher than predicted — verified-recurring customers convert better than the simulation modelled.",
        "Friday 8 PM concentration was 71% of capped events, not 67% — payout window is even tighter than originally estimated.",
      ],
      didntWork: [
        "Rail re-route prompt was offered 1,840 times but only converted at 51% (vs predicted 64%). Investigation queued.",
      ],
      nextMove: {
        verdict: "Promote",
        tone: "ok",
        rationale: "All primary KPIs landed inside CI · fair-lending margin held · no guardrail trips across 8 weeks. Recommend full rollout to remaining 40% of verified cohort.",
      },
    };
  }

  /* Format a magnitude per the KPI's formatKpi convention, then nudge it
     ~3–5% toward zero to read as a realised-vs-predicted actual. */
  const fmt = (k, v) => formatKpi(k, v);
  const nudge = (v) => v * 0.965; // ~3.5% short of prediction
  const actuals = buildRctKpis(row).map((k) => ({
    k: k.label,
    predicted: fmt(k, k.simAtEnd),
    actual: fmt(k, nudge(k.simAtEnd)),
    delta: "within CI",
    tone: "ok",
  }));

  const NARRATIVE = {
    liquidity: {
      surprises: ["Balances activated landed inside CI — idle cash moved into yield as modelled."],
      didntWork: ["Activation lagged the offer by ~3 weeks — customers needed time to move idle cash."],
    },
    retention: {
      surprises: ["Retained deposits held inside CI — the rate match defended the relationship as modelled."],
      didntWork: ["Direct-deposit returns lagged the rate offer by ~3 weeks before recovering."],
    },
    smbrate: {
      surprises: ["Margin defended landed inside CI — rate-shopping deflection held across the cohort."],
      didntWork: ["Deflection took ~2 weeks to ramp as relationship managers worked the outreach list."],
    },
    smbgrowth: {
      surprises: ["New deposit balances landed inside CI — relationship growth tracked the offer."],
      didntWork: ["Cross-sell attach ramped slower than modelled — products attached after the deposit landed, not alongside it."],
    },
  };
  const narr = NARRATIVE[theme];

  return {
    headline: "All primary KPIs landed inside CI · ready to promote.",
    actuals,
    surprises: narr.surprises,
    didntWork: narr.didntWork,
    nextMove: {
      verdict: "Promote",
      tone: "ok",
      rationale: "All primary KPIs landed inside CI — recommend full rollout to the remaining cohort.",
    },
  };
}

function LearningsContent({ row, isFullScreen, onOpenFullScreen, onCloseFullScreen }) {
  const learnings = row.learnings || defaultLearnings(row);

  return (
    <section className={"wf-panel wf-panel-learnings" + (isFullScreen ? " wf-panel-learnings-full" : "")}>
      <header className="wf-panel-h">
        <div className="wf-panel-h-l">
          <span className="wf-panel-status wf-status-done">
            <Icon name="check" size={11} strokeWidth={2.5} /> RCT COMPLETE
          </span>
          <span className="wf-panel-title">
            {isFullScreen ? `${row.name} · Learnings` : "Learnings · post-pilot retrospective"}
          </span>
          {row.pilotEndedAt && (
            <span className="wf-panel-date">Ended {fmtDate(row.pilotEndedAt)}</span>
          )}
        </div>
        <div className="wf-panel-h-r">
          {isFullScreen ? (
            <button className="lrp-back" onClick={onCloseFullScreen} title="Back (Esc)">
              <Icon name="arrowLeft" size={13} /> Back to Deploy
            </button>
          ) : (
            <button className="lrp-back" onClick={onOpenFullScreen} title="Open in full-screen view">
              <Icon name="arrowRight" size={11} /> Full view
            </button>
          )}
        </div>
      </header>
      <div className="wf-panel-body">
        <div className="wf-learnings-headline">{learnings.headline}</div>

        {/* Actual vs predicted final readout */}
        <div className="wf-learnings-block">
          <div className="wf-learnings-block-h">Final outcomes · actual vs predicted</div>
          <table className="wf-learnings-table">
            <thead>
              <tr>
                <th>KPI</th>
                <th>Predicted (pre-RCT)</th>
                <th>Actual (RCT realised)</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {learnings.actuals.map((a, i) => (
                <tr key={i}>
                  <td className="wf-learnings-k">{a.k}</td>
                  <td className="wf-learnings-pred">{a.predicted}</td>
                  <td className="wf-learnings-actual">{a.actual}</td>
                  <td>
                    <span className={`wf-learnings-delta wf-learnings-delta-${a.tone}`}>{a.delta}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* What surprised us · 2-col */}
        <div className="wf-learnings-grid">
          <div className="wf-learnings-block">
            <div className="wf-learnings-block-h wf-learnings-block-h-good">What worked beyond prediction</div>
            <ul className="wf-learnings-list">
              {learnings.surprises.map((s, i) => (<li key={i}>{s}</li>))}
            </ul>
          </div>
          <div className="wf-learnings-block">
            <div className="wf-learnings-block-h wf-learnings-block-h-warn">What didn't land as modelled</div>
            <ul className="wf-learnings-list">
              {learnings.didntWork.map((s, i) => (<li key={i}>{s}</li>))}
            </ul>
          </div>
        </div>

        {/* Recommended next move */}
        <div className={`wf-learnings-verdict wf-learnings-verdict-${learnings.nextMove.tone}`}>
          <div className="wf-learnings-verdict-l">
            <div className="wf-learnings-verdict-k">Recommended next move</div>
            <div className="wf-learnings-verdict-v">{learnings.nextMove.verdict}</div>
          </div>
          <div className="wf-learnings-verdict-rationale">{learnings.nextMove.rationale}</div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   LiveRctLinkPanel — what the expanded row shows for a live pilot.
   Compact CTA: "RCT in flight · Wk N/M · open in dedicated page." No
   inline charts (those crowded the row); the dedicated LiveRctPage is
   where the user reads live performance.
---------------------------------------------------------------------------- */
function LiveRctLinkPanel({ row, onOpenRct }) {
  const { week: wkNow, pilotTotal: wkTotal } = derivePilotProgress(row);
  const treatmentN = (row.treatmentN || 34500).toLocaleString();
  const controlN = (row.controlN || 3850).toLocaleString();
  return (
    <section className="wf-panel wf-panel-current wf-panel-live-link">
      <header className="wf-panel-h">
        <div className="wf-panel-h-l">
          <span className="wf-panel-status wf-status-pilot">
            <span className="wf-status-pulse" /> LIVE PILOT · WK {wkNow} / {wkTotal}
          </span>
          <span className="wf-panel-title">RCT in flight</span>
          {row.pilotStartedAt && (
            <span className="wf-panel-date">Started {fmtDate(row.pilotStartedAt)}</span>
          )}
        </div>
      </header>
      <div className="wf-panel-body wf-live-link-body">
        <div className="wf-live-link-stats">
          <div className="wf-live-link-stat">
            <span className="wf-live-link-stat-k">Treatment</span>
            <span className="wf-live-link-stat-v">{treatmentN}</span>
          </div>
          <div className="wf-live-link-stat">
            <span className="wf-live-link-stat-k">Control</span>
            <span className="wf-live-link-stat-v">{controlN}</span>
          </div>
          <div className="wf-live-link-stat">
            <span className="wf-live-link-stat-k">Auto-rollback</span>
            <span className="wf-live-link-stat-v wf-live-link-stat-ok">
              <Icon name="check" size={10} strokeWidth={2.5} /> armed
            </span>
          </div>
          <div className="wf-live-link-stat">
            <span className="wf-live-link-stat-k">Next milestone</span>
            <span className="wf-live-link-stat-v">{row.nextMilestone || `Wk ${Math.min(wkTotal, wkNow + 2)} · interim audit`}</span>
          </div>
        </div>
        <button className="wf-btn wf-btn-primary wf-btn-lg wf-live-link-cta" onClick={() => onOpenRct && onOpenRct(row)}>
          <Icon name="arrowRight" size={12} /> Open live RCT page
        </button>
        <div className="wf-live-link-hint">
          Live performance charts, treatment vs control trajectories, integration trail, and interim learnings.
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   EXPORT — main component the Deploy workspace renders inside row expansion.
   ========================================================================= */
export default function ExperimentWorkflow({ row, onApprove, onReject, onRequestChanges, onGoLive, onOpenRct }) {
  const stages = stagesFor(row);
  const current = stages.find((s) => s.status === "current")?.key;

  // Panel visibility — derived from row state. _launching is the brief
  // transition between Go-Live click and pilot start; it suppresses both
  // the Ready and Live panels in favour of the staged Launching sequence.
  const showApproval   = !!row.approvedAt || current === "approval";
  const showCompliance = !!row.complianceAt || current === "compliance";
  const showLaunching  = !!row._launching && !row.pilotStartedAt;
  const showGoLive     = !!row.complianceAt && !row.pilotStartedAt && !row._launching;
  const showPilot      = !!row.pilotStartedAt && !row.pilotEndedAt;
  const showLearnings  = !!row.pilotEndedAt;

  return (
    <div className="wf-root">
      <WorkflowTimeline stages={stages} />

      {showApproval && (
        <ApprovalDetail
          row={row}
          isCurrent={current === "approval"}
          onApprove={onApprove}
          onReject={onReject}
          onRequestChanges={onRequestChanges}
        />
      )}
      {showCompliance && (
        <ComplianceDetail row={row} isCurrent={current === "compliance"} />
      )}
      {showGoLive && (
        <GoLiveReadyDetail row={row} onGoLive={onGoLive} />
      )}
      {/* Launching during the ~3.5s transition is rendered as a viewport-
          level modal by the parent DeployWorkspace, not inline here, so
          the SFMC handshake gets prominent center-stage treatment. */}
      {/* For live pilots the expanded row shows only a COMPACT LINK panel —
          the full chart grid + interim findings live in the dedicated
          LiveRctPage. Removes the previously-crowded inline view; the
          approval / compliance trail above is what the expanded row is
          actually useful for. */}
      {showPilot && (
        <LiveRctLinkPanel row={row} onOpenRct={onOpenRct} />
      )}
      {showLearnings && (
        <LearningsDetail row={row} />
      )}
    </div>
  );
}
