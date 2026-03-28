/**
 * process-data.ts
 *
 * Reads Oura Ring CSV exports and blood-test markdown, then writes a
 * processed TypeScript data file that the Next.js app can import.
 *
 * Usage:  npx tsx scripts/process-data.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(
  process.env.HOME!,
  ".openclaw/workspace/fitness/data/App Data",
);
const BLOOD_MD = path.join(
  process.env.HOME!,
  ".openclaw/workspace/memory/topics/health-blood-tests.md",
);
const OUTPUT_FILE = path.resolve(
  __dirname,
  "../src/data/processed-data.ts",
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a semicolon-delimited CSV file into an array of objects. */
function parseCSV(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];
  const headers = lines[0].split(";");
  return lines.slice(1).map((line) => {
    const vals = splitCSVLine(line, ";");
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (vals[i] ?? "").trim();
    });
    return obj;
  });
}

/**
 * Split a CSV line respecting JSON braces so that semicolons inside
 * JSON objects are not treated as delimiters.
 */
function splitCSVLine(line: string, delim: string): string[] {
  const parts: string[] = [];
  let current = "";
  let braceDepth = 0;
  let bracketDepth = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "{") braceDepth++;
    else if (ch === "}") braceDepth--;
    else if (ch === "[") bracketDepth++;
    else if (ch === "]") bracketDepth--;

    if (ch === delim && braceDepth === 0 && bracketDepth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts;
}

/** Safe JSON parse */
function safeJSON(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** Safe number parse — returns 0 when input is empty / NaN. */
function num(s: string | undefined): number {
  if (!s || s.trim() === "") return 0;
  const n = Number(s);
  return Number.isNaN(n) ? 0 : n;
}

/** Safe nullable number parse. */
function numOrNull(s: string | undefined): number | null {
  if (!s || s.trim() === "") return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

/**
 * Stream a large CSV file line-by-line, calling `onRow` for every data row.
 */
async function streamCSV(
  filePath: string,
  onRow: (row: Record<string, string>) => void,
  label: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: "utf-8" }),
      crlfDelay: Infinity,
    });

    let headers: string[] | null = null;
    let count = 0;

    rl.on("line", (line: string) => {
      if (!headers) {
        headers = line.split(";").map((h) => h.trim());
        return;
      }
      count++;
      if (count % 250_000 === 0) {
        console.log(`  [${label}] processed ${(count / 1000).toFixed(0)}k rows...`);
      }
      const vals = line.split(";");
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = (vals[i] ?? "").trim();
      });
      onRow(obj);
    });

    rl.on("close", () => {
      console.log(`  [${label}] done — ${count.toLocaleString()} rows`);
      resolve();
    });
    rl.on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// 1. Sleep Data  (sleepmodel.csv merged with dailysleep.csv)
// ---------------------------------------------------------------------------
function processSleep() {
  console.log("Processing sleep data...");
  const sleepModel = parseCSV(path.join(DATA_DIR, "sleepmodel.csv"));
  const dailySleep = parseCSV(path.join(DATA_DIR, "dailysleep.csv"));

  // Build score + contributors lookup from dailysleep
  const sleepScoreMap = new Map<
    string,
    { score: number; contributors: any }
  >();
  for (const row of dailySleep) {
    const day = row.day;
    sleepScoreMap.set(day, {
      score: num(row.score),
      contributors: safeJSON(row.contributors) ?? {},
    });
  }

  // Filter long_sleep only
  const longSleep = sleepModel.filter((r) => r.type === "long_sleep");
  console.log(`  long_sleep rows: ${longSleep.length}`);

  const results = longSleep.map((r) => {
    const day = r.day;
    const daily = sleepScoreMap.get(day);

    // Restless periods: count chars that are '3' or '4' in movement_30_sec
    const movement = r.movement_30_sec ?? "";
    let restlessPeriods = 0;
    for (const ch of movement) {
      if (ch === "3" || ch === "4") restlessPeriods++;
    }

    const totalSleep = num(r.total_sleep_duration);
    const deep = num(r.deep_sleep_duration);
    const rem = num(r.rem_sleep_duration);
    const awake = num(r.awake_time);
    const light = totalSleep - deep - rem;

    return {
      date: day,
      totalSleepSeconds: totalSleep,
      deepSleepSeconds: deep,
      remSleepSeconds: rem,
      lightSleepSeconds: light > 0 ? light : 0,
      efficiency: num(r.efficiency),
      score: daily?.score ?? 0,
      hrvAvg: num(r.average_hrv),
      restingHR: num(r.lowest_heart_rate),
      breathRate: num(r.average_breath),
      bedtimeStart: r.bedtime_start,
      bedtimeEnd: r.bedtime_end,
      latencySeconds: num(r.latency),
      restlessPeriods,
      awakeTimeSeconds: awake,
      lowestHR: num(r.lowest_heart_rate),
      contributors: daily?.contributors ?? {
        deep_sleep: 0,
        efficiency: 0,
        latency: 0,
        rem_sleep: 0,
        restfulness: 0,
        timing: 0,
        total_sleep: 0,
      },
    };
  });

  results.sort((a, b) => a.date.localeCompare(b.date));
  console.log(`  sleep entries: ${results.length}`);
  return results;
}

// ---------------------------------------------------------------------------
// 2. Activity Data  (dailyactivity.csv)
// ---------------------------------------------------------------------------
function processActivity() {
  console.log("Processing activity data...");
  const rows = parseCSV(path.join(DATA_DIR, "dailyactivity.csv"));

  const results = rows.map((r) => ({
    date: r.day,
    steps: num(r.steps),
    caloriesBurned: num(r.active_calories),
    activeMinutes: Math.round(
      (num(r.high_activity_time) + num(r.medium_activity_time)) / 60,
    ),
    sedentaryMinutes: Math.round(num(r.sedentary_time) / 60),
    score: num(r.score),
    totalCalories: num(r.total_calories),
  }));

  results.sort((a, b) => a.date.localeCompare(b.date));
  console.log(`  activity entries: ${results.length}`);
  return results;
}

// ---------------------------------------------------------------------------
// 3. Readiness Data  (dailyreadiness.csv)
// ---------------------------------------------------------------------------
function processReadiness() {
  console.log("Processing readiness data...");
  const rows = parseCSV(path.join(DATA_DIR, "dailyreadiness.csv"));

  const results = rows.map((r) => {
    const contribs = safeJSON(r.contributors) ?? {};
    return {
      date: r.day,
      score: num(r.score),
      temperatureDeviation: num(r.temperature_deviation),
      contributors: {
        activity_balance: contribs.activity_balance ?? null,
        body_temperature: contribs.body_temperature ?? null,
        hrv_balance: contribs.hrv_balance ?? null,
        previous_day_activity: contribs.previous_day_activity ?? null,
        previous_night: contribs.previous_night ?? null,
        recovery_index: contribs.recovery_index ?? null,
        resting_heart_rate: contribs.resting_heart_rate ?? null,
        sleep_balance: contribs.sleep_balance ?? null,
        sleep_regularity: contribs.sleep_regularity ?? null,
      },
    };
  });

  results.sort((a, b) => a.date.localeCompare(b.date));
  console.log(`  readiness entries: ${results.length}`);
  return results;
}

// ---------------------------------------------------------------------------
// 4. Heart Rate (STREAMED — 1.1M rows)
// ---------------------------------------------------------------------------
async function processHeartRate() {
  console.log("Processing heart rate data (streaming)...");

  // Accumulate per-day stats
  const dayMap = new Map<
    string,
    {
      restSum: number;
      restCount: number;
      min: number;
      max: number;
    }
  >();

  await streamCSV(
    path.join(DATA_DIR, "heartrate.csv"),
    (row) => {
      const ts = row.timestamp;
      if (!ts) return;
      const date = ts.slice(0, 10); // YYYY-MM-DD
      const bpm = Number(row.bpm);
      if (Number.isNaN(bpm) || bpm <= 0) return;
      const source = row.source;

      let entry = dayMap.get(date);
      if (!entry) {
        entry = { restSum: 0, restCount: 0, min: Infinity, max: -Infinity };
        dayMap.set(date, entry);
      }

      if (bpm < entry.min) entry.min = bpm;
      if (bpm > entry.max) entry.max = bpm;

      if (source === "rest" || source === "sleep") {
        entry.restSum += bpm;
        entry.restCount++;
      }
    },
    "heartrate",
  );

  const results: { date: string; avgResting: number; min: number; max: number }[] = [];
  for (const [date, d] of dayMap) {
    results.push({
      date,
      avgResting: d.restCount > 0 ? Math.round(d.restSum / d.restCount) : 0,
      min: d.min === Infinity ? 0 : d.min,
      max: d.max === -Infinity ? 0 : d.max,
    });
  }
  results.sort((a, b) => a.date.localeCompare(b.date));
  console.log(`  daily heart rate entries: ${results.length}`);
  return results;
}

// ---------------------------------------------------------------------------
// 5. Workouts  (workout.csv)
// ---------------------------------------------------------------------------
function processWorkouts() {
  console.log("Processing workouts...");
  const rows = parseCSV(path.join(DATA_DIR, "workout.csv"));

  const results = rows.map((r) => {
    let durationMinutes = 0;
    if (r.start_datetime && r.end_datetime) {
      const start = new Date(r.start_datetime).getTime();
      const end = new Date(r.end_datetime).getTime();
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        durationMinutes = Math.round((end - start) / 60000);
      }
    }
    return {
      date: r.day,
      activity: r.activity ?? "unknown",
      durationMinutes,
      calories: numOrNull(r.calories),
      distance: numOrNull(r.distance),
      intensity: r.intensity ?? "",
      source: r.source ?? "",
    };
  });

  results.sort((a, b) => a.date.localeCompare(b.date));
  console.log(`  workout entries: ${results.length}`);
  return results;
}

// ---------------------------------------------------------------------------
// 6. SpO2  (dailyspo2.csv)
// ---------------------------------------------------------------------------
function processSpO2() {
  console.log("Processing SpO2 data...");
  const rows = parseCSV(path.join(DATA_DIR, "dailyspo2.csv"));

  const results = rows.map((r) => {
    const pct = safeJSON(r.spo2_percentage);
    return {
      date: r.day,
      averageSpo2: pct?.average ?? 0,
      breathingDisturbanceIndex: num(r.breathing_disturbance_index),
    };
  });

  results.sort((a, b) => a.date.localeCompare(b.date));
  console.log(`  spo2 entries: ${results.length}`);
  return results;
}

// ---------------------------------------------------------------------------
// 7. Temperature (STREAMED — 1.7M rows)
// ---------------------------------------------------------------------------
async function processTemperature() {
  console.log("Processing temperature data (streaming)...");

  const dayMap = new Map<string, { sum: number; count: number }>();

  await streamCSV(
    path.join(DATA_DIR, "temperature.csv"),
    (row) => {
      const ts = row.timestamp;
      if (!ts) return;
      const date = ts.slice(0, 10);
      const temp = Number(row.skin_temp);
      if (Number.isNaN(temp)) return;

      let entry = dayMap.get(date);
      if (!entry) {
        entry = { sum: 0, count: 0 };
        dayMap.set(date, entry);
      }
      entry.sum += temp;
      entry.count++;
    },
    "temperature",
  );

  const results: { date: string; avgSkinTemp: number }[] = [];
  for (const [date, d] of dayMap) {
    results.push({
      date,
      avgSkinTemp: Math.round((d.sum / d.count) * 100) / 100,
    });
  }
  results.sort((a, b) => a.date.localeCompare(b.date));
  console.log(`  daily temperature entries: ${results.length}`);
  return results;
}

// ---------------------------------------------------------------------------
// 8. VO2 Max  (vo2max.csv)
// ---------------------------------------------------------------------------
function processVO2Max() {
  console.log("Processing VO2 Max...");
  const rows = parseCSV(path.join(DATA_DIR, "vo2max.csv"));
  const results = rows.map((r) => ({
    date: r.day,
    vo2Max: num(r.vo2_max),
  }));
  results.sort((a, b) => a.date.localeCompare(b.date));
  console.log(`  vo2max entries: ${results.length}`);
  return results;
}

// ---------------------------------------------------------------------------
// 9. Blood Tests  (parse markdown)
// ---------------------------------------------------------------------------
type LabStatus = "optimal" | "good" | "borderline" | "elevated" | "critical";

interface LabResult {
  date: string;
  category: string;
  marker: string;
  value: number;
  unit: string;
  referenceRange: string;
  status: LabStatus;
  history: { date: string; value: number | null }[];
}

function mapStatus(rawStatus: string): LabStatus {
  const s = rawStatus.toLowerCase();
  if (s.includes("excellent") || s.includes("fantastic")) return "optimal";
  if (s.includes("high") || s.includes("🔴")) return "elevated";
  if (
    s.includes("slightly") ||
    s.includes("borderline") ||
    s.includes("below range") ||
    s.includes("upper end") ||
    s.includes("⚠️") ||
    s.includes("low")
  ) return "borderline";
  if (s.includes("normal") || s.includes("non-diabetic") || s.includes("in range") || s.includes("good")) return "good";
  return "good";
}

function parseBloodValue(raw: string): { value: number; unit: string } {
  // Examples: "168 g/L", "0.509 L/L", "43%", "4.15", "69.75%"
  const trimmed = raw.trim();
  // Try to extract leading number
  const match = trimmed.match(/^([\d.]+)\s*(.*)/);
  if (match) {
    return { value: Number(match[1]), unit: match[2].trim() };
  }
  return { value: 0, unit: "" };
}

function processBloodTests(): LabResult[] {
  console.log("Processing blood test data...");
  const md = fs.readFileSync(BLOOD_MD, "utf-8");

  // We need to parse tables under specific test headings
  const tests: { date: string; startMarker: string; endMarker: string }[] = [
    {
      date: "2026-03-21",
      startMarker: "## Test 1: Advanced Well Man Blood Test — 21 Mar 2026",
      endMarker: "## Test 2:",
    },
    {
      date: "2019-11-11",
      startMarker: "## Test 2: Well Man UltraVit Blood Test — 11 Nov 2019",
      endMarker: "## Trend Analysis",
    },
  ];

  // Collect all results, keyed by marker+category for history building
  const allResults: LabResult[] = [];
  const markerHistory = new Map<string, { date: string; value: number }[]>();

  for (const test of tests) {
    const startIdx = md.indexOf(test.startMarker);
    const endIdx = md.indexOf(test.endMarker);
    if (startIdx === -1) {
      console.warn(`  Could not find section: ${test.startMarker}`);
      continue;
    }
    const section = md.slice(startIdx, endIdx === -1 ? undefined : endIdx);

    // Find category headings (### Category) and tables
    const lines = section.split("\n");
    let currentCategory = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Category heading
      if (line.startsWith("### ") && !line.includes("NOT tested")) {
        currentCategory = line.replace("### ", "").trim();
        continue;
      }

      // Table row — starts with |, not header separator, not the header row
      if (
        line.startsWith("|") &&
        !line.startsWith("|---") &&
        !line.startsWith("| Marker") &&
        !line.startsWith("| System")
      ) {
        const cells = line
          .split("|")
          .map((c) => c.trim())
          .filter((c) => c !== "");
        if (cells.length >= 4) {
          const marker = cells[0];
          const rawValue = cells[1];
          const range = cells[2];
          const rawStatus = cells[3];

          const { value, unit } = parseBloodValue(rawValue);

          const key = `${currentCategory}::${marker}`;
          if (!markerHistory.has(key)) markerHistory.set(key, []);
          markerHistory.get(key)!.push({ date: test.date, value });

          allResults.push({
            date: test.date,
            category: currentCategory,
            marker,
            value,
            unit,
            referenceRange: range,
            status: mapStatus(rawStatus),
            history: [], // filled in after
          });
        }
      }
    }
  }

  // Build history arrays
  for (const r of allResults) {
    const key = `${r.category}::${r.marker}`;
    const hist = markerHistory.get(key) ?? [];
    r.history = hist
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((h) => ({ date: h.date, value: h.value }));
  }

  // Sort by date then category
  allResults.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return a.category.localeCompare(b.category);
  });

  console.log(`  lab results: ${allResults.length}`);
  return allResults;
}

// ---------------------------------------------------------------------------
// 10–15. Hardcoded data
// ---------------------------------------------------------------------------

const patientInfo = {
  name: "Darren Brain",
  dob: "1978-01-01",
  heightCm: 176.5,
  weightKg: 86.1,
  bloodType: "O+",
  latestBp: "120/78",
  spo2: 98,
};

const bodyComposition = [
  { date: "2021-04-09", weightKg: 86.5, bodyFatPct: 23.9, leanMassKg: 65.8, boneMassKg: 3.1, visceralFat: 0, bmi: 27.8 },
  { date: "2024-08-01", weightKg: 85.0, bodyFatPct: 22.9, leanMassKg: 65.5, boneMassKg: 3.1, visceralFat: 0, bmi: 27.3 },
  { date: "2026-03-21", weightKg: 86.1, bodyFatPct: 17.2, leanMassKg: 68.1, boneMassKg: 3.14, visceralFat: 0, bmi: 27.6 },
];

const supplements = [
  { name: "Vitamin D3", dosage: "1000 IU", frequency: "daily", reason: "Low-normal levels on blood tests" },
  { name: "Omega-3 Fish Oil", dosage: "1000 mg", frequency: "daily", reason: "HDL support and inflammation reduction" },
  { name: "Magnesium Glycinate", dosage: "400 mg", frequency: "daily", reason: "Sleep quality and muscle recovery" },
  { name: "Creatine", dosage: "5 g", frequency: "daily", reason: "Muscle performance and cognitive support" },
  { name: "Whey Protein", dosage: "25 g", frequency: "daily", reason: "Post-workout protein synthesis" },
];

const conditions = [
  { name: "Family history T1 Diabetes + Lupus (Mother)", status: "managed" as const, notes: "Monitor HbA1c annually" },
  { name: "Haematuria", status: "resolved" as const, diagnosedDate: "2022-07-19", notes: "Likely exercise-induced, cleared by 2024" },
];

const medications: any[] = [];

const immunizations = [
  { name: "COVID-19 Vaccine (Dose 1)", date: "2021-03-01", provider: "NHS" },
  { name: "COVID-19 Vaccine (Dose 2)", date: "2021-06-01", provider: "NHS" },
  { name: "COVID-19 Vaccine (Booster)", date: "2022-01-01", provider: "NHS" },
];

const goals = [
  { title: "Body Fat", emoji: "🔥", current: 17.2, target: "<18%", achieved: true, unit: "%" },
  { title: "VO2 Max", emoji: "🫁", current: 46, target: ">49", achieved: false, unit: "ml/kg/min" },
  { title: "HDL Cholesterol", emoji: "🩸", current: 1.05, target: ">1.2", achieved: false, unit: "mmol/L" },
  { title: "Sleep Duration", emoji: "😴", current: "7h", target: ">7h", achieved: false, unit: "hours" },
  { title: "Daily Steps", emoji: "🚶", current: "10k", target: ">10k", achieved: false, unit: "steps" },
  { title: "Weight", emoji: "⚖️", current: 86.1, target: "78.5", achieved: false, unit: "kg" },
];

const timelineEvents = [
  { date: "2019-11-11", category: "lab-work" as const, title: "Medichecks Well Man UltraVit", detail: "Baseline blood test — flagged high iron/transferrin, low HDL" },
  { date: "2021-04-09", category: "assessment" as const, title: "Nuffield 360(M) Health Assessment", detail: "BMI 27.8, body fat 23.9%, urine retest requested" },
  { date: "2022-07-19", category: "assessment" as const, title: "Nuffield Pro 3 Health Assessment", detail: "Microscopic haematuria found, referred to GP" },
  { date: "2024-08-01", category: "assessment" as const, title: "Nuffield Pro 3 Health Assessment", detail: "Cholesterol excellent, body fat 22.9%, haematuria resolved" },
  { date: "2026-03-21", category: "lab-work" as const, title: "Medichecks Advanced Well Man", detail: "Overall excellent — iron normalised, HDL improved, CRP down" },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("=== Health Data Processing ===\n");

  const sleepData = processSleep();
  const activityData = processActivity();
  const readinessData = processReadiness();
  const dailyHeartRate = await processHeartRate();
  const workoutActivities = processWorkouts();
  const spo2Data = processSpO2();
  const dailyTemperature = await processTemperature();
  const vo2MaxEntries = processVO2Max();
  const labResults = processBloodTests();

  const healthData = {
    patientInfo,
    sleepData,
    activityData,
    readinessData,
    runActivities: [] as any[],
    labResults,
    bodyComposition,
    supplements,
    conditions,
    medications,
    immunizations,
    dailyHeartRate,
    spo2Data,
    dailyTemperature,
    vo2MaxEntries,
    workoutActivities,
    goals,
    timelineEvents,
  };

  // ---------------------------------------------------------------------------
  // Write output
  // ---------------------------------------------------------------------------
  console.log("\nWriting output...");

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const json = JSON.stringify(healthData, null, 2);

  // Write the raw JSON data file
  const jsonPath = path.join(outDir, "health-data.json");
  fs.writeFileSync(jsonPath, json, "utf-8");

  // Write a thin TypeScript wrapper that imports the JSON
  const output = `import type { HealthData } from "@/types/health";
import data from "./health-data.json";

export const healthData: HealthData = data as unknown as HealthData;
`;

  fs.writeFileSync(OUTPUT_FILE, output, "utf-8");

  const sizeMB = (Buffer.byteLength(output) / 1024 / 1024).toFixed(1);
  console.log(`\nDone! Output: ${OUTPUT_FILE} (${sizeMB} MB)`);
  console.log(`  Sleep: ${sleepData.length}`);
  console.log(`  Activity: ${activityData.length}`);
  console.log(`  Readiness: ${readinessData.length}`);
  console.log(`  Heart Rate (daily): ${dailyHeartRate.length}`);
  console.log(`  Workouts: ${workoutActivities.length}`);
  console.log(`  SpO2: ${spo2Data.length}`);
  console.log(`  Temperature (daily): ${dailyTemperature.length}`);
  console.log(`  VO2 Max: ${vo2MaxEntries.length}`);
  console.log(`  Lab Results: ${labResults.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
