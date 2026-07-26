/* ============================================================================
   AppShell — global state provider for the unified workspace shell.

   Mirrors the incentives app's AppState construct: state that's shared across
   workspaces (selected theme, selected hypothesis, staged policies, agent
   activity, current route) lives here, so workspaces can read/write it
   without prop drilling and without losing context on navigation.

   Why this matters for our app:
     - Picking a hypothesis in Hub workspace sets `selectedHypothesis`.
       The Simulate workspace, when navigated to, reads it and starts at
       the right step. No URL handoff, no state reconstruction.
     - Promoting a policy from Simulate adds it to `stagedPolicies`, which
       the Deploy workspace surfaces as a pending badge in its sidebar nav.
     - The right-rail signal stream subscribes to `agentActivity`, so any
       workspace's actions show up in the global feed.
   ========================================================================= */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { useLocation } from "react-router-dom";

const AppShellCtx = createContext(null);

const SHELL_STORAGE_KEY = "twinx-shell-v1";

/* Persisted slice — what survives reload. We deliberately keep only the
   user's working selection + collapsed-rail preference. Live signals reset. */
function loadPersisted() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SHELL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePersisted(state) {
  try {
    window.localStorage.setItem(SHELL_STORAGE_KEY, JSON.stringify({
      route: state.route,
      railCollapsed: state.railCollapsed,
      sidebarCollapsed: state.sidebarCollapsed,
      selectedThemeId: state.selectedThemeId,
      selectedHypothesisId: state.selectedHypothesisId,
      themeMode: state.themeMode, // inside_out | macro
      sector: state.sector, // retail | commercial
    }));
  } catch { /* ignore */ }
}

/* ---------------- reducer ---------------- */
function reducer(state, action) {
  switch (action.type) {
    case "NAVIGATE":
      return { ...state, route: action.route };
    case "TOGGLE_RAIL":
      return { ...state, railCollapsed: !state.railCollapsed };
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case "SELECT_THEME":
      return {
        ...state,
        selectedThemeId: action.themeId,
        // Picking a new theme clears any hypothesis bound to the old theme.
        selectedHypothesisId: null,
      };
    case "SELECT_HYPOTHESIS":
      return { ...state, selectedHypothesisId: action.hypothesisId };
    case "SET_THEME_MODE":
      return { ...state, themeMode: action.themeMode };
    case "SET_SECTOR":
      // 'retail' | 'commercial'. Top-level business-line toggle that scopes
      // the whole cockpit. Retail is the built-out default; commercial is
      // the second sector we layer in later.
      return { ...state, sector: action.sector };
    case "STAGE_POLICY":
      return { ...state, stagedPolicies: [...state.stagedPolicies, action.policy] };
    case "REMOVE_STAGED":
      return { ...state, stagedPolicies: state.stagedPolicies.filter((p) => p.id !== action.id) };
    case "PUSH_AGENT_EVENT": {
      const event = { ...action.event, ts: Date.now(), id: action.event.id || `evt-${Date.now()}` };
      // Keep the most recent 50 — the rail only shows ~10 at a time.
      const trimmed = [event, ...state.agentActivity].slice(0, 50);
      return { ...state, agentActivity: trimmed };
    }
    case "CLEAR_AGENT_EVENTS":
      return { ...state, agentActivity: [] };
    case "MARK_VISITED": {
      if (!action.stage) return state;
      if (state.visitedStages.includes(action.stage)) return state;
      return { ...state, visitedStages: [...state.visitedStages, action.stage] };
    }
    case "SET_TUNE_MODE":
      // 'autopilot' | 'guided' | null. Picked upstream on the test-mode
      // branching screen; the Simulate workspace reads this on mount to
      // decide whether to run cinematically or hand control to the user.
      return { ...state, tuneMode: action.mode };
    case "SET_EXPLORATION_MODE":
      // 'whatif' | 'ifwhat'. Orthogonal to tuneMode — see initial state above.
      return { ...state, explorationMode: action.mode };
    case "RECORD_DECISION_TRACE":
      // Append a Twin decision-trace record (lever values, reasoning,
      // scenarios considered, timestamp) — surfaced later in Deploy and
      // Learn as "How Twin chose these values."
      return {
        ...state,
        decisionTrace: [{ ...action.trace, ts: Date.now() }, ...state.decisionTrace].slice(0, 20),
      };
    case "SET_INTERMEZZO":
      // Short transitional overlay between stages (e.g., "Staged for Deploy"
      // card that shows for ~1.5s before routing to DeployWorkspace).
      return { ...state, intermezzo: action.intermezzo || null };
    default:
      return state;
  }
}

/* URL seed support: ?seed_route=simulate&seed_theme=sweep&seed_hyp=H-2026-05-03
   lets us deep-link into a specific workspace+selection. Useful for demos,
   screenshots, support, and the migration period where some flows still
   route in via URL. Seed values win over persisted ones. */
function readUrlSeed() {
  if (typeof window === "undefined") return {};
  try {
    const sp = new URLSearchParams(window.location.search);
    const out = {};
    if (sp.get("seed_route")) out.route = sp.get("seed_route");
    if (sp.get("seed_theme")) out.selectedThemeId = sp.get("seed_theme");
    if (sp.get("seed_hyp")) out.selectedHypothesisId = sp.get("seed_hyp");
    return out;
  } catch { return {}; }
}

const INITIAL = (() => {
  const persisted = loadPersisted();
  const seed = readUrlSeed();
  return {
    route: seed.route || persisted.route || "cockpit",
    railCollapsed: persisted.railCollapsed === true,
    sidebarCollapsed: persisted.sidebarCollapsed === true,
    selectedThemeId: seed.selectedThemeId || persisted.selectedThemeId || null,
    selectedHypothesisId: seed.selectedHypothesisId || persisted.selectedHypothesisId || null,
    themeMode: persisted.themeMode || "internal",
    // Top-level business-line sector. Retail is the default; commercial layers
    // in later. Persisted so a chosen sector survives reload.
    sector: persisted.sector || "retail",
    stagedPolicies: [],
    agentActivity: [],
    // Stages the user has visited in this session — drives the loop checkmarks
    // in the sidebar. Set of stage IDs: 'sense' | 'hypothesize' | 'test' | 'deploy' | 'learn'.
    visitedStages: [],
    // Tuning mode picked at the test-mode branching screen.
    // 'autopilot' = Twin runs the test cinematically. 'guided' = user tunes.
    // null = no choice made yet (initial state, before the user picks).
    tuneMode: null,
    // Exploration mode — orthogonal to tuneMode. Picked at the same screen.
    //   'whatif' = you have a policy → simulate → see outcomes
    //   'ifwhat' = you have a goal   → optimize → pareto frontier + top 3
    explorationMode: "whatif",
    // Twin's decision-trace ledger. Each Autopilot run writes a record:
    // { hypothesisId, levers, reasoning[], scenarios, ts }.
    decisionTrace: [],
    // Optional transitional overlay. null when none. Currently used for
    // the "Staged for Deploy" 1.5s intermezzo between Stage and Deploy.
    intermezzo: null,
  };
})();

/* Sensible default selection when nothing's chosen — used by workspaces
   that need a theme/hypothesis context (Simulate, Analyze, Deploy, Learn).
   Gig + the recurring rent-day relief hypothesis are TwinX's most-built-out
   example, so they make a strong default landing. */
export const DEFAULT_THEME_ID = "gig";
export const DEFAULT_HYPOTHESIS_ID = "H-2026-04-12";

/* ---------------- provider ---------------- */
export function AppShellProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const location = useLocation();

  /* Sync URL → state.route on every location change.
     Without this, sidebar clicks update the URL via react-router but state.route
     stays frozen, so Shell keeps rendering the same workspace. We only sync
     when the user is on "/" (the workspace shell). On legacy routes like
     /cockpit, Shell isn't rendered, so state.route doesn't matter. */
  useEffect(() => {
    if (location.pathname !== "/") return;
    const sp = new URLSearchParams(location.search);
    let seedRoute = sp.get("seed_route") || "cockpit";
    // Normalize the old "analyze" spelling to the new "analyse" route value
    // so URL deep-links from either spelling land on the same workspace.
    if (seedRoute === "analyze") seedRoute = "analyse";
    if (seedRoute !== state.route) {
      dispatch({ type: "NAVIGATE", route: seedRoute });
    }
    // Also sync optional seed_theme / seed_hyp for deep links into a workspace
    // with a pre-selected hypothesis (used by the Hypothesis Hub + Cockpit).
    const seedTheme = sp.get("seed_theme");
    if (seedTheme && seedTheme !== state.selectedThemeId) {
      dispatch({ type: "SELECT_THEME", themeId: seedTheme });
    }
    const seedHyp = sp.get("seed_hyp");
    if (seedHyp && seedHyp !== state.selectedHypothesisId) {
      dispatch({ type: "SELECT_HYPOTHESIS", hypothesisId: seedHyp });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  /* Auto-mark loop stages as visited based on URL — drives the sidebar's
     vertical-stepper checkmarks. Stages: sense | hypothesize | test | deploy | learn. */
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const seed = sp.get("seed_route");
    let stage = null;
    if (location.pathname === "/" && (!seed || seed === "cockpit")) stage = "sense";
    else if (location.pathname.startsWith("/cockpit")) stage = "sense";
    else if (location.pathname.startsWith("/theme")) stage = "sense";
    else if (seed === "analyse" || seed === "analyze") stage = "hypothesize";
    else if (seed === "simulate"
      || location.pathname.startsWith("/pipeline")
      || location.pathname.startsWith("/gig-pipeline")
      || location.pathname.startsWith("/deep-pipeline")) stage = "test";
    else if (seed === "deploy") stage = "deploy";
    else if (seed === "learn") stage = "learn";
    if (stage) dispatch({ type: "MARK_VISITED", stage });
  }, [location.pathname, location.search]);

  // Persist on every change. Cheap — only writes ~5 fields.
  // useMemo'd dispatchers so child re-renders aren't triggered by identity changes.
  const navigate = useCallback((route) => {
    dispatch({ type: "NAVIGATE", route });
    savePersisted({ ...state, route });
  }, [state]);

  const toggleRail = useCallback(() => {
    dispatch({ type: "TOGGLE_RAIL" });
    savePersisted({ ...state, railCollapsed: !state.railCollapsed });
  }, [state]);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
    savePersisted({ ...state, sidebarCollapsed: !state.sidebarCollapsed });
  }, [state]);

  const selectTheme = useCallback((themeId) => {
    dispatch({ type: "SELECT_THEME", themeId });
    savePersisted({ ...state, selectedThemeId: themeId, selectedHypothesisId: null });
  }, [state]);

  const selectHypothesis = useCallback((hypothesisId) => {
    dispatch({ type: "SELECT_HYPOTHESIS", hypothesisId });
    savePersisted({ ...state, selectedHypothesisId: hypothesisId });
  }, [state]);

  const setThemeMode = useCallback((themeMode) => {
    dispatch({ type: "SET_THEME_MODE", themeMode });
    savePersisted({ ...state, themeMode });
  }, [state]);

  const setSector = useCallback((sector) => {
    dispatch({ type: "SET_SECTOR", sector });
    savePersisted({ ...state, sector });
  }, [state]);

  const stagePolicy = useCallback((policy) => dispatch({ type: "STAGE_POLICY", policy }), []);
  const removeStaged = useCallback((id) => dispatch({ type: "REMOVE_STAGED", id }), []);
  const pushAgentEvent = useCallback((event) => dispatch({ type: "PUSH_AGENT_EVENT", event }), []);
  const clearAgentEvents = useCallback(() => dispatch({ type: "CLEAR_AGENT_EVENTS" }), []);
  const setTuneMode = useCallback((mode) => dispatch({ type: "SET_TUNE_MODE", mode }), []);
  const setExplorationMode = useCallback((mode) => dispatch({ type: "SET_EXPLORATION_MODE", mode }), []);
  const recordDecisionTrace = useCallback((trace) => dispatch({ type: "RECORD_DECISION_TRACE", trace }), []);
  const setIntermezzo = useCallback((intermezzo) => dispatch({ type: "SET_INTERMEZZO", intermezzo }), []);

  const value = useMemo(() => ({
    ...state,
    navigate, toggleRail, toggleSidebar,
    selectTheme, selectHypothesis, setThemeMode, setSector,
    stagePolicy, removeStaged,
    pushAgentEvent, clearAgentEvents,
    setTuneMode, setExplorationMode, recordDecisionTrace, setIntermezzo,
  }), [
    state, navigate, toggleRail, toggleSidebar,
    selectTheme, selectHypothesis, setThemeMode, setSector,
    stagePolicy, removeStaged,
    pushAgentEvent, clearAgentEvents,
    setTuneMode, setExplorationMode, recordDecisionTrace, setIntermezzo,
  ]);

  return <AppShellCtx.Provider value={value}>{children}</AppShellCtx.Provider>;
}

export function useAppShell() {
  const ctx = useContext(AppShellCtx);
  if (!ctx) throw new Error("useAppShell must be used inside <AppShellProvider>");
  return ctx;
}
