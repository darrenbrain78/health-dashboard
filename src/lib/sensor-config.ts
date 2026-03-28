export interface SensorMeta {
  entityId: string;
  label: string;
  unit: string;
  color: string;
  group: "oura" | "withings" | "other";
  format?: (state: string) => string;
}

function formatDuration(seconds: string): string {
  const s = Number(seconds);
  if (isNaN(s)) return seconds;
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export const SENSOR_CONFIG: SensorMeta[] = [
  // Oura
  { entityId: "sensor.oura_ring_sleep_score", label: "Sleep Score", unit: "", color: "text-teal-400", group: "oura" },
  { entityId: "sensor.oura_ring_readiness_score", label: "Recovery", unit: "", color: "text-cyan-400", group: "oura" },
  { entityId: "sensor.oura_ring_hrv_balance_score", label: "HRV Balance", unit: "", color: "text-purple-400", group: "oura" },
  { entityId: "sensor.oura_ring_total_sleep_duration", label: "Total Sleep", unit: "", color: "text-indigo-400", group: "oura", format: formatDuration },
  { entityId: "sensor.oura_ring_deep_sleep_duration", label: "Deep Sleep", unit: "", color: "text-indigo-300", group: "oura", format: formatDuration },
  { entityId: "sensor.oura_ring_rem_sleep_duration", label: "REM Sleep", unit: "", color: "text-violet-400", group: "oura", format: formatDuration },
  { entityId: "sensor.oura_ring_cardiovascular_age", label: "Cardio Age", unit: "yrs", color: "text-red-400", group: "oura" },
  { entityId: "sensor.oura_ring_resilience_level", label: "Resilience", unit: "", color: "text-emerald-400", group: "oura" },
  { entityId: "sensor.oura_ring_steps", label: "Steps", unit: "", color: "text-emerald-500", group: "oura", format: (s) => Number(s).toLocaleString() },
  { entityId: "sensor.oura_ring_temperature_deviation", label: "Temp Dev", unit: "°C", color: "text-amber-400", group: "oura" },

  // Withings
  { entityId: "sensor.withings_weight_kg", label: "Weight", unit: "kg", color: "text-blue-400", group: "withings" },
  { entityId: "sensor.withings_muscle_mass", label: "Muscle Mass", unit: "kg", color: "text-emerald-400", group: "withings" },
  { entityId: "sensor.withings_fat_mass_kg", label: "Fat Mass", unit: "kg", color: "text-amber-400", group: "withings" },
  { entityId: "sensor.withings_fat_ratio", label: "Body Fat", unit: "%", color: "text-amber-500", group: "withings" },
  { entityId: "sensor.withings_bone_mass_kg", label: "Bone Mass", unit: "kg", color: "text-zinc-400", group: "withings" },
  { entityId: "sensor.withings_bmi", label: "BMI", unit: "", color: "text-cyan-400", group: "withings" },

  // Other
  { entityId: "sensor.cold_plunge_water_temp", label: "Cold Plunge", unit: "°C", color: "text-sky-400", group: "other" },
];

export const ALL_SENSOR_IDS = SENSOR_CONFIG.map((s) => s.entityId);

export function getSensorMeta(entityId: string): SensorMeta | undefined {
  return SENSOR_CONFIG.find((s) => s.entityId === entityId);
}
