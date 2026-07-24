/* ============================================================================
   StagedIntermezzo — full-bleed transitional overlay between Stage and the
   destination workspace. Renders ~1.5s of punctuation so the user feels
   the handoff between phases of the Decision Loop instead of an instant
   route swap.

   Three kinds:
     - "staged-autopilot" : "Staged for Deploy by Autopilot" — used after the
                            cinematic auto-stages a policy. Twin avatar mark.
     - "staged-guided"    : "Staged for Deploy" — used when the user manually
                            clicks Stage from the results page.
     - "complete"         : Generic "done" intermezzo (reserved for future use).

   The component does NOT auto-clear itself; the caller controls the lifetime
   by setting/clearing AppShell.intermezzo. Typical flow:
     1. setIntermezzo("staged-autopilot")
     2. setTimeout(() => { setIntermezzo(null); navigate("deploy"); }, 1500)
   ========================================================================= */
import Icon from "@/components/Icon";
import "@/styles/intermezzo.css";

export default function StagedIntermezzo({ kind }) {
  const isAutopilot = kind === "staged-autopilot";
  return (
    <div className="intermezzo" role="status" aria-live="polite">
      <div className="intermezzo-card">
        <div className="intermezzo-icon">
          <Icon name="check" size={36} strokeWidth={2.2} />
        </div>
        <div className="intermezzo-tag">
          {isAutopilot ? "STAGED BY AUTOPILOT" : "STAGED"}
        </div>
        <div className="intermezzo-title">Policy queued for Deploy</div>
        <div className="intermezzo-sub">
          {isAutopilot
            ? "Twin's simulation supports the hypothesis. Opening Deploy for human review."
            : "Opening Deploy for human review."}
        </div>
      </div>
    </div>
  );
}
