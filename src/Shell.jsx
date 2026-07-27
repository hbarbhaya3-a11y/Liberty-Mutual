/* ============================================================================
   Shell — the unified workspace shell.

   Layout:
     [            GlobalTopBar (sticky · with notifications bell)    ]
     [ Sidebar  ][              workspace (full width)               ]
     [          floating CxoCompanion (Ask Twin) on right            ]

   The right-side RightRail was removed in favor of a notifications bell
   in the topbar — two sidebars was visually heavy. The bell surfaces
   the same agentActivity feed in a topbar popover.
   ========================================================================= */
import "@/styles/shell.css";
import { useEffect } from "react";
import { useAppShell } from "@/state/AppShell";
import Sidebar from "@/components/Sidebar";
import GlobalTopBar from "@/components/GlobalTopBar";
import CockpitWorkspace from "@/workspaces/CockpitWorkspace";
import AnalyzeWorkspace from "@/workspaces/AnalyzeWorkspace";
import SimulateWorkspace from "@/workspaces/SimulateWorkspace";
import DeployWorkspace from "@/workspaces/DeployWorkspace";
import LearnWorkspace from "@/workspaces/LearnWorkspace";
import CommercialIntelWorkspace from "@/workspaces/CommercialIntelWorkspace";
import { CxoCompanion } from "@/components/CxoCompanion";
import { PageContextProvider } from "@/state/pageContext";
import StagedIntermezzo from "@/components/StagedIntermezzo";

export default function Shell() {
  const { route, sidebarCollapsed, intermezzo, sector, selectedThemeId, selectTheme } = useAppShell();

  // Sector is authoritative for the whole exploration flow: keep the active
  // signal in-sector so Analyze/Simulate always show the right B2C vs B2B
  // content, numbers and guardrails — even if a stale B2C theme was persisted.
  useEffect(() => {
    const b2b = ["smbgrowth", "smbrate", "limits"].includes(selectedThemeId);
    if (sector === "commercial" && !b2b) selectTheme("smbgrowth");
    if (sector === "retail" && b2b) selectTheme("retention");
  }, [sector, selectedThemeId, selectTheme]);

  // Account/RFP-level commercial intelligence routes (Quote / Elasticity / Negotiation).
  const ciView = route === "quoteintel" || route === "elasticity" || route === "negotiation" ? route : null;
  const Workspace =
    ciView ? () => <CommercialIntelWorkspace view={ciView} /> :
    route === "cockpit" ? CockpitWorkspace :
    (route === "analyse" || route === "analyze") ? AnalyzeWorkspace :
    route === "simulate" ? SimulateWorkspace :
    route === "deploy" ? DeployWorkspace :
    route === "learn" ? LearnWorkspace :
    CockpitWorkspace;

  const cls = "shell" + (sidebarCollapsed ? " sidebar-collapsed" : "");
  return (
    <PageContextProvider>
      <div className={cls}>
        <GlobalTopBar />
        <div className="shell-body-wrap">
          <Sidebar />
          <div className="shell-main">
            <div className="shell-canvas">
              <div className="shell-body">
                <Workspace />
              </div>
            </div>
          </div>
        </div>
        <CxoCompanion />
        {intermezzo && <StagedIntermezzo kind={intermezzo} />}
      </div>
    </PageContextProvider>
  );
}
