export interface SensorMeta {
  entityId: string;
  label: string;
  unit: string;
  group: "oura" | "withings" | "other";
  format?: (state: string) => string;
  getColor: (state: string) => string;
}

function formatHours(h: string): string {
  const hrs = Number(h);
  if (isNaN(hrs)) return h;
  const wholeH = Math.floor(hrs);
  const mins = Math.round((hrs - wholeH) * 60);
  return wholeH > 0 ? `${wholeH}h ${mins}m` : `${mins}m`;
}

// --- Color functions ---

function scoreColor(s: string): string {
  const v = Number(s);
  if (v >= 85) return "text-emerald-400";
  if (v >= 70) return "text-amber-400";
  return "text-red-400";
}

function sleepDurationColorHrs(s: string): string {
  const hrs = Number(s);
  if (hrs >= 7) return "text-emerald-400";
  if (hrs >= 6) return "text-amber-400";
  return "text-red-400";
}

function deepSleepColorHrs(s: string): string {
  const hrs = Number(s);
  if (hrs >= 1.0) return "text-emerald-400";
  if (hrs >= 0.67) return "text-amber-400";   // 40min
  return "text-red-400";
}

function remSleepColorHrs(s: string): string {
  const hrs = Number(s);
  if (hrs >= 1.5) return "text-emerald-400";
  if (hrs >= 1.0) return "text-amber-400";
  return "text-red-400";
}

function cardioAgeColor(s: string): string {
  const cardioAge = Number(s);
  const chronoAge = new Date().getFullYear() - 1978;
  if (cardioAge <= chronoAge - 2) return "text-emerald-400";
  if (cardioAge <= chronoAge + 2) return "text-amber-400";
  return "text-red-400";
}

function resilienceColor(s: string): string {
  const v = s.toLowerCase();
  if (v === "strong" || v === "exceptional") return "text-emerald-400";
  if (v === "adequate") return "text-amber-400";
  return "text-red-400";
}

function stepsColor(s: string): string {
  const v = Number(s);
  if (v >= 10000) return "text-emerald-400";
  if (v >= 7000) return "text-amber-400";
  return "text-red-400";
}

function tempDevColor(s: string): string {
  const v = Math.abs(Number(s));
  if (v <= 0.5) return "text-emerald-400";
  if (v <= 1.0) return "text-amber-400";
  return "text-red-400";
}

function bmiColor(s: string): string {
  const v = Number(s);
  if (v >= 18.5 && v < 25) return "text-emerald-400";
  if (v >= 25 && v < 30) return "text-amber-400";
  return "text-red-400";
}

function bodyFatColor(s: string): string {
  const v = Number(s);
  if (v < 18) return "text-emerald-400";
  if (v < 25) return "text-amber-400";
  return "text-red-400";
}

function fatMassColor(s: string): string {
  const v = Number(s);
  if (v < 15) return "text-emerald-400";
  if (v < 20) return "text-amber-400";
  return "text-red-400";
}

function efficiencyColor(s: string): string {
  const v = Number(s);
  if (v >= 85) return "text-emerald-400";
  if (v >= 75) return "text-amber-400";
  return "text-red-400";
}

function hrColor(s: string): string {
  const v = Number(s);
  if (v <= 55) return "text-emerald-400";      // great resting HR
  if (v <= 65) return "text-amber-400";
  return "text-red-400";
}

function spo2Color(s: string): string {
  const v = Number(s);
  if (v >= 96) return "text-emerald-400";
  if (v >= 94) return "text-amber-400";
  return "text-red-400";
}

function stressColor(s: string): string {
  const v = s.toLowerCase();
  if (v === "normal" || v === "restored") return "text-emerald-400";
  if (v === "elevated") return "text-amber-400";
  return "text-red-400";
}

function coldPlungeColor(s: string): string {
  const v = Number(s);
  if (v <= 5) return "text-sky-400";
  if (v <= 10) return "text-cyan-400";
  return "text-amber-400";
}

function hrvColor(s: string): string {
  const v = Number(s);
  if (v >= 40) return "text-emerald-400";     // good for 40s male
  if (v >= 25) return "text-amber-400";
  return "text-red-400";
}

const neutral = () => "text-blue-400";

export const SENSOR_CONFIG: SensorMeta[] = [
  // Oura — Sleep
  { entityId: "sensor.oura_ring_sleep_score", label: "Sleep Score", unit: "", group: "oura", getColor: scoreColor },
  { entityId: "sensor.oura_ring_total_sleep_duration", label: "Total Sleep", unit: "", group: "oura", format: formatHours, getColor: sleepDurationColorHrs },
  { entityId: "sensor.oura_ring_deep_sleep_duration", label: "Deep Sleep", unit: "", group: "oura", format: formatHours, getColor: deepSleepColorHrs },
  { entityId: "sensor.oura_ring_rem_sleep_duration", label: "REM Sleep", unit: "", group: "oura", format: formatHours, getColor: remSleepColorHrs },
  { entityId: "sensor.oura_ring_sleep_efficiency", label: "Sleep Efficiency", unit: "%", group: "oura", getColor: efficiencyColor },

  // Oura — Recovery & Readiness
  { entityId: "sensor.oura_ring_readiness_score", label: "Recovery", unit: "", group: "oura", getColor: scoreColor },
  { entityId: "sensor.oura_ring_hrv_balance_score", label: "HRV Balance", unit: "", group: "oura", getColor: scoreColor },
  { entityId: "sensor.oura_ring_average_sleep_hrv", label: "Sleep HRV", unit: "ms", group: "oura", getColor: hrvColor },
  { entityId: "sensor.oura_ring_resilience_level", label: "Resilience", unit: "", group: "oura", getColor: resilienceColor },
  { entityId: "sensor.oura_ring_cardiovascular_age", label: "Cardio Age", unit: "yrs", group: "oura", getColor: cardioAgeColor },

  // Oura — Heart
  { entityId: "sensor.oura_ring_current_heart_rate", label: "Heart Rate", unit: "bpm", group: "oura", getColor: hrColor },
  { entityId: "sensor.oura_ring_lowest_sleep_heart_rate", label: "Lowest HR", unit: "bpm", group: "oura", getColor: hrColor },
  { entityId: "sensor.oura_ring_spo2_average", label: "SpO2", unit: "%", group: "oura", format: (s) => Number(s).toFixed(1), getColor: spo2Color },

  // Oura — Activity
  { entityId: "sensor.oura_ring_steps", label: "Steps", unit: "", group: "oura", format: (s) => Number(s).toLocaleString(), getColor: stepsColor },
  { entityId: "sensor.oura_ring_active_calories", label: "Active Cal", unit: "kcal", group: "oura", format: (s) => Number(s).toLocaleString(), getColor: neutral },
  { entityId: "sensor.oura_ring_activity_score", label: "Activity", unit: "", group: "oura", getColor: scoreColor },

  // Oura — Stress & Other
  { entityId: "sensor.oura_ring_temperature_deviation", label: "Temp Dev", unit: "°C", group: "oura", getColor: tempDevColor },
  { entityId: "sensor.oura_ring_stress_day_summary", label: "Stress", unit: "", group: "oura", getColor: stressColor },

  // Withings
  { entityId: "sensor.withings_weight", label: "Weight", unit: "kg", group: "withings", format: (s) => Number(s).toFixed(1), getColor: neutral },
  { entityId: "sensor.withings_muscle_mass", label: "Muscle Mass", unit: "kg", group: "withings", format: (s) => Number(s).toFixed(1), getColor: neutral },
  { entityId: "sensor.withings_fat_mass", label: "Fat Mass", unit: "kg", group: "withings", format: (s) => Number(s).toFixed(1), getColor: fatMassColor },
  { entityId: "sensor.withings_fat_ratio", label: "Body Fat", unit: "%", group: "withings", format: (s) => Number(s).toFixed(1), getColor: bodyFatColor },
  { entityId: "sensor.withings_bone_mass", label: "Bone Mass", unit: "kg", group: "withings", format: (s) => Number(s).toFixed(1), getColor: neutral },

  // Cold Plunge
  { entityId: "sensor.cold_plunge_temp_cold_plunge_water_temp", label: "Cold Plunge", unit: "°C", group: "other", format: (s) => Number(s).toFixed(1), getColor: coldPlungeColor },
];

export const ALL_SENSOR_IDS = SENSOR_CONFIG.map((s) => s.entityId);

export function getSensorMeta(entityId: string): SensorMeta | undefined {
  return SENSOR_CONFIG.find((s) => s.entityId === entityId);
}
