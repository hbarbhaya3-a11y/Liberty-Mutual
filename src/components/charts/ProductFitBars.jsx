import React, { useMemo } from "react";
import "@/styles/test-charts.css";

/**
 * ProductFitBars — 5 horizontal bars showing product attach × NII per adopter.
 *
 * Each bar:
 *   - product name (left)
 *   - bar fill = attach%
 *   - NII number (right)
 *   - ● + accent border on the selected product
 *   - ★ on the best-NII product (attach × NII)
 *
 * Props
 *   selectedProduct : string id — one of the keys below
 */

const PRODUCTS = [
  { id: "hy_savings",     name: "HY Savings",     attach: 0.22, nii: 520 },
  { id: "ewa",            name: "EWA",            attach: 0.28, nii: 240 },
  { id: "dd_switch",      name: "DD Switch",      attach: 0.19, nii: 610 },
  { id: "secured_card",   name: "Secured Card",   attach: 0.16, nii: 380 },
  { id: "credit_builder", name: "Credit Builder", attach: 0.14, nii: 300 },
];

const fmt$ = (v) => `$${v.toLocaleString()}`;

export default function ProductFitBars({ selectedProduct = "hy_savings" }) {
  const { bestId, sel } = useMemo(() => {
    let bid = PRODUCTS[0].id;
    let bex = 0;
    for (const p of PRODUCTS) {
      const expected = p.attach * p.nii;
      if (expected > bex) {
        bex = expected;
        bid = p.id;
      }
    }
    const s = PRODUCTS.find((p) => p.id === selectedProduct) || PRODUCTS[0];
    return { bestId: bid, sel: s };
  }, [selectedProduct]);

  const W = 600;
  const H = 250;
  const PAD_L = 150;
  const PAD_R = 120;
  const ROW_H = 30;
  const ROW_GAP = 12;
  const maxAttach = Math.max(...PRODUCTS.map((p) => p.attach));
  const maxBarW = W - PAD_L - PAD_R;

  return (
    <div className="test-chart chart-product-fit">
      <div className="tc-title">Product fit — attach × NII per adopter</div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Product fit bars">
        {PRODUCTS.map((p, i) => {
          const y = 16 + i * (ROW_H + ROW_GAP);
          const w = Math.max(2, (p.attach / maxAttach) * maxBarW);
          const isSel = p.id === selectedProduct;
          const isBest = p.id === bestId;
          const fillCls = isSel ? "selected" : isBest ? "best" : "";
          return (
            <g key={p.id} className="pf-row">
              {isSel && (
                <rect
                  x={4}
                  y={y - 4}
                  width={W - 8}
                  height={ROW_H + 8}
                  rx={6}
                  className="pf-row-bg selected"
                />
              )}
              {/* selected dot in label */}
              <text x={PAD_L - 10} y={y + ROW_H / 2 + 4} textAnchor="end" className="tc-label">
                {isSel ? "● " : ""}{p.name} {isBest ? <tspan className="pf-star">★</tspan> : null}
              </text>
              <rect x={PAD_L} y={y} width={maxBarW} height={ROW_H} rx={4} className="pf-bar-bg" />
              <rect x={PAD_L} y={y} width={w} height={ROW_H} rx={4} className={`pf-bar-fill ${fillCls}`} />
              <text x={PAD_L + 8} y={y + ROW_H / 2 + 4} className="tc-sub">
                {Math.round(p.attach * 100)}% attach
              </text>
              <text x={W - 10} y={y + ROW_H / 2 + 4} textAnchor="end" className="tc-num">
                {fmt$(p.nii)}/adopter
              </text>
              {isSel && (
                <rect
                  x={PAD_L - 1}
                  y={y - 1}
                  width={maxBarW + 2}
                  height={ROW_H + 2}
                  rx={5}
                  fill="none"
                  stroke="var(--acc)"
                  strokeWidth="1.5"
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="tc-commentary">
        <b>▶</b> Your pick: <b>{sel.name}</b> ({Math.round(sel.attach * 100)}% × {fmt$(sel.nii)} = <b>{fmt$(Math.round(sel.attach * sel.nii))}</b> expected NII per eligible).
      </div>
    </div>
  );
}
