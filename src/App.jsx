import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShellProvider } from "@/state/AppShell";
import Shell from "@/Shell";
import Cockpit from "@/pages/Cockpit";
import Ceo from "@/pages/Ceo";
import Theme from "@/pages/Theme";
import GigPipeline from "@/pages/GigPipeline";
import DeepPipeline from "@/pages/DeepPipeline";
import Pipeline from "@/pages/Pipeline";

/* AppShellProvider wraps everything so the persistent sidebar + global
   state (selection, staged policies, agent activity) are available on
   every route — not just the Shell-hosted workspaces. Legacy pages
   (Cockpit, Theme, Pipeline) can now mount the same Sidebar component
   and share state. */
export default function App() {
  return (
    <BrowserRouter>
      <AppShellProvider>
        <Routes>
          <Route path="/" element={<Shell />} />
          <Route path="/cockpit" element={<Cockpit />} />
          <Route path="/cockpit-legacy" element={<Cockpit />} />
          <Route path="/theme" element={<Theme />} />
          <Route path="/theme-legacy" element={<Theme />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/pipeline-legacy" element={<Pipeline />} />
          <Route path="/gig-pipeline" element={<GigPipeline />} />
          <Route path="/gig-pipeline-legacy" element={<GigPipeline />} />
          <Route path="/deep-pipeline" element={<DeepPipeline />} />
          <Route path="/deep-pipeline-legacy" element={<DeepPipeline />} />
          <Route path="/ceo" element={<Ceo />} />
          <Route path="*" element={<Shell />} />
        </Routes>
      </AppShellProvider>
    </BrowserRouter>
  );
}
