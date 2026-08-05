/* ============================================================================
   Sidebar — persistent left nav. The 5 workspace items render as a vertical
   Decision Loop indicator. Each step has an SVG icon, a verb label, and a
   status glyph (active / done / pending). A subtle vertical connector line
   between the icons signals sequential progression.

   Executive Brief sits separately at the top (outside the loop) — quick
   access to the always-on CXO companion.

   Active state derives from the URL (Shell routes + legacy pages). Visited
   state comes from AppShell.visitedStages — auto-marked as the user navigates.
   ========================================================================= */
import { useNavigate, useLocation } from "react-router-dom";
import { useAppShell } from "@/state/AppShell";
import Icon from "@/components/Icon";

/* The Decision Loop — 3 stages that apply to a specific theme + hypothesis.
   Deploy and Learn moved out to OPERATIONS below — they're portfolio
   dashboards across all scenarios, not per-hypothesis loop stages. */
export const LOOP_STAGES = [
  {
    id: "sense",       step: 1, iconName: "sense",       verb: "Sense",        sub: "Decision Cockpit",
    path: "/",
    match: (l) =>
      (l.pathname === "/" && !l.search.includes("seed_route")) ||
      l.pathname.startsWith("/cockpit") ||
      l.pathname.startsWith("/theme"),
  },
  {
    id: "hypothesize", step: 2, iconName: "hypothesize", verb: "Hypothesize",  sub: "Analyse",
    path: "/?seed_route=analyse",
    match: (l) => l.search.includes("seed_route=analyse") || l.search.includes("seed_route=analyze"),
  },
  {
    id: "test",        step: 3, iconName: "test",        verb: "Test",         sub: "Simulation Studio",
    path: "/?seed_route=simulate",
    match: (l) =>
      l.search.includes("seed_route=simulate") ||
      l.pathname.startsWith("/pipeline") ||
      l.pathname.startsWith("/gig-pipeline") ||
      l.pathname.startsWith("/deep-pipeline"),
  },
];

/* Operations — portfolio-level dashboards. Deploy and Learn don't belong
   inside the per-hypothesis loop because both surface state across ALL
   active or completed scenarios. They're operational consoles, not
   exploration steps. */
export const OPS_STAGES = [
  {
    id: "deploy", iconName: "deploy", verb: "Deploy", sub: "All staged policies",
    path: "/?seed_route=deploy",
    match: (l) => l.search.includes("seed_route=deploy"),
  },
  {
    id: "learn", iconName: "learn", verb: "Learn", sub: "All measured scenarios",
    path: "/?seed_route=learn",
    match: (l) => l.search.includes("seed_route=learn"),
  },
];

/* NAV — kept exported for the GlobalTopBar breadcrumb, which uses it to
   derive the active page title. Order: Brief → loop stages → operations. */
export const NAV = [
  {
    id: "ceo",      group: "Brief", iconName: "brief", path: "/ceo",
    label: "Executive Brief",   role: "Ask TwinX · strategic companion",
    match: (l) => l.pathname.startsWith("/ceo"),
  },
  ...LOOP_STAGES.map((s) => ({
    id: s.id,    group: "Loop",       iconName: s.iconName, path: s.path,
    label: s.verb, role: s.sub, match: s.match,
  })),
  ...OPS_STAGES.map((s) => ({
    id: s.id,    group: "Operations", iconName: s.iconName, path: s.path,
    label: s.verb, role: s.sub, match: s.match,
  })),
];

/* Account / RFP-level intelligence — commercial sector only. Three screens
   with a logical flow: Quote → Elasticity & Win-Prob → Negotiation. */
export const ACCOUNT_INTEL = [
  { id: "book", iconName: "sense", verb: "Book Cockpit", sub: "Portfolio P&L + pipeline",
    path: "/?seed_route=book", match: (l) => l.search.includes("seed_route=book") },
  { id: "quoteintel", iconName: "hypothesize", verb: "Quote Intel", sub: "Multi-scenario quotes",
    path: "/?seed_route=quoteintel", match: (l) => l.search.includes("seed_route=quoteintel") },
  { id: "elasticity", iconName: "test", verb: "Elasticity & Win-Prob", sub: "Price vs the market",
    path: "/?seed_route=elasticity", match: (l) => l.search.includes("seed_route=elasticity") },
  { id: "negotiation", iconName: "deploy", verb: "Negotiation Intel", sub: "Playbook + concessions",
    path: "/?seed_route=negotiation", match: (l) => l.search.includes("seed_route=negotiation") },
];

export default function Sidebar() {
  const {
    sidebarCollapsed, toggleSidebar,
    stagedPolicies, agentActivity, visitedStages, sector,
  } = useAppShell();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingCount = stagedPolicies.filter((p) => p.status !== "deployed").length;
  const signalsCount = agentActivity.length;
  const cls = "shell-sidebar" + (sidebarCollapsed ? " collapsed" : "");

  return (
    <aside className={cls}>
      {/* Live-status pill — only when expanded */}
      {!sidebarCollapsed && (
        <div className="ss-live">
          <span className="ss-live-dot" />
          <span className="ss-live-txt">
            <b>Twin online</b> · {pendingCount} staged · {signalsCount} signals
          </span>
        </div>
      )}

      {/* BRIEF — single item, separate from the loop, sits at the top */}
      <div className="ss-section">
        {!sidebarCollapsed && <div className="ss-section-h">BRIEF</div>}
        <SidebarItem
          path="/ceo"
          isActive={location.pathname.startsWith("/ceo")}
          iconName="brief"
          label="Executive Brief"
          sub="Ask TwinX · strategic companion"
          collapsed={sidebarCollapsed}
          onClick={() => navigate("/ceo")}
        />
      </div>

      {/* DECISION LOOP — 3 per-theme exploration stages (Sense, Hypothesize,
          Test). Numbered chips + vertical connector communicate sequence. */}
      <div className="ss-section">
        {!sidebarCollapsed && <div className="ss-section-h">DECISION LOOP</div>}
        <div className="ss-loop">
          {LOOP_STAGES.map((s, i) => {
            const isActive = s.match(location);
            const isVisited = visitedStages.includes(s.id);
            const status = isActive ? "active" : (isVisited ? "done" : "pending");
            const isLast = i === LOOP_STAGES.length - 1;
            return (
              <LoopStep
                key={s.id}
                iconName={s.iconName}
                verb={s.verb}
                sub={s.sub}
                status={status}
                collapsed={sidebarCollapsed}
                showConnector={!isLast}
                onClick={() => navigate(s.path)}
              />
            );
          })}
        </div>
      </div>

      {/* ACCOUNT INTELLIGENCE — commercial only. Account/RFP-level quote,
          elasticity and negotiation intelligence (Underwriter of the Future). */}
      {sector === "commercial" && (
        <div className="ss-section">
          {!sidebarCollapsed && <div className="ss-section-h">ACCOUNT INTELLIGENCE</div>}
          <div className="ss-ops">
            {ACCOUNT_INTEL.map((s) => (
              <OpsItem
                key={s.id}
                iconName={s.iconName}
                verb={s.verb}
                sub={s.sub}
                isActive={s.match(location)}
                isVisited={false}
                collapsed={sidebarCollapsed}
                badge={null}
                onClick={() => navigate(s.path)}
              />
            ))}
          </div>
        </div>
      )}

      {/* OPERATIONS — portfolio dashboards (Deploy, Learn). Flat icons +
          labels, no numbering — these aren't a sequence, they're consoles
          that surface state across all active/completed scenarios. */}
      <div className="ss-section">
        {!sidebarCollapsed && <div className="ss-section-h">OPERATIONS</div>}
        <div className="ss-ops">
          {OPS_STAGES.map((s) => {
            const isActive = s.match(location);
            const isVisited = visitedStages.includes(s.id);
            const badge = s.id === "deploy" ? pendingCount : null;
            return (
              <OpsItem
                key={s.id}
                iconName={s.iconName}
                verb={s.verb}
                sub={s.sub}
                isActive={isActive}
                isVisited={isVisited}
                collapsed={sidebarCollapsed}
                badge={badge}
                onClick={() => navigate(s.path)}
              />
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="ss-footer">
        {!sidebarCollapsed && (
          <div className="ss-kbd-hint">
            <span className="ss-kbd-icon"><Icon name="command" size={11} /></span>
            <span className="ss-kbd">K</span>
            <span>to ask the Twin</span>
          </div>
        )}
        <button
          className="ss-collapse-btn"
          onClick={toggleSidebar}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon name={sidebarCollapsed ? "chevronRight" : "chevronLeft"} size={14} />
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

/* Generic non-loop item (Executive Brief). Smaller, no number, no connector.
   Workspace-name subtitle is suppressed in the new design — the icon + label
   carry the meaning; subtitle was repetitive noise. */
function SidebarItem({ path, isActive, iconName, label, sub, collapsed, onClick }) {
  return (
    <button
      className={"ss-item" + (isActive ? " active" : "")}
      onClick={onClick}
      title={collapsed ? label : ""}
    >
      <span className="ss-item-glyph">
        <Icon name={iconName} size={16} />
      </span>
      {!collapsed && (
        <span className="ss-item-body">
          <span className="ss-item-label">{label}</span>
        </span>
      )}
    </button>
  );
}

/* Single step in the Decision Loop. The chip always shows the stage SVG icon.
   Status is communicated by the chip's color + border + a corner pip (✓ when
   done) — NOT by replacing the icon, so each stage retains its visual identity
   regardless of state. Workspace-name subtitle dropped (was redundant with the
   verb label). */
function LoopStep({ iconName, verb, sub, status, collapsed, showConnector, badge, onClick }) {
  return (
    <button
      className={"ss-loop-step ss-loop-" + status}
      onClick={onClick}
      title={collapsed ? `${verb} — ${sub}` : sub}
    >
      <span className="ss-loop-chip-wrap">
        <span className="ss-loop-chip">
          <Icon name={iconName} size={16} />
          {status === "done" && (
            <span className="ss-loop-chip-pip">
              <Icon name="check" size={8} strokeWidth={3} />
            </span>
          )}
        </span>
        {showConnector && <span className="ss-loop-connector" />}
      </span>
      {!collapsed && (
        <span className="ss-loop-body">
          <span className="ss-loop-verb">
            {verb}
            {badge != null && badge > 0 && (
              <span className="ss-loop-badge">{badge > 99 ? "99+" : badge}</span>
            )}
          </span>
        </span>
      )}
    </button>
  );
}

/* Operations item — flat icon + label, no numbered chip and no connector
   (these aren't a sequence). A small dot indicates "active" state; pending
   count badge shows for Deploy when there are unrouted policies. */
function OpsItem({ iconName, verb, sub, isActive, isVisited, collapsed, badge, onClick }) {
  return (
    <button
      className={
        "ss-ops-item" +
        (isActive ? " is-active" : "") +
        (isVisited && !isActive ? " is-visited" : "")
      }
      onClick={onClick}
      title={collapsed ? `${verb} — ${sub}` : sub}
    >
      <span className="ss-ops-icon">
        <Icon name={iconName} size={16} />
      </span>
      {!collapsed && (
        <span className="ss-ops-body">
          <span className="ss-ops-verb">
            {verb}
            {badge != null && badge > 0 && (
              <span className="ss-loop-badge">{badge > 99 ? "99+" : badge}</span>
            )}
          </span>
          <span className="ss-ops-sub">{sub}</span>
        </span>
      )}
    </button>
  );
}
