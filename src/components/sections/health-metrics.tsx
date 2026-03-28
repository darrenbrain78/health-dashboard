"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionWrapper } from "@/components/section-wrapper";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  CHART_COLORS,
  CHART_AXIS_STYLE,
  CHART_GRID_STYLE,
  CHART_TOOLTIP_STYLE,
} from "@/lib/chart-config";
import type { HealthData } from "@/types/health";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HealthMetricsSectionProps {
  data: HealthData;
}

interface MonthlyPoint {
  month: string;
  label: string;
  value: number;
}

// ---------------------------------------------------------------------------
// Monthly aggregation helpers
// ---------------------------------------------------------------------------

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function monthLabel(ym: string): string {
  const [year, month] = ym.split("-");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const shortYear = year.slice(2);
  const monthIdx = parseInt(month, 10) - 1;
  return `${monthNames[monthIdx]} ${shortYear}`;
}

function monthlyAverage(
  items: { date: string; value: number }[]
): MonthlyPoint[] {
  const groups = new Map<string, number[]>();
  for (const item of items) {
    if (item.value === 0 || item.value == null) continue;
    const mk = monthKey(item.date);
    const arr = groups.get(mk);
    if (arr) arr.push(item.value);
    else groups.set(mk, [item.value]);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, vals]) => ({
      month: m,
      label: monthLabel(m),
      value: +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1),
    }));
}

function pctChange(data: MonthlyPoint[]): string | null {
  if (data.length < 2) return null;
  const first = data[0].value;
  const last = data[data.length - 1].value;
  if (first === 0) return null;
  const pct = ((last - first) / Math.abs(first)) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}

function latestValue(data: MonthlyPoint[]): number | null {
  if (data.length === 0) return null;
  return data[data.length - 1].value;
}

function daysSinceLastEntry(dates: string[]): string {
  if (dates.length === 0) return "N/A";
  const sorted = [...dates].sort();
  const last = new Date(sorted[sorted.length - 1]);
  const now = new Date();
  const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "1d ago";
  return `${diff}d ago`;
}

// ---------------------------------------------------------------------------
// Metric chart card
// ---------------------------------------------------------------------------

function MetricChartCard({
  title,
  subtitle,
  latestVal,
  unit,
  change,
  children,
}: {
  title: string;
  subtitle?: string;
  latestVal: number | null;
  unit: string;
  change?: string | null;
  children: React.ReactNode;
}) {
  const isPositive = change?.startsWith("+");
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            {subtitle && (
              <p className="text-[10px] text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="text-right">
            {latestVal !== null && (
              <span className="text-lg font-bold text-foreground">
                {Number.isInteger(latestVal)
                  ? latestVal.toLocaleString()
                  : latestVal.toFixed(1)}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  {unit}
                </span>
              </span>
            )}
            {change && (
              <div
                className={`text-xs font-medium ${
                  isPositive ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {change}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">{children}</div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Format x-axis: show label every ~6 months to avoid crowding
// ---------------------------------------------------------------------------

function formatMonthTick(allMonths: string[]) {
  const interval = Math.max(1, Math.floor(allMonths.length / 10));
  const visibleSet = new Set(
    allMonths.filter((_, i) => i % interval === 0)
  );
  return (label: string) => (visibleSet.has(label) ? label : "");
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function HealthMetricsSection({ data }: HealthMetricsSectionProps) {
  const {
    activityData,
    vo2MaxEntries,
    bodyComposition,
    sleepData,
    workoutActivities,
  } = data;

  // Compute "synced X ago" from the most recent date across all sources
  const syncLabel = useMemo(() => {
    const allDates = [
      ...activityData.map((d) => d.date),
      ...sleepData.map((d) => d.date),
      ...workoutActivities.map((d) => d.date),
    ];
    return daysSinceLastEntry(allDates);
  }, [activityData, sleepData, workoutActivities]);

  // --- Monthly datasets ---
  const mSteps = useMemo(
    () =>
      monthlyAverage(
        activityData.map((d) => ({ date: d.date, value: d.steps }))
      ),
    [activityData]
  );

  const mVO2 = useMemo(
    () =>
      monthlyAverage(
        vo2MaxEntries.map((d) => ({ date: d.date, value: d.vo2Max }))
      ),
    [vo2MaxEntries]
  );

  const mWeight = useMemo(
    () =>
      monthlyAverage(
        bodyComposition.map((d) => ({ date: d.date, value: d.weightKg }))
      ),
    [bodyComposition]
  );

  const mRestingHR = useMemo(
    () =>
      monthlyAverage(
        sleepData.map((d) => ({ date: d.date, value: d.restingHR }))
      ),
    [sleepData]
  );

  const mHRV = useMemo(
    () =>
      monthlyAverage(
        sleepData.map((d) => ({ date: d.date, value: d.hrvAvg }))
      ),
    [sleepData]
  );

  const mExercise = useMemo(
    () =>
      monthlyAverage(
        activityData.map((d) => ({ date: d.date, value: d.activeMinutes }))
      ),
    [activityData]
  );

  // Tick formatters
  const stepsTick = useMemo(() => formatMonthTick(mSteps.map((d) => d.label)), [mSteps]);
  const vo2Tick = useMemo(() => formatMonthTick(mVO2.map((d) => d.label)), [mVO2]);
  const weightTick = useMemo(() => formatMonthTick(mWeight.map((d) => d.label)), [mWeight]);
  const hrTick = useMemo(() => formatMonthTick(mRestingHR.map((d) => d.label)), [mRestingHR]);
  const hrvTick = useMemo(() => formatMonthTick(mHRV.map((d) => d.label)), [mHRV]);
  const exerciseTick = useMemo(() => formatMonthTick(mExercise.map((d) => d.label)), [mExercise]);

  return (
    <SectionWrapper id="health-metrics" title="Health Metrics">
      {/* Info bar */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
          5 Years
        </span>
        <span>·</span>
        <span>Trendline</span>
        <span>·</span>
        <span>synced {syncLabel}</span>
      </div>

      {/* 3x2 responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* 1. Daily Steps */}
        <MetricChartCard
          title="Daily Steps"
          subtitle="Monthly Average"
          latestVal={latestValue(mSteps)}
          unit="steps"
          change={pctChange(mSteps)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mSteps}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="label" tickFormatter={stepsTick} tick={CHART_AXIS_STYLE} />
              <YAxis tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Bar
                dataKey="value"
                name="Steps"
                fill={CHART_COLORS.purple}
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </MetricChartCard>

        {/* 2. VO2 Max */}
        <MetricChartCard
          title="VO2 Max"
          subtitle="Monthly Average"
          latestVal={latestValue(mVO2)}
          unit="mL/min·kg"
          change={pctChange(mVO2)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mVO2}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="label" tickFormatter={vo2Tick} tick={CHART_AXIS_STYLE} />
              <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="value"
                name="VO2 Max"
                stroke={CHART_COLORS.success}
                strokeWidth={2}
                dot={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </MetricChartCard>

        {/* 3. Weight */}
        <MetricChartCard
          title="Weight"
          subtitle="Monthly Average"
          latestVal={latestValue(mWeight)}
          unit="kg"
          change={pctChange(mWeight)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mWeight}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="label" tickFormatter={weightTick} tick={CHART_AXIS_STYLE} />
              <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="value"
                name="Weight"
                stroke={CHART_COLORS.cyan}
                strokeWidth={2}
                dot={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </MetricChartCard>

        {/* 4. Resting Heart Rate */}
        <MetricChartCard
          title="Resting Heart Rate"
          subtitle="Monthly Average"
          latestVal={latestValue(mRestingHR)}
          unit="bpm"
          change={pctChange(mRestingHR)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mRestingHR}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="label" tickFormatter={hrTick} tick={CHART_AXIS_STYLE} />
              <YAxis domain={["dataMin - 3", "dataMax + 3"]} tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <ReferenceLine
                y={55}
                stroke={CHART_COLORS.success}
                strokeDasharray="6 3"
                label={{
                  value: "55 bpm goal",
                  position: "right",
                  fill: CHART_COLORS.success,
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Resting HR"
                stroke={CHART_COLORS.warning}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </MetricChartCard>

        {/* 5. HRV */}
        <MetricChartCard
          title="HRV"
          subtitle="Monthly Average"
          latestVal={latestValue(mHRV)}
          unit="ms"
          change={pctChange(mHRV)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mHRV}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="label" tickFormatter={hrvTick} tick={CHART_AXIS_STYLE} />
              <YAxis tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="value"
                name="HRV"
                stroke={CHART_COLORS.hrv}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </MetricChartCard>

        {/* 6. Exercise Minutes */}
        <MetricChartCard
          title="Exercise Minutes"
          subtitle="Monthly Average"
          latestVal={latestValue(mExercise)}
          unit="min"
          change={pctChange(mExercise)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mExercise}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="label" tickFormatter={exerciseTick} tick={CHART_AXIS_STYLE} />
              <YAxis tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Bar
                dataKey="value"
                name="Exercise"
                fill={CHART_COLORS.accent}
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </MetricChartCard>
      </div>
    </SectionWrapper>
  );
}
