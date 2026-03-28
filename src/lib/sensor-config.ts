export interface SensorMeta {
  entityId: string;
  label: string;
  unit: string;
  group: "oura" | "withings" | "other";
  format?: (state: string) => string;
  /** Returns a contextual Tailwind color class based on the value */
  getColor: (state: string) => string;
}

function formatDuration(seconds: string): string {
  const s = Number(seconds);
  if (isNaN(s)) return seconds;
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Thresholds: green = good, amber = borderline, red = needs attention
function scoreColor(s: string): string {
  const v = Number(s);
  if (v >= 85) return "text-emerald-400";
  if (v >= 70) return "text-amber-400";
  return "text-red-400";
}

function sleepDurationColor(s: string): string {
  const hrs = Number(s) / 3600;
  if (hrs >= 7) return "text-emerald-400";
  if (hrs >= 6) return "text-amber-400";
  return "text-red-400";
}

function deepSleepColor(s: string): string {
  const mins = Number(s) / 60;
  if (mins >= 60) return "text-emerald-400";   // 1h+ deep
  if (mins >= 40) return "text-amber-400";
  return "text-red-400";
}

function remSleepColor(s: string): string {
  const mins = Number(s) / 60;
  if (mins >= 90) return "text-emerald-400";   // 1.5h+ REM
  if (mins >= 60) return "text-amber-400";
  return "text-red-400";
}

function cardioAgeColor(s: string): string {
  const cardioAge = Number(s);
  const chronoAge = new Date().getFullYear() - 1978;
  if (cardioAge <= chronoAge - 2) return "text-emerald-400";  // 2+ years younger
  if (cardioAge <= chronoAge + 2) return "text-amber-400";    // within 2 years
  return "text-red-400";                                       // older
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
  if (v <= 0.5) return "text-emerald-400";    // normal range
  if (v <= 1.0) return "text-amber-400";
  return "text-red-400";                       // significant deviation
}

function bmiColor(s: string): string {
  const v = Number(s);
  if (v >= 18.5 && v < 25) return "text-emerald-400";
  if (v >= 25 && v < 30) return "text-amber-400";
  return "text-red-400";
}

function bodyFatColor(s: string): string {
  const v = Number(s);
  if (v < 18) return "text-emerald-400";      // athletic/fit for males
  if (v < 25) return "text-amber-400";
  return "text-red-400";
}

function fatMassColor(s: string): string {
  const v = Number(s);
  if (v < 15) return "text-emerald-400";
  if (v < 20) return "text-amber-400";
  return "text-red-400";
}

function coldPlungeColor(s: string): string {
  const v = Number(s);
  if (v <= 5) return "text-sky-400";           // ideal cold plunge
  if (v <= 10) return "text-cyan-400";
  return "text-amber-400";                     // too warm
}

// Neutral — no threshold makes sense (weight, muscle mass, bone mass)
const neutral = () => "text-foreground";

export const SENSOR_CONFIG: SensorMeta[] = [
  // Oura
  { entityId: "sensor.oura_ring_sleep_score", label: "Sleep Score", unit: "", group: "oura", getColor: scoreColor },
  { entityId: "sensor.oura_ring_readiness_score", label: "Recovery", unit: "", group: "oura", getColor: scoreColor },
  { entityId: "sensor.oura_ring_hrv_balance_score", label: "HRV Balance", unit: "", group: "oura", getColor: scoreColor },
  { entityId: "sensor.oura_ring_total_sleep_duration", label: "Total Sleep", unit: "", group: "oura", format: formatDuration, getColor: sleepDurationColor },
  { entityId: "sensor.oura_ring_deep_sleep_duration", label: "Deep Sleep", unit: "", group: "oura", format: formatDuration, getColor: deepSleepColor },
  { entityId: "sensor.oura_ring_rem_sleep_duration", label: "REM Sleep", unit: "", group: "oura", format: formatDuration, getColor: remSleepColor },
  { entityId: "sensor.oura_ring_cardiovascular_age", label: "Cardio Age", unit: "yrs", group: "oura", getColor: cardioAgeColor },
  { entityId: "sensor.oura_ring_resilience_level", label: "Resilience", unit: "", group: "oura", getColor: resilienceColor },
  { entityId: "sensor.oura_ring_steps", label: "Steps", unit: "", group: "oura", format: (s) => Number(s).toLocaleString(), getColor: stepsColor },
  { entityId: "sensor.oura_ring_temperature_deviation", label: "Temp Dev", unit: "°C", group: "oura", getColor: tempDevColor },

  // Withings
  { entityId: "sensor.withings_weight_kg", label: "Weight", unit: "kg", group: "withings", getColor: neutral },
  { entityId: "sensor.withings_muscle_mass", label: "Muscle Mass", unit: "kg", group: "withings", getColor: neutral },
  { entityId: "sensor.withings_fat_mass_kg", label: "Fat Mass", unit: "kg", group: "withings", getColor: fatMassColor },
  { entityId: "sensor.withings_fat_ratio", label: "Body Fat", unit: "%", group: "withings", getColor: bodyFatColor },
  { entityId: "sensor.withings_bone_mass_kg", label: "Bone Mass", unit: "kg", group: "withings", getColor: neutral },
  { entityId: "sensor.withings_bmi", label: "BMI", unit: "", group: "withings", getColor: bmiColor },

  // Other
  { entityId: "sensor.cold_plunge_water_temp", label: "Cold Plunge", unit: "°C", group: "other", getColor: coldPlungeColor },
];

export const ALL_SENSOR_IDS = SENSOR_CONFIG.map((s) => s.entityId);

export function getSensorMeta(entityId: string): SensorMeta | undefined {
  return SENSOR_CONFIG.find((s) => s.entityId === entityId);
}
