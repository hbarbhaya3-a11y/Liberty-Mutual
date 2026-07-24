/* ============================================================================
   TestModeChooser — modal that opens from the "Test this hypothesis" button.

   Two-row layout:
     - Top row : the two exploration modes — What-If (recommended) and
                 If-What — sit side by side. These are the operator's two
                 ways to think about the policy space.
     - Below   : Autopilot — a different decision (Twin drives end-to-end).
                 It lives under the exploration choices because it's a
                 separate axis, not a competing mode.

   ┌─────────────────────────────┐  ┌─────────────────────────────┐
   │ ★ What-If workbench         │  │ If-What optimizer           │
   │ Tune the levers · simulate  │  │ Goal + ranges · Pareto + 3  │
   │                  [Open →]   │  │                  [Open →]   │
   └─────────────────────────────┘  └─────────────────────────────┘

                           ── Or ──

   ┌─────────────────────────────────────────────────────────────┐
   │ ▶ Run on Autopilot                                          │
   │   Twin drives the test end-to-end · ~16s · you watch        │
   │                                              [Start →]      │
   └─────────────────────────────────────────────────────────────┘
   ========================================================================= */
import { useEffect } from "react";
import { useAppShell } from "@/state/AppShell";
import Icon from "@/components/Icon";
import "@/styles/test-mode.css";

export default function TestModeChooser({ open, onClose, eyebrow }) {
  const { navigate: nav, setTuneMode, setExplorationMode } = useAppShell();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const go = (explorationMode, tuneMode) => () => {
    setExplorationMode(explorationMode);
    setTuneMode(tuneMode);
    onClose();
    nav("simulate");
  };

  return (
    <div className="tm-modal" role="dialog" aria-modal="true" aria-label="How should this test run">
      <div className="tm-modal-backdrop" onClick={onClose} />
      <div className="tm-modal-card tm-modal-card-simple">
        <header className="tm-modal-header">
          <div>
            <div className="tm-eyebrow">{eyebrow || "TESTING · POLICY HYPOTHESIS"}</div>
            <h2 className="tm-modal-title">How should we test this?</h2>
          </div>
          <button className="tm-modal-close" onClick={onClose} aria-label="Close">
            <Icon name="x" size={14} />
          </button>
        </header>

        {/* TOP ROW — If-What is now the primary path (left/first position
            + RECOMMENDED tag). The optimizer-first framing matches the
            story we want to lead with: give the system the goal, get
            three feasible policies back. What-If sits on the right as
            the manual workbench alternative for when the user already
            has a specific policy to test. */}
        <div className="tm-explore-row">
          {/* If-What — recommended primary path */}
          <button
            className="tm-explore-card tm-explore-ifwhat"
            onClick={go("ifwhat", "guided")}
            aria-label="Open the If-What optimizer"
          >
            <div className="tm-explore-h">
              <div className="tm-explore-icon tm-explore-icon-violet"><Icon name="hypothesize" size={18} /></div>
              <div className="tm-explore-titles">
                <div className="tm-explore-name">If-What optimizer</div>
                <div className="tm-explore-tagline">Pick the goal · system finds the top 3 policies</div>
              </div>
              <div className="tm-explore-tag">
                <Icon name="star" size={10} /> RECOMMENDED
              </div>
            </div>
            <ul className="tm-explore-list">
              <li>Choose a CX objective (payment success, complaint reduction, NII, primacy retention)</li>
              <li>Set the search ranges on the levers — same fidelity as What-If</li>
              <li>Gets back 3 feasible policies ranked on the Pareto frontier · deep-dive any one</li>
            </ul>
            <div className="tm-explore-cta tm-explore-cta-violet">
              Open optimizer <Icon name="arrowRight" size={13} />
            </div>
          </button>

          {/* What-If — manual workbench, secondary */}
          <button
            className="tm-explore-card tm-explore-whatif"
            onClick={go("whatif", "guided")}
            aria-label="Open the What-If workbench"
          >
            <div className="tm-explore-h">
              <div className="tm-explore-icon tm-explore-icon-blue"><Icon name="test" size={18} /></div>
              <div className="tm-explore-titles">
                <div className="tm-explore-name">What-If workbench</div>
                <div className="tm-explore-tagline">Set the levers yourself · simulate one policy</div>
              </div>
            </div>
            <ul className="tm-explore-list">
              <li>You set every lever — eligibility threshold, offer size, channels, follow-on</li>
              <li>Full 8-week simulation of that single policy · verdict + proof KPIs + curves</li>
              <li>Best when you already know which policy you want to pressure-test</li>
            </ul>
            <div className="tm-explore-cta tm-explore-cta-blue">
              Open workbench <Icon name="arrowRight" size={13} />
            </div>
          </button>
        </div>

        {/* OR divider */}
        <div className="tm-or">
          <span className="tm-or-line" />
          <span className="tm-or-text">Or</span>
          <span className="tm-or-line" />
        </div>

        {/* BELOW — Autopilot, full width */}
        <button
          className="tm-autopilot-row"
          onClick={go("whatif", "autopilot")}
          aria-label="Run on Autopilot"
        >
          <div className="tm-autopilot-l">
            <div className="tm-autopilot-icon"><Icon name="play" size={18} /></div>
            <div className="tm-autopilot-text">
              <div className="tm-autopilot-name">Run on Autopilot</div>
              <div className="tm-autopilot-sub">Twin drives the test end-to-end. Watch the workbench populate, the simulation run, the results land, and the policy stage for Deploy. ~16 seconds.</div>
            </div>
          </div>
          <div className="tm-autopilot-cta">
            Start <Icon name="arrowRight" size={13} />
          </div>
        </button>
      </div>
    </div>
  );
}
