/* ============================================================================
   DeployWorkspace — portfolio dashboard of staged + in-flight policies.

   Cross-scenario view: every policy that has been staged from any
   Simulate run sits in this table, alongside mock historical entries that
   represent the queue a real PM would see in week 2 of using the product.

   Columns: rank · policy · hypothesis · theme · stage · staged-by · date
   Rows expand inline (incentives-app pattern) to show the existing
   Approval → Compliance → Live-pilot review tabs for that policy.
   ========================================================================= */
import { useEffect, useMemo, useState } from "react";
import { useAppShell, DEFAULT_THEME_ID, DEFAULT_HYPOTHESIS_ID } from "@/state/AppShell";
import Icon from "@/components/Icon";
import { PERSONA } from "@/components/GlobalTopBar";
import ExperimentWorkflow, { LiveRctPage, LaunchingModal, BIZ_APPROVER } from "@/workspaces/deploy/ExperimentWorkflow";
import { RETENTION_DEPLOY_HISTORY } from "@/data/retentionDeployHistory";
import { LIQUIDITY_DEPLOY_HISTORY } from "@/data/liquidityDeployHistory";
import { WEALTH_DEPLOY_HISTORY } from "@/data/wealthDeployHistory";
import { B2B_DEPLOY_HISTORY } from "@/data/b2bDeployHistory";
import "@/styles/pipeline.css";
import "@/styles/portfolio.css";
import "@/styles/experiment-workflow.css";

/* Mock historical entries — represent the portfolio state a PM would see
   in week 2 of using the product. Each row carries its full workflow
   journey: stagedAt → approvedAt → complianceAt → pilotStartedAt →
   pilotWeek. Approval + compliance metadata + RCT pilot data are surfaced
   in the inline expansion (see ExperimentWorkflow). */
const MOCK_HISTORY = [
  {
    id: "mock-hist-1",
    name: "Renewal cadence nudge",
    hypothesis: "H-2026-03-22",
    cluster: "under-35",
    themeName: "Auto Retention",
    stage: "live-pilot",
    stageWeek: 6,
    stageTotal: 8,
    stagedBy: "user",
    stagedAt: dayBack(56),
    approvedAt: dayBack(52),
    approverName: "Maria Chen",
    approverRole: "Director · USRM Personal Lines",
    approverDecision: "Approve · proceed to compliance",
    complianceAt: dayBack(48),
    complianceReviewer: "Risk &amp; Compliance · J. Reyes",
    pilotStartedAt: dayBack(42),
    pilotWeek: 6,
    pilotTotal: 8,
    treatmentN: 127500,
    controlN: 14200,
    blurb: "In-app monthly cadence nudges. Pilot wk 6/8. Conversion 11.2% (vs 7.4% control).",
    interimFindings: [
      { wk: 2, tone: "good",    text: "Causal lift on conversion (3.8pp) is tracking 4% above pre-sim prediction. Confidence interval has tightened around the central estimate." },
      { wk: 4, tone: "neutral", text: "Sunday-evening sends outperform Monday-morning by 1.6pp — investigating whether to lock the timing post-pilot." },
      { wk: 5, tone: "good",    text: "Fair-lending margin holding at 0.94, well above the 0.85 floor. No protected-class proxy signals on quarterly audit." },
    ],
  },
  {
    id: "mock-hist-2",
    name: "Small Commercial growth-capture ladder",
    hypothesis: "H-2026-04-08",
    cluster: "b2b-deposits",
    themeName: "Small Commercial",
    stage: "live-pilot",
    stageWeek: 3,
    stageTotal: 8,
    stagedBy: "autopilot",
    stagedAt: dayBack(34),
    approvedAt: dayBack(31),
    approverName: "Daniel Park",
    approverRole: "MD · Small Commercial",
    approverDecision: "Approve · monitor wk 4 ticket-size variance",
    approverConditions: "Hold-back at $10M+ tier until wk 4 readout",
    complianceAt: dayBack(28),
    complianceReviewer: "Risk &amp; Compliance · M. Alvarez",
    pilotStartedAt: dayBack(21),
    pilotWeek: 3,
    pilotTotal: 8,
    treatmentN: 8400,
    controlN: 940,
    blurb: "Tiered rate-flexibility ladder for Small Commercial growth-capture. Pilot wk 3/8.",
    interimFindings: [
      { wk: 1, tone: "neutral", text: "$10M+ tier is held back per approval condition — wk 4 readout will determine whether to release it into the policy." },
      { wk: 2, tone: "good",    text: "Mid-tier ($1M–$10M premium) account retention is 11% higher in treatment vs control. NWP run-rate tracking within CI." },
      { wk: 3, tone: "warn",    text: "Average ticket size at sub-$500K tier is 7% lower than predicted — investigating whether ladder pricing nudges customers down a tier rather than retaining them at current tier." },
    ],
  },
  {
    id: "mock-hist-3",
    name: "Auto-only bundle-attach bridge",
    hypothesis: "H-2026-02-19",
    cluster: "mass-affluent",
    themeName: "Bundle Attach",
    stage: "compliance",
    stagedBy: "user",
    stagedAt: dayBack(16),
    approvedAt: dayBack(13),
    approverName: "Priya Iyer",
    approverRole: "Director · USRM Personal Lines",
    approverDecision: "Approve · proceed to compliance",
    /* compliance in progress — no date yet */
    complianceReviewer: "Risk &amp; Compliance · L. Tanaka (in review)",
    blurb: "Bundle-attach pathway for auto-only households. In compliance review.",
  },
  {
    id: "mock-hist-4",
    name: "Rideshare endorsement auto-add",
    hypothesis: "H-2026-04-12",
    cluster: "gig-economy",
    themeName: "Gig & rideshare",
    stage: "approval",
    stagedBy: "user",
    stagedAt: dayBack(4),
    pendingApprover: "Maria Chen, Director · USRM Personal Lines",
    blurb: "Auto-adds the rideshare endorsement with a +10% rate cap and 24-month claims-free gate. Awaiting approval.",
  },
  {
    id: "mock-hist-5",
    name: "Telematics enrollment · gig variant",
    hypothesis: "H-2026-04-19",
    cluster: "gig-economy",
    themeName: "Gig & rideshare",
    stage: "live-pilot",
    stageWeek: 4,
    stageTotal: 8,
    stagedBy: "autopilot",
    stagedAt: dayBack(38),
    approvedAt: dayBack(35),
    approverName: "Marcus Wei",
    approverRole: "VP · Personal Lines Product",
    approverDecision: "Approve · standard pilot terms",
    complianceAt: dayBack(32),
    complianceReviewer: "Risk &amp; Compliance · S. Park",
    pilotStartedAt: dayBack(28),
    pilotWeek: 4,
    pilotTotal: 8,
    treatmentN: 64800,
    controlN: 7200,
    blurb: "Telematics (RightTrack) enrollment for verified-pattern gig drivers. Pilot wk 4/8.",
    interimFindings: [
      { wk: 2, tone: "good",    text: "Adoption among verified-pattern gig customers reached 38% by wk 2 — 5pp ahead of the pre-sim prediction." },
      { wk: 3, tone: "good",    text: "Enrollment holding at baseline; no signal of telematics enrollment cannibalizing bundle primacy. Risk team reviewing wk 4." },
      { wk: 4, tone: "neutral", text: "Average mileage-discount capture trending toward the lower end of the predicted band (8% vs 11% predicted) — may indicate the cohort drives fewer low-risk miles than modeled." },
    ],
  },
  {
    id: "mock-hist-6",
    name: "High-value retention outreach",
    hypothesis: "H-2026-03-08",
    cluster: "mass-affluent",
    themeName: "Bundle Attach",
    stage: "live-pilot",
    stageWeek: 7,
    stageTotal: 8,
    stagedBy: "user",
    stagedAt: dayBack(64),
    approvedAt: dayBack(60),
    approverName: "Priya Iyer",
    approverRole: "Director · USRM Personal Lines",
    approverDecision: "Approve · close-out review at wk 8",
    complianceAt: dayBack(57),
    complianceReviewer: "Risk &amp; Compliance · D. Roberts",
    pilotStartedAt: dayBack(50),
    pilotWeek: 7,
    pilotTotal: 8,
    treatmentN: 41400,
    controlN: 4600,
    blurb: "Outreach + agent handoff for high-LTV attrition signals. Pilot wk 7/8.",
    interimFindings: [
      { wk: 3, tone: "good",    text: "Attrition rate in treatment cohort dropped to 1.9% (vs 4.7% in control by same week) — outreach is moving the needle." },
      { wk: 5, tone: "warn",    text: "Agent handoff completion rate at 64% — below 78% target. Agent capacity flagged as the bottleneck; ops reviewing reassignment rules." },
      { wk: 6, tone: "good",    text: "Saved households averaging $1.4M lifetime premium each. Value-weighted save is 18% above pre-sim." },
    ],
  },
  {
    id: "mock-hist-7",
    name: "Small Commercial limit-adequacy review",
    hypothesis: "H-2026-04-02",
    cluster: "b2b-deposits",
    themeName: "Small Commercial",
    stage: "compliance",
    stagedBy: "user",
    stagedAt: dayBack(12),
    approvedAt: dayBack(9),
    approverName: "Daniel Park",
    approverRole: "MD · Small Commercial",
    approverDecision: "Approve · proceed to compliance",
    complianceReviewer: "Risk &amp; Compliance · L. Tanaka (in review)",
    blurb: "Coverage-limit adequacy review for growing small businesses. In compliance review.",
  },
  {
    id: "mock-hist-8",
    name: "Pre-renewal rate-shopping intercept",
    hypothesis: "H-2026-04-25",
    cluster: "gig-economy",
    themeName: "Gig & rideshare",
    stage: "approval",
    stagedBy: "autopilot",
    stagedAt: dayBack(2),
    pendingApprover: "Maria Chen, Director · USRM Personal Lines",
    blurb: "When a competitor quote-shopping signal fires pre-renewal, auto-offers a retention rate review to the policyholder. Awaiting approval.",
  },
  {
    id: "mock-hist-9",
    name: "SMB new-business lead ladder",
    hypothesis: "H-2026-04-30",
    cluster: "b2b-deposits",
    themeName: "Small Commercial",
    stage: "approval",
    stagedBy: "user",
    stagedAt: dayBack(1),
    pendingApprover: "Daniel Park, MD · Small Commercial",
    blurb: "Rate-flexibility ladder for $5M+ revenue Small Commercial leads. Awaiting MD review.",
  },
  {
    id: "mock-hist-10",
    name: "Claims-experience save · long-tenure",
    hypothesis: "H-2026-03-31",
    cluster: "elder",
    themeName: "Claims Experience",
    stage: "live-pilot",
    stageWeek: 2,
    stageTotal: 8,
    stagedBy: "user",
    stagedAt: dayBack(18),
    approvedAt: dayBack(16),
    approverName: "Helen Stern",
    approverRole: "Director · Customer Protection",
    approverDecision: "Approve · weekly fraud-loss readout",
    complianceAt: dayBack(14),
    complianceReviewer: "Risk &amp; Compliance · A. Mehta",
    pilotStartedAt: dayBack(12),
    pilotWeek: 2,
    pilotTotal: 8,
    treatmentN: 22100,
    controlN: 2460,
    blurb: "Proactive claims-experience outreach for long-tenure policyholders. Pilot wk 2/8.",
    interimFindings: [
      { wk: 1, tone: "good",    text: "247 wires intercepted in wk 1 · 41 confirmed scam-pattern · $1.8M fraud loss avoided. Trusted-contact outreach reaching 89% within 4h SLA." },
      { wk: 2, tone: "neutral", text: "False-positive hold rate at 6.3% — slightly above the 5% acceptable threshold. Ops reviewing whether to tune the model's scam-pattern signal." },
    ],
  },
  /* ──────── COMPLETED RCTs ──────── */
  /* Pilot ran the full duration → Learnings panel renders with the final
     vs predicted retro. This row uses pilotEndedAt to drive that panel. */
  {
    id: "mock-hist-11",
    name: "Rideshare Endorsement Rollout (Q4'25)",
    hypothesis: "H-2025-11-08",
    cluster: "gig-economy",
    themeName: "Gig & rideshare",
    stage: "completed",
    stagedBy: "user",
    stagedAt: dayBack(98),
    approvedAt: dayBack(95),
    approverName: "Maria Chen",
    approverRole: "Director · USRM Personal Lines",
    approverDecision: "Approve · proceed to compliance",
    complianceAt: dayBack(92),
    complianceReviewer: "Risk & Compliance · J. Reyes",
    pilotStartedAt: dayBack(84),
    pilotEndedAt: dayBack(28),
    promotedAt: dayBack(21),
    pilotWeek: 8,
    pilotTotal: 8,
    treatmentN: 18200,
    controlN: 2040,
    /* Why the RCT ended: ran the full 8-week duration. */
    pilotEndReason: "duration-complete",
    pilotEndReasonLabel: "Full 8-week duration complete",
    learnings: {
      headline: "Q4 pilot landed inside CI on all 4 KPIs · promoted to full rollout.",
      actuals: [
        { k: "NWP protected",                 predicted: "+$9.4M / 8wk",   actual: "+$9.1M",        delta: "−3% vs prediction", tone: "ok" },
        { k: "At-risk renewals saved", predicted: "+24,800 / qtr",  actual: "+23,940",       delta: "within CI",          tone: "ok" },
        { k: "Complaints",          predicted: "−712 / qtr",     actual: "−688",          delta: "within CI",          tone: "ok" },
        { k: "Fair-lending margin", predicted: "0.93",           actual: "0.92",          delta: "+0.07 above floor",  tone: "ok" },
      ],
      surprises: [
        "Verified-driver enrollment hit 84% (vs predicted 78%) — customers added the rideshare endorsement faster than the simulation modelled.",
        "Weekend rideshare-driving volume held its 67% concentration through all 8 weeks — pattern was structurally stable, not a one-quarter blip.",
      ],
      didntWork: [
        "Follow-on attach landed flat at 12.4% (vs predicted 17.8%) — the warm-up window may need to extend past the 8-week pilot.",
      ],
      nextMove: {
        verdict: "Promoted",
        tone: "ok",
        rationale: "All primary KPIs landed inside CI · margin held · pilot ran full duration. Promoted to 80% rollout on the verified cohort effective wk 9.",
      },
    },
    blurb: "Q4 pilot · ran full 8 weeks · promoted to 80% rollout.",
  },
  {
    id: "mock-gig-2",
    name: "Multi-Platform Driver Coverage (Q3'25)",
    hypothesis: "H-2025-08-14",
    cluster: "gig-economy",
    themeName: "Gig & rideshare",
    stage: "completed",
    stagedBy: "user",
    stagedAt: dayBack(196),
    approvedAt: dayBack(193),
    approverName: "Maria Chen",
    approverRole: "Director · USRM Personal Lines",
    approverDecision: "Approve · proceed to compliance",
    complianceAt: dayBack(190),
    complianceReviewer: "Risk & Compliance · J. Reyes",
    pilotStartedAt: dayBack(182),
    pilotEndedAt: dayBack(126),
    promotedAt: dayBack(119),
    pilotWeek: 8,
    pilotTotal: 8,
    treatmentN: 16400,
    controlN: 1820,
    pilotEndReason: "duration-complete",
    pilotEndReasonLabel: "Full 8-week duration complete",
    learnings: {
      headline: "Q3 pilot landed inside CI on all 4 KPIs · promoted to full rollout.",
      actuals: [
        { k: "NWP protected",                 predicted: "+$8.6M / 8wk",   actual: "+$8.4M",        delta: "−2% vs prediction", tone: "ok" },
        { k: "At-risk renewals saved", predicted: "+21,300 / qtr",  actual: "+20,710",       delta: "within CI",          tone: "ok" },
        { k: "Complaints",          predicted: "−640 / qtr",     actual: "−624",          delta: "within CI",          tone: "ok" },
        { k: "Fair-lending margin", predicted: "0.93",           actual: "0.93",          delta: "+0.08 above floor",  tone: "ok" },
      ],
      surprises: [
        "Multi-platform drivers took the coverage at 81% (vs predicted 74%) — drivers juggling three or more apps valued the tailored endorsement more than the simulation assumed.",
        "Average linked-platform count held at 3.4 across the cohort — these earners are structurally multi-source, not transitional, so the rails demand is durable.",
      ],
      didntWork: [
        "Umbrella attach on the multi-platform driver flow came in at 9.8% (vs predicted 14.2%) — the umbrella prompt competes with the endorsement the policy just added.",
      ],
      nextMove: {
        verdict: "Promoted",
        tone: "ok",
        rationale: "All primary KPIs landed inside CI · margin held · pilot ran full duration. Promoted to full rollout on the multi-platform cohort effective wk 9; umbrella-attach timing flagged for a follow-on test.",
      },
    },
    blurb: "Q3 pilot · ran full 8 weeks · promoted to full rollout.",
  },
  /* Pilot stopped EARLY because the stopping rule fired — significance
     was reached ahead of schedule, so continuing the RCT would be
     wasting time and unfair to the control arm. */
  {
    id: "mock-hist-12",
    name: "Claims-experience save · early-stop",
    hypothesis: "H-2026-02-04",
    cluster: "retired-stable",
    themeName: "Claims Experience",
    stage: "completed",
    stagedBy: "autopilot",
    stagedAt: dayBack(72),
    approvedAt: dayBack(70),
    approverName: "Helen Stern",
    approverRole: "Director · Customer Protection",
    approverDecision: "Approve · weekly fraud-loss readout",
    complianceAt: dayBack(68),
    complianceReviewer: "Risk & Compliance · A. Mehta",
    pilotStartedAt: dayBack(63),
    pilotEndedAt: dayBack(36),
    pilotWeek: 4,
    pilotTotal: 8,
    treatmentN: 14800,
    controlN: 1640,
    /* Why the RCT ended: stopping rule fired at wk 4 — effect size and
       significance both exceeded the pre-registered threshold. Stopping
       early protects the control arm (no need to keep withholding the
       intervention from elderly customers once we know it works). */
    pilotEndReason: "stat-sig-early-stop",
    pilotEndReasonLabel: "Stat-sig early stop · wk 4 of 8",
    learnings: {
      headline: "Effect size and significance threshold both met at wk 4 — stopping rule fired, pilot ended early.",
      actuals: [
        { k: "Post-claim NPS detractor rate", predicted: "−1.8pp", actual: "−2.1pp", delta: "+0.3pp stronger", tone: "ok" },
        { k: "Loss avoided",        predicted: "$5.4M / 8wk",    actual: "$3.8M / 4wk",   delta: "tracking to +$7.6M",  tone: "ok" },
        { k: "False-flag reviews", predicted: "<2.0%", actual: "1.7%", delta: "below threshold", tone: "ok" },
        { k: "Repeat complaints", predicted: "≤ 6 / wk", actual: "3.2 / wk avg", delta: "below ceiling", tone: "ok" },
      ],
      surprises: [
        "Effect size at wk 3 already exceeded the pre-registered minimum (−1.4 bps) AND the stopping-rule p-value crossed 0.01 — stronger and faster than the simulation modelled.",
        "Proactive claims-outreach pickup rate was 71% — well above the 55% used in the sim. The post-settlement contact list was more current than expected.",
      ],
      didntWork: [
        "False-positive resolution time averaged 38 minutes (vs target 30) — the contact-centre routing needs tightening before scale.",
      ],
      nextMove: {
        verdict: "Promoted · ethical stop",
        tone: "ok",
        rationale: "Continuing the RCT would be withholding a proven claims-experience intervention from long-tenure policyholders in the control arm. Promoted to full deployment effective wk 5; contact-centre routing fix queued as a follow-up.",
      },
    },
    blurb: "Pilot stopped early at wk 4 · stat-sig threshold reached · promoted.",
  },
];

const STAGE_LABEL = {
  approval:    { label: "Approval",   tone: "neutral" },
  compliance:  { label: "Compliance", tone: "amber" },
  "live-pilot": { label: "Live pilot", tone: "blue" },
  completed:   { label: "Completed",  tone: "green" },
  sunset:      { label: "Sunset",     tone: "muted" },
};

function dayBack(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.getTime();
}
function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---------------------------------------------------------------------------
   Approval cascade — when the user clicks Approve on a pending row, we
   progressively advance the row through Compliance into a Live Pilot.
   Each step writes a timestamp the workflow component already keys off,
   and emits a signal-rail event so the right rail shows the journey.

   Timings are tuned to feel like "Twin is processing", not instant magic.
   Tweak these to make the demo crisper or slower.
--------------------------------------------------------------------------- */
const CASCADE = {
  complianceDelayMs: 1800,
  pilotStartDelayMs: 3600,
  defaultApprover: {
    approverName: PERSONA.name,   // the signed-in user is the one approving
    approverRole: "Director · USRM Personal Lines (Sandbox)",
    approverDecision: "Approve · proceed to compliance",
  },
};

export default function DeployWorkspace() {
  const {
    selectedThemeId, selectedHypothesisId, stagedPolicies,
    navigate: nav, removeStaged, selectTheme, selectHypothesis,
    pushAgentEvent,
  } = useAppShell();

  /* Per-row workflow overrides applied on top of the source row (mock or
     staged). Lets Approve/Reject/cascade mutate any row in the demo
     without touching AppShell state or the const MOCK_HISTORY arrays. */
  const [advancements, setAdvancements] = useState({});
  const applyAdvancement = (id, patch) =>
    setAdvancements((m) => ({ ...m, [id]: { ...(m[id] || {}), ...patch } }));

  /* Approve handler — the missing wire. Runs the staged → approved →
     compliance → live-pilot cascade for one row.

     Stage 1 (instant)       — approvedAt is set; ApprovalDetail flips to APPROVED.
     Stage 2 (+1.8s)         — complianceAt is set; ComplianceDetail flips to CLEARED.
     Stage 3 (+3.6s total)   — pilotStartedAt is set; LivePilotDetail starts with wk 0.

     Each step pushes a signal-rail event so the user sees the journey
     reflected in the right rail too. */
  /* Approval cascade — staged → approved → compliance cleared → READY.
     We deliberately STOP at compliance. The pilot does NOT auto-launch;
     the user has to click "Go Live with RCT" to push real customer
     traffic through the treatment arm. That's the human-in-the-loop. */
  const handleApprove = (row) => {
    if (!row || row.approvedAt || row._rejected) return;
    const now = Date.now();
    // The approving line of business follows the use case, not always Money Movement.
    const theme = row.themeId || CLUSTER_TO_THEME[row.cluster] || "gig";
    const sandboxRole = {
      liquidity: "Director · USRM Personal Lines (Sandbox)",
      retention: "Director · USRM Personal Lines (Sandbox)",
      wealth:    "Director · USRM Personal Lines (Sandbox)",
      smbrate:   "MD · Small Commercial (Sandbox)",
      smbgrowth: "MD · Small Commercial (Sandbox)",
      gig:       "Director · USRM Personal Lines (Sandbox)",
    }[theme] || CASCADE.defaultApprover.approverRole;
    applyAdvancement(row.id, { ...CASCADE.defaultApprover, approverRole: sandboxRole, approvedAt: now, _rejected: false });
    pushAgentEvent({ kind: "good", src: "Deploy", text: `Approved · ${row.name}` });
    setTimeout(() => {
      applyAdvancement(row.id, {
        complianceAt: Date.now(),
        // Deposit use cases screen against UDAAP + Truth-in-Savings (Reg DD),
        // not ECOA — fair-lending is a credit law and doesn't apply to deposits.
        complianceReviewer: `Compliance auto-screen v3.4 (${theme === "wealth" ? "MRM + Reg BI + Suitability" : (theme === "liquidity" || theme === "retention") ? "MRM + UDAAP + Reg DD" : "MRM + ECOA"} + Fraud)`,
      });
      pushAgentEvent({ kind: "good", src: "Deploy", text: `Compliance cleared · ${row.name} · ready for Go-Live` });
    }, CASCADE.complianceDelayMs);
  };

  /* handleGoLive — the explicit human action that puts the policy into
     production traffic. Three phases:
       1. Set _launching: true → the LAUNCHING MODAL renders at viewport
          level (rendered by this workspace) showing the SFMC + sentinel
          + gateway handshake sequence. Sells "system doing visible work".
       2. After ~3.5s, set pilotStartedAt + stage live + clear _launching.
       3. Auto-open the LiveRctPage for the row so the user is immediately
          dropped into the dedicated RCT view. No back-to-table step. */
  const handleGoLive = (row) => {
    if (!row || !row.complianceAt || row.pilotStartedAt || row._launching) return;

    applyAdvancement(row.id, { _launching: true, _launchingAt: Date.now() });
    pushAgentEvent({ kind: "good", src: "Deploy", text: `LAUNCHING · ${row.name} · routing first traffic` });

    setTimeout(() => {
      applyAdvancement(row.id, {
        _launching: false,
        pilotStartedAt: Date.now(),
        pilotWeek: 0,
        pilotTotal: row.pilotTotal || row.pilotDuration || 8,
        stage: "live-pilot",
        /* Cohort split — prefer the value the Go-Live panel passed (a possibly
           user-edited split), then the engine-computed projection, then the
           1200/140 default that only covers mock rows without a projection. */
        treatmentN: row.treatmentN ?? row.projected?.treatmentN ?? 1200,
        controlN: row.controlN ?? row.projected?.controlN ?? 140,
      });
      pushAgentEvent({ kind: "good", src: "Deploy", text: `LIVE · ${row.name} · RCT in production · Wk 1 day 1` });
      /* Auto-open the dedicated RCT page right after the launch sequence
         completes — the modal closes itself when _launching flips false,
         and the user lands directly on the live-RCT page. */
      setOpenRctId(row.id);
      /* 9500ms covers the 13-step launch sequence at ~700ms per step
         (cohort × 2 + SFMC × 7 + gateway + sentinel + audit + live).
         The SFMC block alone runs for ~5s — the prominent middle of
         the modal — which is the integration story we want sold. */
    }, 9500);
  };

  const handleReject = (row) => {
    if (!row) return;
    applyAdvancement(row.id, { _rejected: true, _rejectedAt: Date.now() });
    pushAgentEvent({ kind: "bad", src: "Deploy", text: `Rejected · ${row.name}` });
  };

  const handleRequestChanges = (row) => {
    if (!row) return;
    applyAdvancement(row.id, { _changesRequested: true, _changesRequestedAt: Date.now() });
    pushAgentEvent({ kind: "warn", src: "Deploy", text: `Changes requested · ${row.name}` });
  };

  useEffect(() => {
    if (!selectedThemeId) selectTheme(DEFAULT_THEME_ID);
    if (!selectedHypothesisId) selectHypothesis(DEFAULT_HYPOTHESIS_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filter, setFilter] = useState("all"); // all | approval | compliance | live-pilot
  const [expandedId, setExpandedId] = useState(null);
  /* Live RCT page state — when set, the workspace renders the LiveRctPage
     in place of the portfolio table (the shell + left nav stay visible).
     Triggered from the row's "View live RCT" button so the user reaches
     the page WITHOUT expanding. Esc returns to the portfolio. */
  const [openRctId, setOpenRctId] = useState(null);
  useEffect(() => {
    if (!openRctId) return;
    const onKey = (e) => { if (e.key === "Escape") setOpenRctId(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openRctId]);

  /* Combine user-staged policies (just promoted from Simulate) with mock
     historical entries. User-staged rows are flagged with `__user` and
     `justStaged` so the row picks up the "JUST STAGED" indicator + a
     pending-approver default; the workflow component then renders the
     Approval panel in its awaiting-review state. */
  const rows = useMemo(() => {
    const userRows = stagedPolicies.map((p) => {
      // Build a richer blurb from the policy snapshot — the lever values
      // the user actually shipped from Simulate. Keeps the deploy row
      // informative even before the workflow expansion is opened.
      const liftBlurb = p.liftPct != null
        ? `+${p.liftPct}% lift · ${p.trustGate}mo gate · ${p.rolloutPct}% rollout · ${p.pilotDuration || 8}-wk pilot`
        : `Staged from Simulate`;
      /* Resolve the use-case theme so the approver + RCT KPI set are
         keyed off it. themeId is preferred; fall back to the cluster map
         then gig. */
      const theme = p.themeId || CLUSTER_TO_THEME[p.cluster] || "gig";
      return {
        id: p.id,
        name: p.name || "Trust-Aware Ceiling Lift",
        hypothesis: p.hypothesis || "H-2026-04-12",
        cluster: p.cluster || "gig-economy",
        themeId: theme,
        themeName: prettyTheme(p.cluster),
        stage: "approval",
        stagedBy: p.stagedBy || "user",
        stagedAt: p.stagedAt,
        /* Carry the pilot duration through from Simulate so the Deploy
           workflow's Live Pilot panel + Learnings trigger use the user's
           chosen duration, not the default 8 weeks. */
        pilotDuration: p.pilotDuration || 8,
        pilotTotal: p.pilotDuration || 8,
        /* Carry the experiment scope flag — drives whether the RCT KPI
           set includes attach/adoption (deepening) or stays friction-only. */
        includeDeepening: !!p.includeDeepening,
        experimentType: p.experimentType || (p.includeDeepening ? "deepening" : "friction"),
        /* Carry the projection through so the live-RCT KPI curves, cohort
           split, and value-at-stake all derive from the staged experiment.
           Surface treatment/control on the row too so the Go-Live split
           control initialises to the engine-computed cohort sizes. */
        projected: p.projected,
        treatmentN: p.projected?.treatmentN,
        controlN: p.projected?.controlN,
        pendingApprover: approverLine(theme),
        blurb: `${liftBlurb}. Just promoted from Simulate — awaiting approval review.`,
        justStaged: true,    // drives the "JUST STAGED" highlight in the row
        __user: true,
      };
    });
    /* Apply per-row advancements on top — promotes pending rows through
       approved → compliance → pilot when the user clicks Approve. Same
       overlay logic for user-staged and mock-historical rows, so any
       pending row in the table is approvable. */
    return [...userRows, ...MOCK_HISTORY, ...RETENTION_DEPLOY_HISTORY, ...LIQUIDITY_DEPLOY_HISTORY, ...WEALTH_DEPLOY_HISTORY, ...B2B_DEPLOY_HISTORY].map((r) =>
      advancements[r.id] ? { ...r, ...advancements[r.id] } : r
    );
  }, [stagedPolicies, advancements]);

  const filtered = rows.filter((r) => filter === "all" || r.stage === filter);

  // Aggregate header counts
  const counts = {
    all: rows.length,
    approval: rows.filter((r) => r.stage === "approval").length,
    compliance: rows.filter((r) => r.stage === "compliance").length,
    "live-pilot": rows.filter((r) => r.stage === "live-pilot").length,
  };

  /* Portfolio-level analytics — useful aggregates a Money Movement
     Director would scan when opening this view in the morning. */
  const livePilots = rows.filter((r) => r.stage === "live-pilot");
  const aggregates = useMemo(() => {
    const totalTreated = livePilots.reduce((acc, r) => acc + (r.treatmentN || 0), 0);
    const totalControl = livePilots.reduce((acc, r) => acc + (r.controlN || 0), 0);
    // Predicted NWP at stake (annual run-rate $M) per live pilot. Hard-coded
    // here for the demo; real product derives from each row's sim payload.
    // Scaled to US Bank portfolio range — multi-tens of $M per live pilot.
    const predictedNwpAtStake = livePilots.reduce((acc, r) => {
      // Staged pilots carry their own value-at-stake ($M run-rate); mock rows
      // keep the per-id lookup so the historical portfolio is unchanged.
      const nii = r.projected?.valueAtStakeM != null
        ? r.projected.valueAtStakeM
        : ({
            "mock-hist-1": 18,  // Subscription nudge
            "mock-hist-2": 64,  // Wholesale ladder
            "mock-hist-5": 31,  // telematics gig
            "mock-hist-6": 24,  // Retention nudge
            "mock-hist-10": 14, // Senior outreach (fraud loss avoided)
          }[r.id] || 12);
      return acc + nii;
    }, 0);
    const avgPilotWeek = livePilots.length
      ? livePilots.reduce((a, r) => a + (r.pilotWeek || 0), 0) / livePilots.length
      : 0;
    const pendingReview = counts.approval + counts.compliance;
    const autopilotShare = rows.length
      ? rows.filter((r) => r.stagedBy === "autopilot").length / rows.length
      : 0;
    return {
      inFlight: rows.length,
      livePilots: livePilots.length,
      pendingReview,
      totalTreated,
      totalControl,
      predictedNwpAtStake,
      avgPilotWeek,
      autopilotShare,
    };
  }, [rows, livePilots, counts.approval, counts.compliance]);

  // Empty state — only when there's literally nothing to show
  if (rows.length === 0) {
    return (
      <div className="ws-empty">
        <div className="ws-empty-tag">DEPLOY · WAITING</div>
        <h2>No staged policies</h2>
        <p>Promote a policy from the <b>Simulation Studio</b> to send it through approval, compliance, and pilot.</p>
        <button className="ws-stub-btn" onClick={() => nav("simulate")}>Open Simulation Studio →</button>
      </div>
    );
  }

  /* If the user has opened a live-RCT page, render it IN PLACE of the
     portfolio table. This keeps the workspace shell (left nav, top bar)
     visible — much cleaner than a viewport-covering overlay, and gives
     the live RCT page natural scroll behavior inside the main content
     area. "Back to Deploy" simply clears openRctId. */
  if (openRctId) {
    const rctRow = rows.find((r) => r.id === openRctId);
    if (rctRow) {
      return (
        <div className="lrp-page-shell">
          <LiveRctPage row={rctRow} onClose={() => setOpenRctId(null)} />
        </div>
      );
    }
  }

  return (
    <div className="portfolio-page">
      {/* HEADER — title + summary counts */}
      <header className="portfolio-header">
        <div className="portfolio-header-title">
          <div className="test-journey-eyebrow">OPERATIONS · DEPLOY</div>
          <h1 className="test-journey-title">Policy portfolio</h1>
          <p className="test-journey-sub">All policies in approval, compliance, or live pilot — across themes.</p>
        </div>
        <div className="portfolio-header-counts">
          <FilterChip active={filter === "all"}        onClick={() => setFilter("all")}        label="All"        count={counts.all} />
          <FilterChip active={filter === "approval"}   onClick={() => setFilter("approval")}   label="Approval"   count={counts.approval}   tone="neutral" />
          <FilterChip active={filter === "compliance"} onClick={() => setFilter("compliance")} label="Compliance" count={counts.compliance} tone="amber" />
          <FilterChip active={filter === "live-pilot"} onClick={() => setFilter("live-pilot")} label="Live pilot" count={counts["live-pilot"]} tone="blue" />
        </div>
      </header>

      {/* PORTFOLIO TABLE */}
      <div className="portfolio-body">
        {/* Analytics strip — quick aggregates a Director would scan first */}
        <div className="portfolio-aggregate">
          <div className="portfolio-agg-cell">
            <div className="portfolio-agg-k">In flight</div>
            <div className="portfolio-agg-v">{aggregates.inFlight}</div>
            <div className="portfolio-agg-s">
              {aggregates.livePilots} live · {aggregates.pendingReview} in review
            </div>
          </div>
          <div className="portfolio-agg-cell">
            <div className="portfolio-agg-k">Customers under treatment</div>
            <div className="portfolio-agg-v">{aggregates.totalTreated.toLocaleString()}</div>
            <div className="portfolio-agg-s">
              + {aggregates.totalControl.toLocaleString()} in control cohorts
            </div>
          </div>
          <div className="portfolio-agg-cell">
            <div className="portfolio-agg-k">Predicted NWP at stake</div>
            <div className="portfolio-agg-v">+${aggregates.predictedNwpAtStake.toFixed(1)}M</div>
            <div className="portfolio-agg-s">
              Across {aggregates.livePilots} live pilots · cumulative
            </div>
          </div>
          <div className="portfolio-agg-cell">
            <div className="portfolio-agg-k">Autopilot adoption</div>
            <div className="portfolio-agg-v">{Math.round(aggregates.autopilotShare * 100)}%</div>
            <div className="portfolio-agg-s">
              Avg pilot week {aggregates.avgPilotWeek.toFixed(1)} of 8
            </div>
          </div>
        </div>

        <table className="portfolio-table">
          <thead>
            <tr>
              <th className="pt-col-rank">#</th>
              <th>Policy</th>
              <th>Hypothesis</th>
              <th>Theme</th>
              <th>Stage</th>
              <th>Staged by</th>
              <th className="pt-col-date">Date</th>
              <th className="pt-col-action" aria-label="Live RCT action"></th>
              <th className="pt-col-chev" aria-label="Expand"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const isOpen = expandedId === row.id;
              const sTone = STAGE_LABEL[row.stage]?.tone || "muted";
              const sLabel = STAGE_LABEL[row.stage]?.label || row.stage;
              return (
                <Row
                  key={row.id}
                  row={row}
                  i={i}
                  isOpen={isOpen}
                  sTone={sTone}
                  sLabel={sLabel}
                  onToggle={() => setExpandedId(isOpen ? null : row.id)}
                  onOpenRct={() => setOpenRctId(row.id)}
                  // Inline expansion content — workflow timeline + relevant
                  // stage detail panels (approval / compliance / live pilot).
                  // Same component for user-staged AND historical rows; the
                  // difference is just which stages have dates filled in.
                  expandedContent={
                    <div className="portfolio-expand">
                      <div className="portfolio-expand-blurb">{row.blurb}</div>
                      <ExperimentWorkflow
                        row={row}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onRequestChanges={handleRequestChanges}
                        onGoLive={handleGoLive}
                        onOpenRct={() => setOpenRctId(row.id)}
                      />
                      {row.__user && (
                        <div className="portfolio-expand-actions">
                          <button className="portfolio-remove" onClick={() => removeStaged(row.id)}>
                            <Icon name="x" size={11} /> Remove from queue
                          </button>
                        </div>
                      )}
                    </div>
                  }
                />
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="portfolio-empty">No policies in the {STAGE_LABEL[filter]?.label.toLowerCase()} stage.</div>
        )}
      </div>

      {/* LAUNCHING MODAL — rendered at workspace level so it covers the
          main content area while any row's `_launching` flag is true.
          The handleGoLive timer clears _launching after the sequence and
          auto-opens the LiveRctPage. */}
      {(() => {
        const launchingRow = rows.find((r) => r._launching);
        if (!launchingRow) return null;
        return <LaunchingModal row={launchingRow} />;
      })()}
    </div>
  );
}

function Row({ row, i, isOpen, sTone, sLabel, onToggle, onOpenRct, expandedContent }) {
  /* Live = pilot in flight. Completion is communicated through the
     stage column (sLabel + sub-label), not via a separate row tag. */
  const isLive = row.stage === "live-pilot";
  const isJustStaged = row.justStaged;
  /* Stop row-toggle from firing when the user clicks the inline "View
     live RCT" button — clicking the button should open the page, not
     expand/collapse the row. */
  const handleOpenRct = (e) => {
    e.stopPropagation();
    onOpenRct && onOpenRct(row);
  };
  return (
    <>
      <tr
        className={
          "pt-row" +
          (isOpen ? " pt-row-open" : "") +
          (isLive ? " pt-row-live" : "") +
          (isJustStaged ? " pt-row-just-staged" : "")
        }
        onClick={onToggle}
      >
        <td className="pt-col-rank">{i + 1}</td>
        <td className="pt-policy">
          {/* Live dot only — completion state lives in the stage column. */}
          {isLive && <span className="pt-live-dot" aria-label="live scenario" />}
          <span className="pt-policy-name">{row.name}</span>
          {isLive && <span className="pt-live-tag">LIVE</span>}
          {isJustStaged && <span className="pt-new-tag">JUST STAGED</span>}
        </td>
        <td className="pt-hyp">{row.hypothesis}</td>
        <td className="pt-theme">{row.themeName}</td>
        <td>
          <span className={"pt-stage pt-stage-" + sTone}>
            {sLabel}
            {row.stage === "live-pilot" && row.stageWeek && (
              <span className="pt-stage-wk"> · wk {row.stageWeek}/{row.stageTotal}</span>
            )}
            {row.stage === "completed" && row.pilotEndReason && (
              <span className="pt-stage-wk"> · {row.pilotEndReason === "stat-sig-early-stop" ? "early stop, stat-sig" : "full duration"}</span>
            )}
          </span>
        </td>
        <td>
          <span className={"pt-stagedby pt-stagedby-" + (row.stagedBy === "autopilot" ? "ap" : "user")}>
            {row.stagedBy === "autopilot" ? "Autopilot" : "User"}
          </span>
        </td>
        <td className="pt-col-date">{fmtDate(row.stagedAt)}</td>
        {/* Live RCT button — only on live rows. Clicking opens the
            dedicated live-RCT page without expanding the row. */}
        <td className="pt-col-action">
          {isLive && (
            <button className="pt-live-action" onClick={handleOpenRct} title="Open the dedicated live RCT page">
              View live RCT <Icon name="arrowRight" size={11} />
            </button>
          )}
        </td>
        <td className="pt-col-chev">
          <Icon name={isOpen ? "chevronDown" : "chevronRight"} size={13} />
        </td>
      </tr>
      {isOpen && (
        <tr className="pt-row-expand">
          <td colSpan={9}>{expandedContent}</td>
        </tr>
      )}
    </>
  );
}

function FilterChip({ active, onClick, label, count, tone = "default" }) {
  return (
    <button
      className={"portfolio-chip" + (active ? " is-active" : "") + " portfolio-chip-" + tone}
      onClick={onClick}
    >
      <span>{label}</span>
      <span className="portfolio-chip-n">{count}</span>
    </button>
  );
}

/* Use-case-aware registries — key the approver and the theme resolution
   off the staged policy's themeId (with a cluster fallback) so the
   Deploy → View-RCT flow shows the right approver + KPI set per use case
   instead of the gig-default "Money Movement" everywhere. */
// Single source of truth for the business-owner approver is BIZ_APPROVER (in
// ExperimentWorkflow). Derive the "Name · Role" pending-approver line from it
// so the two surfaces can never drift apart again.
const approverLine = (theme) => {
  const b = BIZ_APPROVER[theme] || BIZ_APPROVER.gig;
  return `${b.name}, ${b.role}`;
};
const CLUSTER_TO_THEME = {
  "idle-cash-liquidity": "liquidity",
  "cluster_wealth_attach": "wealth",
  "mass-affluent-deposit-drift": "retention",
  "high-ltv-renewal-shopping": "retention",
  "smb-deposit-rate-defense": "smbrate",
  "smb-growth-expansion": "smbgrowth",
  "gig-economy": "gig",
};

function prettyTheme(cluster) {
  if (!cluster) return "—";
  const map = {
    "gig-economy": "Gig & rideshare",
    "under-35": "Auto Retention",
    "b2b-deposits": "Small Commercial",
    "mass-affluent": "Bundle Attach",
    "mass-affluent-deposit-drift": "Auto retention",
    "high-ltv-renewal-shopping": "Auto retention",
  };
  return map[cluster] || cluster;
}
