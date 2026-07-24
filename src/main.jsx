import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import { ThemeProvider } from "@/components/ThemeContext";
import "@/styles/globals.css";
import "@/styles/test-journey.css";
import "@/styles/test-charts.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
