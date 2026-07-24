import React, { useEffect, useMemo, useRef, useState } from "react";

/* ============================================================================
   SimulationLoader
   ----------------------------------------------------------------------------
   Multi-phase narrated loader that plays at Step 5 of the Test journey before
   results reveal. Two variants per the GIG_FLOW_PLAN §4 spec:

     - 'whatif'    : 8 phases, ~12s total
     - 'optimizer' : 6 phases, ~10s total  (phase 2 shows live "config X / 1000")

   Each phase has: label, caption, duration, optional progress (mini bar for
   phase 3 of what-if showing wk X.X of 4; live config counter for optimizer
   phase 2). Status glyphs: ○ queued (grey) · ● running (amber pulsing) · ✓
   done (green). Overall progress bar at the bottom of the panel.

   Props
     variant      'whatif' | 'optimizer'                  default 'whatif'
     onComplete   () => void   fired ~300ms after last phase converges
     onCancel     () => void   optional; if present, renders a Cancel button
     phasesOverride  optional: replace the default phase list (for tests)
   ========================================================================== */

const WHATIF_PHASES = [
  /* Phases describe what the SIMULATION is computing right now — not setup
     work the user already did upstream (Sense / Analyse / Hypothesize). */
  {
    label: "Bootstrapping baseline",
    caption: "Cloning the cohort · seeding 1,000 parallel scenarios",
    duration: 1200,
  },
  {
    label: "Applying payment policy · weeks 1-4",
    caption: "Trust gate evaluating · ceiling lift on verified pattern",
    duration: 2500,
    progress: { kind: "weeks", total: 4 },
  },
  {
    label: "Cascading marketing · weeks 3-6",
    caption: "Channel reach × frequency × creative — adstock building",
    duration: 2000,
  },
  {
    label: "Lifting attach + primacy · weeks 5-8",
    caption: "Deepening landing on warmed-up customers",
    duration: 2000,
  },
  {
    label: "Stitching net outcomes",
    caption: "Composing the J-curve · confidence intervals tightening",
    duration: 1000,
  },
  {
    label: "Auditing guardrails",
    caption: "Fraud band · fair-lending margin · suitability",
    duration: 1500,
  },
  {
    label: "Converged",
    caption: "Results ready",
    duration: 0,
  },
];

const OPTIMIZER_PHASES = [
  {
    label: "Setting up search space",
    caption: "1,000 configurations across 7 levers",
    duration: 1000,
  },
  {
    label: "Running cohort simulation",
    caption: "8-week horizon",
    duration: 5000,
    progress: { kind: "configs", total: 1000 }, // shows config X of 1000
  },
  {
    label: "Identifying Pareto frontier",
    caption: "Evaluating NII × friction × fairness trade-offs",
    duration: 2000,
  },
  {
    label: "Ranking top 3",
    caption: "Ranking by your goal: balanced",
    duration: 1500,
  },
  {
    label: "Building configuration map",
    caption: "Mapping configuration space for visualization",
    duration: 1000,
  },
  {
    label: "Done",
    caption: "Pareto frontier identified · top 3 ready",
    duration: 0,
  },
];

export default function SimulationLoader({
  variant = "whatif",
  includeDeepening = false,
  onComplete,
  onCancel,
  phasesOverride,
}) {
  const phases = useMemo(() => {
    if (phasesOverride) return phasesOverride;
    const base = variant === "optimizer" ? OPTIMIZER_PHASES : WHATIF_PHASES;
    /* Skip the "Lifting attach + primacy" phase when the user has not
       opted into the follow-on offer — that phase models the deepening
       arena, which is now out of test scope. */
    if (variant === "whatif" && !includeDeepening) {
      return base.filter((p) => !/attach \+ primacy/i.test(p.label));
    }
    return base;
  }, [variant, phasesOverride, includeDeepening]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0); // ms inside current phase
  const tickRef = useRef(null);
  const phaseStartRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Drive phase advancement via a single rAF-style interval. We tick every
  // 80ms — fast enough for smooth bars + live counters, slow enough to be cheap.
  useEffect(() => {
    phaseStartRef.current = performance.now();
    setPhaseElapsed(0);

    const current = phases[activeIdx];
    if (!current) return;

    // Instant phase (e.g. "Done") — just advance.
    if (current.duration === 0) {
      // Last phase. Pause briefly, then fire onComplete.
      if (activeIdx === phases.length - 1) {
        const t = setTimeout(() => {
          if (onCompleteRef.current) onCompleteRef.current();
        }, 300);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setActiveIdx((i) => i + 1), 60);
      return () => clearTimeout(t);
    }

    tickRef.current = setInterval(() => {
      const now = performance.now();
      const elapsed = now - phaseStartRef.current;
      if (elapsed >= current.duration) {
        clearInterval(tickRef.current);
        setPhaseElapsed(current.duration);
        // Advance to next phase next tick to let the ✓ paint.
        setTimeout(() => setActiveIdx((i) => i + 1), 40);
      } else {
        setPhaseElapsed(elapsed);
      }
    }, 80);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [activeIdx, phases]);

  // Status for each phase: 'done' | 'running' | 'queued'
  const statusOf = (i) => {
    if (i < activeIdx) return "done";
    if (i === activeIdx) {
      // If the active phase is the synthetic "Done" instant phase, treat as done.
      if (phases[i].duration === 0) return "done";
      return "running";
    }
    return "queued";
  };

  // Overall progress fraction in [0, 1].
  const overall = useMemo(() => {
    const total = phases.reduce((a, p) => a + (p.duration || 0), 0) || 1;
    let done = 0;
    for (let i = 0; i < activeIdx; i++) done += phases[i].duration || 0;
    done += Math.min(phaseElapsed, phases[activeIdx]?.duration || 0);
    return Math.max(0, Math.min(1, done / total));
  }, [activeIdx, phaseElapsed, phases]);

  // Render a phase's live caption — for phases with a progress unit we inject
  // the live counter so the user sees motion ("wk 2.3 of 4", "config 473 of 1000").
  const renderCaption = (phase, isActive) => {
    if (!phase.progress || !isActive) return phase.caption;
    const frac = Math.min(1, phaseElapsed / phase.duration);
    if (phase.progress.kind === "weeks") {
      const wk = (frac * phase.progress.total).toFixed(1);
      return `${phase.caption} · wk ${wk} of ${phase.progress.total}`;
    }
    if (phase.progress.kind === "configs") {
      const n = Math.max(1, Math.floor(frac * phase.progress.total));
      return `Simulating config ${n} of ${phase.progress.total} · ${phase.caption}`;
    }
    return phase.caption;
  };

  return (
    <div className="sim-loader" role="status" aria-live="polite">
      <div className="sim-loader-header">
        <span className="sim-loader-marker">▶</span>
        <span className="sim-loader-title">
          {variant === "optimizer" ? "OPTIMIZER RUNNING" : "SIMULATION RUNNING"}
        </span>
        <span className="sim-loader-pct">{Math.round(overall * 100)}%</span>
        {onCancel && (
          <button
            type="button"
            className="sim-loader-cancel"
            onClick={onCancel}
            aria-label="Cancel simulation"
          >
            Cancel
          </button>
        )}
      </div>

      <ul className="sim-loader-phases">
        {phases.map((p, i) => {
          const status = statusOf(i);
          const isActive = status === "running";
          const phaseFrac =
            isActive && p.duration > 0
              ? Math.min(1, phaseElapsed / p.duration)
              : status === "done"
              ? 1
              : 0;
          return (
            <li
              key={i}
              className={`sim-loader-phase sim-loader-phase-${status}`}
            >
              <span className="sim-loader-glyph" aria-hidden="true">
                {status === "done" ? "✓" : status === "running" ? "●" : "○"}
              </span>
              <div className="sim-loader-phase-body">
                <div className="sim-loader-phase-row">
                  <span className="sim-loader-phase-label">{p.label}</span>
                  {p.progress && isActive && (
                    <div className="sim-loader-phase-mini">
                      <div
                        className="sim-loader-phase-mini-fill"
                        style={{ width: `${phaseFrac * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                {(isActive || status === "done") && p.caption && (
                  <div className="sim-loader-phase-caption">
                    {renderCaption(p, isActive)}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="sim-loader-overall">
        <div
          className="sim-loader-overall-fill"
          style={{ width: `${overall * 100}%` }}
        />
      </div>
    </div>
  );
}
