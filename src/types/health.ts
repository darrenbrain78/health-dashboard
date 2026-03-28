// --- Oura Data Types ---
export interface SleepData {
  date: string;
  totalSleepSeconds: number;
  deepSleepSeconds: number;
  remSleepSeconds: number;
  lightSleepSeconds: number;
  efficiency: number;
  score: number;
  hrvAvg: number;
  restingHR: number;
  breathRate: number;
  bedtimeStart: string;
  bedtimeEnd: string;
  latencySeconds: number;
  restlessPeriods: number;
  awakeTimeSeconds: number;
  lowestHR: number;
  contributors: {
    deep_sleep: number;
    efficiency: number;
    latency: number;
    rem_sleep: number;
    restfulness: number;
    timing: number;
    total_sleep: number;
  };
}

export interface ActivityData {
  date: string;
  steps: number;
  caloriesBurned: number;
  activeMinutes: number;
  sedentaryMinutes: number;
  score: number;
}

export interface ReadinessData {
  date: string;
  score: number;
  temperatureDeviation: number;
  contributors: {
    activity_balance: number | null;
    body_temperature: number | null;
    hrv_balance: number | null;
    previous_day_activity: number | null;
    previous_night: number | null;
    recovery_index: number | null;
    resting_heart_rate: number | null;
    sleep_balance: number | null;
    sleep_regularity: number | null;
  };
}

export interface HeartRateEntry {
  timestamp: string;
  bpm: number;
  source: "rest" | "sleep" | "workout" | "awake";
}

export interface DailyHeartRate {
  date: string;
  avgResting: number;
  min: number;
  max: number;
}

export interface SpO2Data {
  date: string;
  averageSpo2: number;
  breathingDisturbanceIndex: number;
}

export interface DailyTemperature {
  date: string;
  avgSkinTemp: number;
}

export interface VO2MaxEntry {
  date: string;
  vo2Max: number;
}

export interface WorkoutActivity {
  date: string;
  activity: string;
  durationMinutes: number;
  calories: number | null;
  distance: number | null;
  intensity: string;
  source: string;
}

export interface DailyStress {
  date: string;
  daySummary: string;
  recoveryHigh: number;
  stressHigh: number;
}

export interface Goal {
  title: string;
  emoji: string;
  current: number | string;
  target: string;
  achieved: boolean;
  unit: string;
}

export interface TimelineEvent {
  date: string;
  category: "medical-visit" | "lab-work" | "assessment" | "milestone";
  title: string;
  detail?: string;
}

export interface LabHistoryEntry {
  date: string;
  value: number | null;
}

// --- Garmin / Running ---
export interface RunActivity {
  date: string;
  distanceMiles?: number;
  durationSeconds?: number;
  pacePerMile?: string;
  heartRateAvg?: number;
  heartRateMax?: number;
  elevationGainFt?: number;
  cadence?: number;
  type?: "Run" | "Trail Run" | "Race";
  name?: string;
}

// --- Lab Results ---
export type LabStatus =
  | "optimal"
  | "good"
  | "borderline"
  | "elevated"
  | "critical";

export interface LabResult {
  date: string;
  category: string;
  marker: string;
  value: number;
  unit: string;
  referenceRange: string;
  status: LabStatus;
  history: LabHistoryEntry[];
}

// --- Patient Info ---
export interface PatientInfo {
  name: string;
  dob: string;
  heightCm: number;
  weightKg: number;
  bloodType: string;
  latestBp: string;
  spo2: number;
}

// --- Body Composition ---
export interface BodyComposition {
  date: string;
  weightKg: number;
  bodyFatPct: number;
  leanMassKg: number;
  boneMassKg: number;
  visceralFat: number;
  bmi: number;
}

// --- Supplements ---
export interface Supplement {
  name: string;
  dosage: string;
  frequency: string;
  reason: string;
}

// --- Conditions ---
export interface Condition {
  name: string;
  status: "active" | "resolved" | "managed";
  diagnosedDate?: string;
  notes?: string;
}

// --- Medications ---
export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  prescribedDate?: string;
}

// --- Immunizations ---
export interface Immunization {
  name: string;
  date: string;
  provider?: string;
}

// --- Aggregated Health Data ---
export interface HealthData {
  patientInfo: PatientInfo;
  sleepData: SleepData[];
  activityData: ActivityData[];
  readinessData: ReadinessData[];
  runActivities: RunActivity[];
  labResults: LabResult[];
  bodyComposition: BodyComposition[];
  supplements: Supplement[];
  conditions: Condition[];
  medications: Medication[];
  immunizations: Immunization[];
  dailyHeartRate: DailyHeartRate[];
  spo2Data: SpO2Data[];
  dailyTemperature: DailyTemperature[];
  vo2MaxEntries: VO2MaxEntry[];
  workoutActivities: WorkoutActivity[];
  goals: Goal[];
  timelineEvents: TimelineEvent[];
}
