/* ============================================================================
   PageShell — wraps legacy pages with:
     - GlobalTopBar (sticky, top, full width)
     - Sidebar on the left (starts below the topbar)
     - Main content
     - CxoCompanion floating widget (Ask Twin) on the right

   Cockpit renders its own CxoCompanion already, so we suppress ours via the
   `noAskTwin` prop to avoid double-mounting.
   ========================================================================= */
import "@/styles/shell.css";
import { useAppShell } from "@/state/AppShell";
import Sidebar from "@/components/Sidebar";
import GlobalTopBar from "@/components/GlobalTopBar";
import { CxoCompanion } from "@/components/CxoCompanion";

export default function PageShell({ children, noAskTwin = false }) {
  const { sidebarCollapsed } = useAppShell();
  return (
    <div className={"page-shell" + (sidebarCollapsed ? " sidebar-collapsed" : "")}>
      <GlobalTopBar />
      <div className="page-shell-body">
        <Sidebar />
        <main className="page-shell-main">
          {children}
        </main>
      </div>
      {!noAskTwin && <CxoCompanion />}
    </div>
  );
}
