/* ============================================================================
   B2B (SMB) config registry — resolves a theme id to its config so the shared,
   config-driven B2B views (B2BClusterView, B2BSimulateView) stay theme-agnostic.
   ========================================================================= */
import { B2B_GROWTH_CONFIG } from "@/data/b2bGrowthConfig";
import { B2B_RATE_CONFIG } from "@/data/b2bRateConfig";

export const B2B_CONFIGS = {
  smbgrowth: B2B_GROWTH_CONFIG,
  smbrate: B2B_RATE_CONFIG,
};

export const isB2B = (themeId) => Object.prototype.hasOwnProperty.call(B2B_CONFIGS, themeId);
export const getB2BConfig = (themeId) => B2B_CONFIGS[themeId] || null;
