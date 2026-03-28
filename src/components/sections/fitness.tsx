"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionWrapper } from "@/components/section-wrapper";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CHART_AXIS_STYLE, CHART_GRID_STYLE, CHART_TOOLTIP_STYLE } from "@/lib/chart-config";
import type { RunActivity, WorkoutActivity } from "@/types/health";

interface FitnessSectionProps {
  data: RunActivity[];
  workouts: WorkoutActivity[];
}

const ACTIVITY_COLORS: Record<string, string> = {
  running: "#10b981",
  walking: "#6366f1",
  strengthTraining: "#f59e0b",
  yardwork: "#78716c",
  HIIT: "#ef4444",
  cycling: "#06b6d4",
  swimming: "#3b82f6",
  basketball: "#f97316",
  other: "#a855f7",
};

function getActivityColor(activity: string): string {
  return ACTIVITY_COLORS[activity] ?? ACTIVITY_COLORS.other;
}

function getActivityLabel(activity: string): string {
  const labels: Record<string, string> = {
    running: "Running",
    walking: "Walking",
    strengthTraining: "Strength",
    yardwork: "Yardwork",
    HIIT: "HIIT",
    cycling: "Cycling",
    swimming: "Swimming",
    basketball: "Basketball",
    golf: "Golf",
    hiking: "Hiking",
    other: "Other",
  };
  return labels[activity] ?? activity;
}

type ViewMode = "weekly" | "monthly";

function aggregateWorkouts(workouts: WorkoutActivity[], mode: ViewMode) {
  const buckets = new Map<string, Record<string, number>>();
  const allActivities = new Set<string>();

  for (const w of workouts) {
    const d = new Date(w.date);
    let key: string;
    if (mode === "weekly") {
      // ISO week: find Monday
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      key = monday.toISOString().slice(0, 10);
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }

    const activity = w.activity in ACTIVITY_COLORS ? w.activity : "other";
    allActivities.add(activity);

    const bucket = buckets.get(key) ?? {};
    bucket[activity] = (bucket[activity] ?? 0) + w.durationMinutes;
    bucket._calories = (bucket._calories ?? 0) + (w.calories ?? 0);
    bucket._count = (bucket._count ?? 0) + 1;
    buckets.set(key, bucket);
  }

  // Sort by date key, take last N
  const limit = mode === "weekly" ? 26 : 24;
  const sorted = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit);

  const chartData = sorted.map(([key, bucket]) => {
    const d = new Date(key + (mode === "weekly" ? "T00:00:00" : "-01T00:00:00"));
    const label =
      mode === "weekly"
        ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    return { label, ...bucket };
  });

  // Only show activities that appear meaningfully
  const activeTypes = Array.from(allActivities).filter((a) =>
    sorted.some(([, b]) => (b[a] ?? 0) > 0)
  );

  return { chartData, activeTypes };
}

export function FitnessSection({ data, workouts }: FitnessSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");

  // Run stats from RunActivity data
  const runsWithDistance = data.filter((r) => r.distanceMiles != null && r.distanceMiles > 0);
  const totalMiles = runsWithDistance.reduce((s, r) => s + (r.distanceMiles ?? 0), 0);

  // Workout stats
  const totalWorkouts = workouts.length;
  const totalMinutes = workouts.reduce((s, w) => s + w.durationMinutes, 0);
  const totalCalories = workouts.reduce((s, w) => s + (w.calories ?? 0), 0);

  // Activity type breakdown for summary cards
  const typeCounts = new Map<string, { count: number; minutes: number }>();
  for (const w of workouts) {
    const key = w.activity;
    const cur = typeCounts.get(key) ?? { count: 0, minutes: 0 };
    cur.count++;
    cur.minutes += w.durationMinutes;
    typeCounts.set(key, cur);
  }
  const topTypes = Array.from(typeCounts.entries())
    .sort((a, b) => b[1].minutes - a[1].minutes)
    .slice(0, 6);

  const { chartData, activeTypes } = aggregateWorkouts(workouts, viewMode);

  // Stack order: most common first
  const stackOrder = activeTypes.sort((a, b) => {
    const aMin = workouts.filter((w) => w.activity === a).reduce((s, w) => s + w.durationMinutes, 0);
    const bMin = workouts.filter((w) => w.activity === b).reduce((s, w) => s + w.durationMinutes, 0);
    return bMin - aMin;
  });

  return (
    <SectionWrapper id="running" title="Fitness">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Total Workouts</div>
          <div className="text-2xl font-bold text-primary tabular-nums">{totalWorkouts.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Total Duration</div>
          <div className="text-2xl font-bold text-emerald-500 tabular-nums">
            {Math.round(totalMinutes / 60).toLocaleString()}
            <span className="text-xs text-muted-foreground ml-1">hrs</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Total Calories</div>
          <div className="text-2xl font-bold text-amber-500 tabular-nums">
            {Math.round(totalCalories).toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Running Miles</div>
          <div className="text-2xl font-bold text-purple-500 tabular-nums">
            {totalMiles > 0 ? totalMiles.toFixed(1) : "—"}
          </div>
        </Card>
      </div>

      {/* Weekly/Monthly Bar Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Duration</CardTitle>
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
              {(["weekly", "monthly"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    viewMode === m
                      ? "bg-primary/20 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "weekly" ? "Weekly" : "Monthly"}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid {...CHART_GRID_STYLE} />
                <XAxis
                  dataKey="label"
                  tick={CHART_AXIS_STYLE}
                  interval={viewMode === "weekly" ? 3 : 2}
                />
                <YAxis
                  tick={CHART_AXIS_STYLE}
                  label={{
                    value: "min",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "hsl(var(--muted-foreground))", fontSize: 10 },
                  }}
                />
                <Tooltip
                  {...CHART_TOOLTIP_STYLE}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: any, name: any) => [
                    `${Math.round(Number(value))} min`,
                    getActivityLabel(String(name)),
                  ]) as any}
                />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground">
                      {getActivityLabel(value)}
                    </span>
                  )}
                />
                {stackOrder.map((activity) => (
                  <Bar
                    key={activity}
                    dataKey={activity}
                    stackId="duration"
                    fill={getActivityColor(activity)}
                    radius={activity === stackOrder[0] ? [3, 3, 0, 0] : undefined}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Activity Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {topTypes.map(([activity, stats]) => (
              <div
                key={activity}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: getActivityColor(activity) }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {getActivityLabel(activity)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {stats.count} sessions · {Math.round(stats.minutes / 60)}h
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Run Log */}
      {runsWithDistance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Run Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 15)
                .map((run, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{run.name ?? run.type ?? "Run"}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(run.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold tabular-nums">
                        {run.distanceMiles != null ? `${run.distanceMiles.toFixed(1)} mi` : "—"}
                      </div>
                      {run.pacePerMile && <div className="text-[10px] text-muted-foreground">{run.pacePerMile}/mi</div>}
                    </div>
                    <div className="text-right">
                      {run.heartRateAvg != null && <div className="text-sm text-red-400 tabular-nums">{run.heartRateAvg} bpm</div>}
                      {run.elevationGainFt != null && <div className="text-[10px] text-muted-foreground">{run.elevationGainFt} ft</div>}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </SectionWrapper>
  );
}
