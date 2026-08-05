/* ============================================================================
   SegmentedResults — the readability-first results surface, shared by the
   idle-cash / deposit-drift simulate views AND the If-What optimizer deep-dive.

   Retail Extensions:
     - Tabular consumer details view matching microsegment customer counts.
     - 100% Masked customer names end-to-end.
     - "View Content" button for channel-tailored, production-grade communications.
   ========================================================================= */
import { useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/Icon";
import { getChannelContentForSegment } from "@/data/retailConsumerContent";
import { querySyntheticCustomers } from "@/data/syntheticCustomers";
import "@/styles/segmented-results.css";

export default function SegmentedResults({
  kpis = [], charts, segments, policy = [], objective, valueLabel = "Value", accent = "#5b9dff",
  anchorRate = null, valueScale = 1,
  offerLabel = "Offer increment", rateLabel = "Recommended APY", productHeader, hideRateCap = false,
  isRetail = false, defaultTab, hideBaseline = false, singleView = false,
}) {
  const rows = (segments && segments.rows) || (Array.isArray(segments) ? segments : []);
  const hasBundle = rows.some((r) => r.bundle != null);
  const retailActive = isRetail || hasBundle || ["#5b9dff", "#b794f6", "#ffb15a", "#42e08b"].includes(accent) || rows.some((r) => r.channel != null && r.need == null);

  const [tab, setTab] = useState(defaultTab || (retailActive ? "aggregate" : "segment"));
  const [expandedRow, setExpandedRow] = useState(null);
  const [contentModalSegment, setContentModalSegment] = useState(null);
  const [copied, setCopied] = useState(false);

  // Customer Explorer State
  const [custSearch, setCustSearch] = useState("");
  const [custChannelFilter, setCustChannelFilter] = useState("All");
  const [custPage, setCustPage] = useState(1);
  const [showAll30KModal, setShowAll30KModal] = useState(false);

  const heldBack = segments && segments.heldBack;
  const isConversion = rows.some((r) => r.convPct != null);

  const totalCohortSize = rows.reduce((sum, r) => sum + (r.size ?? r.n ?? 0), 0);

  const toggleExpand = (i) => {
    if (expandedRow !== i) {
      setCustSearch("");
      setCustChannelFilter("All");
      setCustPage(1);
    }
    setExpandedRow((cur) => (cur === i ? null : i));
  };

  return (
    <div className="seg-results" style={{ "--seg-acc": accent }}>
      {/* 0 · Objective — ties the result back to the optimized input */}
      {objective && (
        <div className="seg-obj">
          <span className="seg-obj-k">Optimizing for</span>
          <span className="seg-obj-v">{objective}</span>
        </div>
      )}

      {/* 1 · KPI strip — primary KPI (i 0) leads the chosen objective, the rest support */}
      {kpis.length > 0 && (
        <div className="seg-kpis" style={{ gridTemplateColumns: `repeat(${kpis.length}, minmax(0, 1fr))` }}>
          {kpis.map((k, i) => (
            <div className={"seg-kpi" + (i === 0 ? " seg-kpi-lead" : "")} key={i}>
              <div className="seg-kpi-l">{k.label}</div>
              <div className="seg-kpi-v">{k.value}</div>
              {!hideBaseline && k.baseline != null
                ? <div className="seg-kpi-base"><span className="seg-kpi-base-k">baseline</span><span className="seg-kpi-base-v">{k.baseline}</span></div>
                : (k.sub && <div className="seg-kpi-s">{k.sub}</div>)}
            </div>
          ))}
        </div>
      )}

      {/* 2 · Tab strip — hidden in single-view (charts on top, segments below) */}
      {!singleView && (
      <div className="seg-tabs" role="tablist">
        <button className={"seg-tab" + (tab === "segment" ? " on" : "")} onClick={() => setTab("segment")}>
          By micro-segment
        </button>
        <button className={"seg-tab" + (tab === "aggregate" ? " on" : "")} onClick={() => setTab("aggregate")}>
          Aggregate
        </button>
        <span className="seg-tabs-hint">
          {tab === "aggregate" ? "The policy and its blended result" : retailActive ? "Click any micro-segment to view customer details in tabular form & view content" : "The same policy, broken out by segment"}
        </span>
      </div>
      )}

      {/* 3a · Aggregate — POLICY band (cause) then charts or summary (effect) */}
      {(singleView || tab === "aggregate") && (
        <div className="seg-pane">
          {policy.length > 0 && (
            <div className="seg-policy">
              <span className="seg-policy-tag">Policy</span>
              <div className="seg-policy-items">
                {policy.map((p, i) => (
                  <span className="seg-policy-item" key={i}>
                    <span className="seg-policy-k">{p.k}</span>
                    <span className="seg-policy-v">{p.v}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {charts ? charts : (
            <div style={{ background: "var(--panel)", border: "1px solid var(--hair)", borderRadius: 12, padding: 20, marginTop: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="pieChart" size={16} style={{ color: "var(--seg-acc)" }} />
                <span>Aggregate Portfolio Rollup Summary</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                <div style={{ background: "var(--bg-2)", padding: 14, borderRadius: 8, border: "1px solid var(--hair)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-4)", uppercase: true }}>Total Treated Accounts</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginTop: 4 }}>{totalCohortSize.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>across {rows.length} micro-segments</div>
                </div>
                <div style={{ background: "var(--bg-2)", padding: 14, borderRadius: 8, border: "1px solid var(--hair)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-4)", uppercase: true }}>Primary Channels Used</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--seg-acc)", marginTop: 6 }}>
                    {Array.from(new Set(rows.map((r) => r.channel).filter(Boolean))).join(" · ") || "Relationship Banker & Portal"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Omnichannel execution</div>
                </div>
                <div style={{ background: "var(--bg-2)", padding: 14, borderRadius: 8, border: "1px solid var(--hair)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-4)", uppercase: true }}>Guardrail Status</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", marginTop: 6 }}>
                    <Icon name="check" size={12} /> Margin Floor Enforced
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>NAIC 24-08 pricing consistency pass</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3b · By micro-segment — table (each row = its own configuration) */}
      {(singleView || tab === "segment") && (
        <div className="seg-pane">
          <div className={"seg-table" + (isConversion ? "" : " seg-table-rated")} role="table">
            <div className="seg-tr seg-thead" role="row">
              <span className="seg-th seg-col-name">Micro-segment</span>
              <span className="seg-th">{isConversion ? "Recommended motion" : (productHeader || "Offer")}</span>
              {hasBundle && <span className="seg-th">Bundle</span>}
              {isConversion ? (
                <span className="seg-th seg-col-num">Conversion</span>
              ) : (
                <>
                  {!hideRateCap && <span className="seg-th seg-col-num">{offerLabel}</span>}
                  <span className="seg-th seg-col-num">{rateLabel}</span>
                </>
              )}
              {retailActive ? (
                <>
                  <span className="seg-th">Channel</span>
                  <span className="seg-th">Renewal reminder</span>
                  <span className="seg-th">Content</span>
                </>
              ) : (
                <span className="seg-th">Channel &amp; reach-out</span>
              )}
              <span className="seg-th seg-col-num seg-col-size">Customers</span>
              <span className="seg-th seg-col-num">{valueLabel}</span>
            </div>

            {rows.map((r, i) => {
              const segSize = r.size ?? r.n ?? 1000;
              // Customer Query for Expanded Row matching total size exactly
              const queryResult = retailActive && expandedRow === i
                ? querySyntheticCustomers({ segment: r.name, totalSize: segSize, search: custSearch, filterChannel: custChannelFilter, page: custPage, pageSize: 6 })
                : null;

              return (
                <div key={i} style={{ borderBottom: "1px solid var(--hair)" }}>
                  <div
                    className={"seg-tr seg-row" + (r.noRate ? " seg-row-flat" : "") + (retailActive ? " seg-row-interactive" : "")}
                    role="row"
                    onClick={() => retailActive && toggleExpand(i)}
                    style={{ cursor: retailActive ? "pointer" : "default" }}
                  >
                    <span className="seg-td seg-col-name">
                      <span className="seg-name" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {retailActive && (
                          <span style={{ color: "var(--seg-acc)", display: "inline-flex", transition: "transform 0.15s ease", transform: expandedRow === i ? "rotate(90deg)" : "rotate(0deg)" }}>
                            <Icon name="chevronRight" size={12} />
                          </span>
                        )}
                        {r.name}
                      </span>
                      <span className="seg-need">{r.need}</span>
                    </span>
                    <span className="seg-td seg-product">{r.product}</span>
                    {hasBundle && (
                      <span className="seg-td seg-bundle" style={{ fontSize: "12px", color: "var(--ink-2)", fontWeight: 500 }}>
                        {r.bundle || "—"}
                      </span>
                    )}
                    {r.convPct != null ? (
                      <span className="seg-td seg-col-num seg-offer"><span className="seg-offer-bps">{r.convPct.toFixed(1)}%</span></span>
                    ) : (
                      <>
                        {!hideRateCap && <span className="seg-td seg-col-num seg-offer">{r.noRate ? "—" : <span className="seg-offer-bps" style={{ color: "var(--green)" }}>{r.productId === "cd_6mo" ? "—" : (r.dollarOff ? `$${r.dollarOff}` : "—")}</span>}</span>}
                        <span className="seg-td seg-col-num seg-offer">{r.noRate ? "—" : <span className="seg-offer-apy">{r.productId === "cd_6mo" ? (r.rate ? r.rate : ((r.marketRate != null ? r.marketRate : (anchorRate || 4.75)) - (r.rateBps || 0) / 100).toFixed(2) + "%") : "—"}</span>}</span>
                      </>
                    )}
                    {retailActive ? (
                      <>
                        <span className="seg-td seg-channel" style={{ fontWeight: 600, color: "var(--ink)" }}>
                          {r.channel}
                        </span>
                        <span className="seg-td seg-lead">
                          <span className="seg-channel-lead">{r.reachOutDays ? `${r.reachOutDays} days before renewal` : "45 days before renewal"}</span>
                        </span>
                        <span className="seg-td seg-content">
                          <button
                            type="button"
                            className="seg-content-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setContentModalSegment(r);
                            }}
                            title="View production content recommendation"
                          >
                            <Icon name="fileText" size={11} /> View Content
                          </button>
                        </span>
                      </>
                    ) : (
                      <span className="seg-td seg-channel">
                        <span className="seg-channel-name">{r.channel}</span>
                        {r.reachOutDays != null && (
                          <span className="seg-channel-lead">{r.reachOutDays}-day reminder</span>
                        )}
                      </span>
                    )}
                    <span className="seg-td seg-col-num seg-col-size">{segSize.toLocaleString()}</span>
                    <span className="seg-td seg-col-num seg-val">{r.conv ? r.conv : (r.niiM != null ? `+$${(r.niiM * valueScale).toFixed(1)}M` : "—")}</span>
                  </div>

                  {/* Expanded Consumers Tabular Details Sub-Row (Retail Only) */}
                  {retailActive && expandedRow === i && queryResult && (
                    <div className="seg-expanded-consumers">
                      <div className="seg-expanded-head" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div className="seg-expanded-title">
                            <Icon name="user" size={14} style={{ color: "var(--seg-acc)" }} />
                            <span>Consumer Details for <b>{r.name}</b></span>
                            <span className="seg-masked-pill">
                              <Icon name="check" size={10} /> Masked End-to-End
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink)", background: "var(--panel)", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--hair)" }}>
                              Microsegment Total: <b style={{ color: "var(--seg-acc)" }}>{r.size.toLocaleString()} Customers</b>
                            </div>
                            <button
                              className="tj-btn tj-btn-ghost"
                              onClick={(e) => { e.stopPropagation(); setShowAll30KModal(true); }}
                              style={{ fontSize: 11.5, padding: "4px 10px", color: "var(--seg-acc)" }}
                            >
                              <Icon name="eye" size={12} /> Search All Retail Customer Directory
                            </button>
                          </div>
                        </div>

                        {/* Search & Channel Filters */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", background: "var(--panel)", padding: 8, borderRadius: 8, border: "1px solid var(--hair)" }}>
                          <input
                            type="text"
                            placeholder="Filter by Policy ID, Masked Name, Vehicle/Asset..."
                            value={custSearch}
                            onChange={(e) => { setCustSearch(e.target.value); setCustPage(1); }}
                            style={{ flex: 1, minWidth: 200, padding: "6px 10px", fontSize: 12, borderRadius: 6, border: "1px solid var(--hair)", background: "var(--bg-2)", color: "var(--ink)" }}
                          />
                          <div style={{ display: "flex", gap: 4 }}>
                            {["All", "Comparion agent", "App / portal", "Email", "Direct mail"].map((ch) => (
                              <button
                                key={ch}
                                className={"tj-btn " + (custChannelFilter === ch ? "tj-btn-primary" : "tj-btn-ghost")}
                                onClick={() => { setCustChannelFilter(ch); setCustPage(1); }}
                                style={{ fontSize: 11, padding: "4px 8px" }}
                              >
                                {ch}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Tabular View for Consumer Details */}
                      <div style={{ border: "1px solid var(--hair)", borderRadius: 8, overflowX: "auto", background: "var(--panel)", marginTop: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1.7fr 1fr 1fr 0.9fr 0.9fr 0.9fr 1.1fr", gap: 8, padding: "9px 12px", background: "var(--bg-2)", font: "700 11px/1 var(--ui)", color: "var(--ink-4)", textTransform: "uppercase", minWidth: 800 }}>
                          <span>Policy ID</span>
                          <span>Customer Name</span>
                          <span>Vehicle / Asset</span>
                          <span>Annual Premium</span>
                          <span>Household LTV</span>
                          <span>Tenure</span>
                          <span>Shopping Risk</span>
                          <span>Lead</span>
                          <span>Channel</span>
                        </div>
                        {queryResult.items.map((c, idx) => (
                          <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1.7fr 1fr 1fr 0.9fr 0.9fr 0.9fr 1.1fr", gap: 8, padding: "8px 12px", borderTop: "1px solid var(--hair)", font: "500 12px/1.3 var(--ui)", color: "var(--ink)", alignItems: "center", minWidth: 800 }}>
                            <span style={{ fontFamily: "var(--mono)", color: "var(--seg-acc)", fontWeight: 600 }}>{c.id}</span>
                            <span style={{ fontWeight: 600 }}>{c.maskedName}</span>
                            <span style={{ color: "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.asset}</span>
                            <span style={{ fontFamily: "var(--mono)" }}>{c.annualPremium}</span>
                            <span style={{ fontFamily: "var(--mono)", color: "var(--green)", fontWeight: 600 }}>{c.householdLTV}</span>
                            <span>{c.tenureYears}</span>
                            <span style={{ color: "var(--red)", fontWeight: 700 }}>{c.shoppingRiskPct}</span>
                            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{c.noticeLead}</span>
                            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{c.recommendedChannel}</span>
                          </div>
                        ))}
                      </div>

                      {/* Pagination Bar */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, borderTop: "1px solid var(--hair)", paddingTop: 10, fontSize: 11.5, color: "var(--ink-3)" }}>
                        <span>
                          Showing <b>{queryResult.items.length}</b> of <b>{queryResult.totalMatching.toLocaleString()}</b> customers in <b>{r.name}</b> (Matches Microsegment Total)
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            className="tj-btn tj-btn-ghost"
                            disabled={queryResult.currentPage === 1}
                            onClick={() => setCustPage((p) => Math.max(1, p - 1))}
                            style={{ padding: "3px 8px", fontSize: 11 }}
                          >
                            <Icon name="arrowLeft" size={11} /> Prev
                          </button>
                          <span>Page <b>{queryResult.currentPage}</b> of <b>{queryResult.totalPages}</b></span>
                          <button
                            className="tj-btn tj-btn-ghost"
                            disabled={queryResult.currentPage === queryResult.totalPages}
                            onClick={() => setCustPage((p) => Math.min(queryResult.totalPages, p + 1))}
                            style={{ padding: "3px 8px", fontSize: 11 }}
                          >
                            Next <Icon name="arrowRight" size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {heldBack && heldBack.size > 0 && (
              <div className="seg-tr seg-row seg-row-held" role="row">
                <span className="seg-td seg-col-name">
                  <span className="seg-name">{heldBack.label}</span>
                  <span className="seg-need">Modeled to stay / not suitable — no offer, by design.</span>
                </span>
                <span className="seg-td seg-product">— No offer —</span>
                {isConversion ? (
                  <span className="seg-td seg-col-num seg-offer">—</span>
                ) : (
                  <>
                    <span className="seg-td seg-col-num seg-offer">—</span>
                    <span className="seg-td seg-col-num seg-offer">—</span>
                  </>
                )}
                <span className="seg-td seg-channel">—</span>
                <span className="seg-td seg-col-num seg-col-size">{heldBack.size.toLocaleString()}</span>
                <span className="seg-td seg-col-num seg-val">$0</span>
              </div>
            )}
          </div>
          <div className="seg-foot">
            Each row is the system's recommended action for that segment — {isConversion ? "motions" : "products, rates"} and
            channels vary by what each segment needs. {retailActive ? "Click any row to expand customer details in tabular form or click 'View Content' to inspect production marketing materials." : "Values sum to the aggregate KPIs above."}
          </div>
        </div>
      )}

      {/* Production Content Recommendation Modal Overlay (Retail Only) */}
      {retailActive && contentModalSegment && (() => {
        const content = getChannelContentForSegment(contentModalSegment);
        return createPortal((
          <div className="sim-overlay" role="dialog" aria-modal="true" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
            <div className="sim-overlay-backdrop" onClick={() => setContentModalSegment(null)} />
            <div className="sim-overlay-card seg-modal-card">
              <div className="seg-modal-header">
                <div>
                  <div className="seg-modal-eyebrow">
                    <Icon name="sparkles" size={12} /> RETAIL CONTENT RECOMMENDATION
                  </div>
                  <h3 className="seg-modal-title">{content.channelTitle}</h3>
                  <div className="seg-modal-sub">
                    Micro-Segment: <b>{contentModalSegment.name}</b> · Channel: <b>{contentModalSegment.channel}</b>
                  </div>
                </div>
                <button className="tj-btn tj-btn-ghost seg-modal-close" onClick={() => setContentModalSegment(null)}>
                  <Icon name="x" size={16} />
                </button>
              </div>

              <div className="seg-modal-body">
                {content.channelType === "email" && (
                  <div className="seg-email-preview">
                    <div className="seg-email-header">
                      <div><b>Subject:</b> {content.subject}</div>
                      <div className="seg-email-pre"><b>Preheader:</b> {content.preheader}</div>
                    </div>
                    <div className="seg-email-card">
                      <div className="seg-email-hero-tag">{content.heroHeader}</div>
                      <div className="seg-email-text">{content.bodyParagraph}</div>
                      <div className="seg-email-offer-box">
                        <div className="seg-email-offer-title">Rate Guarantee: {content.offerBox.rateCap}</div>
                        <div className="seg-email-offer-sub">{content.offerBox.credit}</div>
                        <div className="seg-email-offer-bonus">{content.offerBox.bundleBonus}</div>
                      </div>
                      <button className="seg-email-cta">{content.ctaText}</button>
                    </div>
                    <div className="seg-email-footer">{content.unsubscribeFooter}</div>
                  </div>
                )}

                {content.channelType === "app" && (
                  <div className="seg-app-preview">
                    <div className="seg-phone-mockup">
                      <div className="seg-phone-head">
                        <span className="seg-phone-badge">{content.badge}</span>
                        <span className="seg-phone-time">App Notification</span>
                      </div>
                      <div className="seg-phone-title">{content.pushTitle}</div>
                      <div className="seg-phone-body">{content.pushBody}</div>
                      <div className="seg-phone-link">Deep-link: {content.deepLink}</div>
                      <button className="seg-phone-cta">{content.ctaText}</button>
                    </div>
                  </div>
                )}

                {content.channelType === "banker" && (
                  <div className="seg-agent-preview">
                    <div className="seg-agent-role">
                      <Icon name="phone" size={13} /> {content.agentRole}
                    </div>
                    <div className="seg-agent-section">
                      <div className="seg-agent-label">1. Opening Salutation</div>
                      <div className="seg-agent-quote">{content.openingLine}</div>
                    </div>
                    <div className="seg-agent-section">
                      <div className="seg-agent-label">2. Key Talking Points</div>
                      <ul className="seg-agent-list">
                        {content.talkingPoints.map((tp, i) => (
                          <li key={i}>{tp}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="seg-agent-section">
                      <div className="seg-agent-label">3. Objection Handling</div>
                      <div className="seg-agent-objection">{content.objectionHandling}</div>
                    </div>
                  </div>
                )}

                {content.channelType === "mail" && (
                  <div className="seg-mail-preview">
                    <div className="seg-mail-header">{content.header}</div>
                    <div className="seg-mail-salutation">{content.salutation}</div>
                    <div className="seg-mail-body">{content.bodyText}</div>
                    <div className="seg-mail-cert">
                      <div className="seg-mail-cert-title">{content.certificateBox.title}</div>
                      <div>Rate Cap: <b>{content.certificateBox.offerName}</b></div>
                      <div>Bundle Offer: <b>{content.certificateBox.bundleDiscount}</b></div>
                    </div>
                    <div className="seg-mail-cta">{content.ctaText}</div>
                  </div>
                )}
              </div>

              <div className="seg-modal-footer">
                <button className="tj-btn tj-btn-ghost" onClick={() => setContentModalSegment(null)}>
                  Close
                </button>
                <button
                  className="tj-btn tj-btn-primary"
                  onClick={() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  <Icon name="check" size={14} /> {copied ? "Copied to Clipboard!" : "Copy Campaign Content"}
                </button>
              </div>
            </div>
          </div>
        ), document.body);
      })()}

      {/* Full 30,000 Retail Customer Directory Global Modal */}
      {showAll30KModal && (() => {
        const fullQueryResult = querySyntheticCustomers({ segment: "All", search: custSearch, filterChannel: custChannelFilter, page: custPage, pageSize: 8 });
        return createPortal((
          <div className="sim-overlay" role="dialog" aria-modal="true" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
            <div className="sim-overlay-backdrop" onClick={() => setShowAll30KModal(false)} />
            <div className="sim-overlay-card seg-modal-card" style={{ maxWidth: 820, width: "95%" }}>
              <div className="seg-modal-header">
                <div>
                  <div className="seg-modal-eyebrow">
                    <Icon name="user" size={12} /> RETAIL POLICYHOLDERS DIRECTORY (30,000 RECORDS)
                  </div>
                  <h3 className="seg-modal-title">Retail Customers Database</h3>
                  <div className="seg-modal-sub">
                    100% Masked Names End-To-End · Queryable across all 14 micro-segments
                  </div>
                </div>
                <button className="tj-btn tj-btn-ghost seg-modal-close" onClick={() => setShowAll30KModal(false)}>
                  <Icon name="x" size={16} />
                </button>
              </div>

              <div className="seg-modal-body">
                {/* Search & Channel Filters */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", background: "var(--panel)", padding: 10, borderRadius: 8, border: "1px solid var(--hair)", marginBottom: 14 }}>
                  <input
                    type="text"
                    placeholder="Search 30,000 records by Policy ID, Masked Name, Vehicle/Asset, Channel..."
                    value={custSearch}
                    onChange={(e) => { setCustSearch(e.target.value); setCustPage(1); }}
                    style={{ flex: 1, minWidth: 260, padding: "8px 12px", fontSize: 13, borderRadius: 6, border: "1px solid var(--hair)", background: "var(--bg-2)", color: "var(--ink)" }}
                  />
                  <div style={{ display: "flex", gap: 4 }}>
                    {["All", "Comparion agent", "App / portal", "Email", "Direct mail"].map((ch) => (
                      <button
                        key={ch}
                        className={"tj-btn " + (custChannelFilter === ch ? "tj-btn-primary" : "tj-btn-ghost")}
                        onClick={() => { setCustChannelFilter(ch); setCustPage(1); }}
                        style={{ fontSize: 11.5, padding: "5px 9px" }}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table View of 30,000 dataset */}
                <div style={{ border: "1px solid var(--hair)", borderRadius: 8, overflow: "hidden", background: "var(--panel)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1.8fr 1fr 1fr 1.1fr 1fr", gap: 10, padding: "10px 12px", background: "var(--bg-2)", font: "700 11px/1 var(--ui)", color: "var(--ink-4)", textTransform: "uppercase" }}>
                    <span>Policy ID</span>
                    <span>Masked Name</span>
                    <span>Asset / Vehicle</span>
                    <span>Premium</span>
                    <span>LTV</span>
                    <span>Micro-Segment</span>
                    <span>Channel</span>
                  </div>
                  {fullQueryResult.items.map((c, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1.8fr 1fr 1fr 1.1fr 1fr", gap: 10, padding: "9px 12px", borderTop: "1px solid var(--hair)", font: "500 12px/1.3 var(--ui)", color: "var(--ink)" }}>
                      <span style={{ fontFamily: "var(--mono)", color: "var(--seg-acc)" }}>{c.id}</span>
                      <span style={{ fontWeight: 600 }}>{c.maskedName}</span>
                      <span style={{ color: "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.asset}</span>
                      <span style={{ fontFamily: "var(--mono)" }}>{c.annualPremium}</span>
                      <span style={{ fontFamily: "var(--mono)", color: "var(--green)" }}>{c.householdLTV}</span>
                      <span style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.segment}</span>
                      <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{c.recommendedChannel}</span>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 12, color: "var(--ink-3)" }}>
                  <span>Matching <b>{fullQueryResult.totalMatching.toLocaleString()}</b> of <b>30,000</b> policyholders</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button className="tj-btn tj-btn-ghost" disabled={fullQueryResult.currentPage === 1} onClick={() => setCustPage((p) => Math.max(1, p - 1))}>
                      <Icon name="arrowLeft" size={12} /> Prev
                    </button>
                    <span>Page <b>{fullQueryResult.currentPage}</b> of <b>{fullQueryResult.totalPages}</b></span>
                    <button className="tj-btn tj-btn-ghost" disabled={fullQueryResult.currentPage === fullQueryResult.totalPages} onClick={() => setCustPage((p) => Math.min(fullQueryResult.totalPages, p + 1))}>
                      Next <Icon name="arrowRight" size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="seg-modal-footer">
                <button className="tj-btn tj-btn-primary" onClick={() => setShowAll30KModal(false)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        ), document.body);
      })()}
    </div>
  );
}
