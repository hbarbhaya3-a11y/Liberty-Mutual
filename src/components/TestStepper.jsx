import React from "react";

/* ============================================================================
   TestStepper
   ----------------------------------------------------------------------------
   Horizontal 5-chip progress stepper for the Test journey. Chip states:
     - completed : ✓ glyph, click-back enabled
     - active    : ● glyph, glowing
     - pending   : ○ glyph, dimmed, not clickable

   Props
     steps              [{ id, label }]
     activeIndex        number — currently active step
     completedIndices   number[] — completed steps (clickable)
     onStepClick        (index) => void  — only fires for completed indices
   ========================================================================== */
export default function TestStepper({
  steps = [],
  activeIndex = 0,
  completedIndices = [],
  onStepClick,
}) {
  const completedSet = new Set(completedIndices);

  return (
    <nav className="test-stepper" aria-label="Test progress">
      {steps.map((s, i) => {
        const isCompleted = completedSet.has(i);
        const isActive = i === activeIndex;
        const state = isActive ? "active" : isCompleted ? "completed" : "pending";
        const clickable = isCompleted && typeof onStepClick === "function";
        const glyph = state === "completed" ? "✓" : state === "active" ? "●" : "○";

        const Tag = clickable ? "button" : "div";
        const tagProps = clickable
          ? { type: "button", onClick: () => onStepClick(i) }
          : {};

        return (
          <React.Fragment key={s.id ?? i}>
            <Tag
              {...tagProps}
              className={`test-stepper-chip test-stepper-chip-${state}${
                clickable ? " test-stepper-chip-clickable" : ""
              }`}
              aria-current={isActive ? "step" : undefined}
              aria-label={`Step ${i + 1} ${s.label}${
                isCompleted ? " (completed)" : isActive ? " (active)" : ""
              }`}
            >
              <span className="test-stepper-n">{i + 1}</span>
              <span className="test-stepper-label">{s.label}</span>
              <span className="test-stepper-glyph" aria-hidden="true">
                {glyph}
              </span>
            </Tag>
            {i < steps.length - 1 && (
              <span className="test-stepper-sep" aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
