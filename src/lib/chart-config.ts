export const CHART_COLORS = {
  primary: "#14b8a6",     // teal
  secondary: "#3b82f6",   // blue
  accent: "#f59e0b",      // amber
  success: "#10b981",     // emerald
  warning: "#f97316",     // orange
  danger: "#ef4444",      // red
  purple: "#a855f7",
  cyan: "#06b6d4",
  pink: "#ec4899",

  // Sleep stages
  deep: "#6366f1",        // indigo
  rem: "#8b5cf6",         // violet
  light: "#a78bfa",       // light violet
  awake: "#f87171",       // red-400

  // Metrics
  heartRate: "#ef4444",
  hrv: "#8b5cf6",
  steps: "#10b981",
  calories: "#f97316",
  sleep: "#6366f1",
  recovery: "#14b8a6",
  weight: "#3b82f6",
} as const;

export const CHART_AXIS_STYLE = {
  fontSize: 11,
  fill: "hsl(240 5% 65%)",
  fontFamily: "Inter, system-ui, sans-serif",
};

export const CHART_GRID_STYLE = {
  strokeDasharray: "3 3",
  stroke: "rgba(255, 255, 255, 0.1)",
};

export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "hsl(240 10% 8%)",
    border: "1px solid hsl(240 5% 20%)",
    borderRadius: "0.75rem",
    fontSize: 12,
    color: "hsl(0 0% 98%)",
    padding: "8px 12px",
  },
  labelStyle: {
    color: "hsl(240 5% 65%)",
    fontSize: 11,
    marginBottom: 4,
  },
};
