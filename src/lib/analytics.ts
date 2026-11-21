/**
 * Google Analytics 4 (GA4) Service for Mitti Sentinel
 * Conceived & Architected by Ayush Wadalkar
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Configurable GA4 Measurement ID (defaults to project measurement ID)
export const GA_MEASUREMENT_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GA_MEASUREMENT_ID) ||
  "G-8E8K7B5L7Y";

/**
 * Safe client-side event dispatcher to Google Analytics 4
 */
export function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", eventName, {
    ...params,
    app_name: "Mitti Sentinel",
    developer: "Ayush Wadalkar",
  });
}

/**
 * Domain-specific telemetry and interaction analytics
 */
export const analytics = {
  pageView: (url: string) => {
    trackEvent("page_view", { page_location: url });
  },

  selectPlot: (plotId: string, plotName: string, cropType: string) => {
    trackEvent("select_farm_plot", {
      plot_id: plotId,
      plot_name: plotName,
      crop_type: cropType,
    });
  },

  changeSpectralIndex: (index: string) => {
    trackEvent("change_spectral_index", {
      spectral_index: index,
    });
  },

  scrubSatellitePass: (passDate: string, satellite: string) => {
    trackEvent("scrub_satellite_timeline", {
      pass_date: passDate,
      satellite,
    });
  },

  confirmIrrigationAdvisory: (action: string, confidence: number) => {
    trackEvent("confirm_irrigation_advisory", {
      action,
      confidence_percent: confidence,
    });
  },

  voiceCopilotQuery: (language: string, queryLength: number) => {
    trackEvent("voice_copilot_query", {
      language,
      query_length: queryLength,
    });
  },

  actuateSolenoidValve: (zoneId: number, state: boolean, flowRateLpm: number) => {
    trackEvent("actuate_solenoid_valve", {
      zone_id: zoneId,
      state: state ? "open" : "closed",
      flow_rate_lpm: flowRateLpm,
    });
  },

  triggerJudgeTourStep: (stepIndex: number, stepTitle: string) => {
    trackEvent("judge_guided_tour_step", {
      step_index: stepIndex,
      step_title: stepTitle,
    });
  },

  testTelemetryDegradation: (type: "sensor" | "satellite", isDegraded: boolean) => {
    trackEvent("test_telemetry_degradation", {
      type,
      status: isDegraded ? "degraded" : "live",
    });
  },
};
