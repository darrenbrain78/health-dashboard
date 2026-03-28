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
  AreaChart,
  Area,
  ComposedChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

interface SleepSectionProps {
  data: HealthData;
}

interface WeeklyPoint {
  week: string;
  value: number;
}

interface WeeklyStages {
  week: string;
  deep: number;
  rem: number;
  light: number;
}

// ---------------------------------------------------------------------------
// Weekly aggregation helpers
// ---------------------------------------------------------------------------

function isoWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const dayOfWeek = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function weeklyAverage(
  items: { date: string; value: number }[]
): WeeklyPoint[] {
  const groups = new Map<string, number[]>();
  for (const item of items) {
    const wk = isoWeekKey(item.date);
    const arr = groups.get(wk);
    if (arr) arr.push(item.value);
    else groups.set(wk, [item.value]);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, vals]) => ({
      week,
      value: +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1),
    }));
}

function weeklyStagesPercent(
  items: {
    date: string;
    deep: number;
    rem: number;
    light: number;
    total: number;
  }[]
): WeeklyStages[] {
  const groups = new Map<
    string,
    { deep: number[]; rem: number[]; light: number[]; total: number[] }
  >();
  for (const d of items) {
    const wk = isoWeekKey(d.date);
    let g = groups.get(wk);
    if (!g) {
      g = { deep: [], rem: [], light: [], total: [] };
      groups.set(wk, g);
    }
    g.deep.push(d.deep);
    g.rem.push(d.rem);
    g.light.push(d.light);
    g.total.push(d.total);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, g]) => {
      const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
      const t = avg(g.total) || 1;
      return {
        week,
        deep: +((avg(g.deep) / t) * 100).toFixed(1),
        rem: +((avg(g.rem) / t) * 100).toFixed(1),
        light: +((avg(g.light) / t) * 100).toFixed(1),
      };
    });
}

function pctChange(data: WeeklyPoint[]): string | null {
  if (data.length < 8) return null;
  const recent4 = data.slice(-4);
  const prev4 = data.slice(-8, -4);
  const avgR = recent4.reduce((s, d) => s + d.value, 0) / recent4.length;
  const avgP = prev4.reduce((s, d) => s + d.value, 0) / prev4.length;
  if (avgP === 0) return null;
  const pct = ((avgR - avgP) / Math.abs(avgP)) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}

// ---------------------------------------------------------------------------
// Reusable chart card
// ---------------------------------------------------------------------------

function ChartCard({
  title,
  change,
  children,
}: {
  title: string;
  change?: string | null;
  children: React.ReactNode;
}) {
  const isPositive = change?.startsWith("+");
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          {change && (
            <span
              className={`text-xs font-medium ${
                isPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {change}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">{children}</div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SleepSection({ data }: SleepSectionProps) {
  const { sleepData, readinessData, spo2Data, dailyTemperature } = data;

  // Filter to last 365 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 365);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const recentSleep = useMemo(
    () => sleepData.filter((d) => d.date >= cutoffStr),
    [sleepData, cutoffStr]
  );
  const recentReadiness = useMemo(
    () => readinessData.filter((d) => d.date >= cutoffStr),
    [readinessData, cutoffStr]
  );
  const recentSpo2 = useMemo(
    () => spo2Data.filter((d) => d.date >= cutoffStr),
    [spo2Data, cutoffStr]
  );
  const recentTemp = useMemo(
    () => dailyTemperature.filter((d) => d.date >= cutoffStr),
    [dailyTemperature, cutoffStr]
  );

  // Latest values for summary cards
  const latest = recentSleep[recentSleep.length - 1];
  const latestReadiness = recentReadiness[recentReadiness.length - 1];

  const avgScore = recentSleep.length
    ? Math.round(recentSleep.reduce((s, d) => s + d.score, 0) / recentSleep.length)
    : 0;
  const avgRecovery = recentReadiness.length
    ? Math.round(
        recentReadiness.reduce((s, d) => s + d.score, 0) / recentReadiness.length
      )
    : 0;
  const avgHRV = recentSleep.length
    ? Math.round(recentSleep.reduce((s, d) => s + d.hrvAvg, 0) / recentSleep.length)
    : 0;
  const avgDeepPct = recentSleep.length
    ? +(
        (recentSleep.reduce((s, d) => s + d.deepSleepSeconds, 0) /
          recentSleep.reduce((s, d) => s + d.totalSleepSeconds, 0)) *
        100
      ).toFixed(0)
    : 0;

  // --- Weekly datasets ---
  const wkScore = useMemo(
    () => weeklyAverage(recentSleep.map((d) => ({ date: d.date, value: d.score }))),
    [recentSleep]
  );
  const wkStages = useMemo(
    () =>
      weeklyStagesPercent(
        recentSleep.map((d) => ({
          date: d.date,
          deep: d.deepSleepSeconds,
          rem: d.remSleepSeconds,
          light: d.lightSleepSeconds,
          total: d.totalSleepSeconds,
        }))
      ),
    [recentSleep]
  );
  const wkHRV = useMemo(
    () => weeklyAverage(recentSleep.map((d) => ({ date: d.date, value: d.hrvAvg }))),
    [recentSleep]
  );
  const wkTempDev = useMemo(
    () =>
      weeklyAverage(
        recentReadiness.map((d) => ({ date: d.date, value: d.temperatureDeviation }))
      ),
    [recentReadiness]
  );
  const wkDuration = useMemo(
    () =>
      weeklyAverage(
        recentSleep.map((d) => ({
          date: d.date,
          value: +(d.totalSleepSeconds / 3600).toFixed(2),
        }))
      ),
    [recentSleep]
  );
  const wkRestless = useMemo(
    () =>
      weeklyAverage(
        recentSleep.map((d) => ({ date: d.date, value: d.restlessPeriods }))
      ),
    [recentSleep]
  );
  const wkLatency = useMemo(
    () =>
      weeklyAverage(
        recentSleep.map((d) => ({
          date: d.date,
          value: +(d.latencySeconds / 60).toFixed(1),
        }))
      ),
    [recentSleep]
  );
  const wkBreath = useMemo(
    () =>
      weeklyAverage(
        recentSleep.map((d) => ({ date: d.date, value: d.breathRate }))
      ),
    [recentSleep]
  );
  const wkSpo2 = useMemo(
    () =>
      weeklyAverage(
        recentSpo2.map((d) => ({ date: d.date, value: d.averageSpo2 }))
      ),
    [recentSpo2]
  );
  const wkSkinTemp = useMemo(
    () =>
      weeklyAverage(
        recentTemp.map((d) => ({ date: d.date, value: d.avgSkinTemp }))
      ),
    [recentTemp]
  );

  const wkBDI = useMemo(
    () =>
      weeklyAverage(
        recentSpo2
          .filter((d) => d.breathingDisturbanceIndex != null)
          .map((d) => ({ date: d.date, value: d.breathingDisturbanceIndex }))
      ),
    [recentSpo2]
  );

  // --- Readiness contributors ---
  const contributorLabels: Record<string, string> = {
    activity_balance: "Activity Balance",
    body_temperature: "Body Temp",
    hrv_balance: "HRV Balance",
    previous_day_activity: "Prev Day Activity",
    previous_night: "Prev Night",
    recovery_index: "Recovery Index",
    resting_heart_rate: "Resting HR",
    sleep_balance: "Sleep Balance",
    sleep_regularity: "Sleep Regularity",
  };

  const radarData = useMemo(() => {
    const latest = recentReadiness[recentReadiness.length - 1];
    if (!latest?.contributors) return [];

    // 7-day average
    const recent7 = recentReadiness.slice(-7);
    const avgContributors: Record<string, number> = {};
    for (const key of Object.keys(contributorLabels)) {
      const vals = recent7
        .map((d) => d.contributors[key as keyof typeof d.contributors])
        .filter((v): v is number => v != null);
      avgContributors[key] = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
    }

    return Object.entries(contributorLabels).map(([key, label]) => ({
      subject: label,
      latest: latest.contributors[key as keyof typeof latest.contributors] ?? 0,
      avg7d: avgContributors[key] ?? 0,
      fullMark: 100,
    }));
  }, [recentReadiness]);

  // Format week label for display (show only every ~4th)
  const formatWeek = (w: string) => {
    const parts = w.split("-W");
    if (!parts[1]) return w;
    const weekNum = parseInt(parts[1], 10);
    return weekNum % 4 === 0 ? w : "";
  };

  return (
    <SectionWrapper id="sleep" title="Sleep">
      {/* ---- Summary cards ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Sleep Score</div>
          <div className="text-2xl font-bold text-teal-400">
            {latest?.score ?? "—"}
          </div>
          <div className="text-[10px] text-muted-foreground">avg {avgScore}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Recovery Score</div>
          <div className="text-2xl font-bold text-cyan-400">
            {latestReadiness?.score ?? "—"}
          </div>
          <div className="text-[10px] text-muted-foreground">avg {avgRecovery}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Avg HRV</div>
          <div className="text-2xl font-bold text-amber-400">
            {latest?.hrvAvg ?? "—"}
            <span className="text-sm font-normal text-muted-foreground"> ms</span>
          </div>
          <div className="text-[10px] text-muted-foreground">avg {avgHRV} ms</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Deep Sleep %</div>
          <div className="text-2xl font-bold text-indigo-400">
            {latest
              ? Math.round(
                  (latest.deepSleepSeconds / latest.totalSleepSeconds) * 100
                )
              : "—"}
            <span className="text-sm font-normal text-muted-foreground">%</span>
          </div>
          <div className="text-[10px] text-muted-foreground">avg {avgDeepPct}%</div>
        </Card>
      </div>

      {/* ---- Charts grid ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* 1. Sleep Scores */}
        <ChartCard title="Sleep Scores" change={pctChange(wkScore)}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={wkScore}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="week" tickFormatter={formatWeek} tick={CHART_AXIS_STYLE} />
              <YAxis domain={[50, 100]} tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="value"
                name="Score"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. Sleep Stages (stacked bar %) */}
        <ChartCard title="Sleep Stages (%)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wkStages}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="week" tickFormatter={formatWeek} tick={CHART_AXIS_STYLE} />
              <YAxis domain={[0, 100]} tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Bar dataKey="deep" stackId="a" name="Deep" fill={CHART_COLORS.deep} />
              <Bar dataKey="rem" stackId="a" name="REM" fill={CHART_COLORS.rem} />
              <Bar
                dataKey="light"
                stackId="a"
                name="Light"
                fill={CHART_COLORS.light}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3. HRV */}
        <ChartCard title="HRV (ms)" change={pctChange(wkHRV)}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={wkHRV}>
              <defs>
                <linearGradient id="hrvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.hrv} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.hrv} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="week" tickFormatter={formatWeek} tick={CHART_AXIS_STYLE} />
              <YAxis tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="value"
                name="HRV"
                stroke={CHART_COLORS.hrv}
                strokeWidth={2}
                fill="url(#hrvGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4. Temperature Deviation */}
        <ChartCard title="Temperature Deviation (°C)" change={pctChange(wkTempDev)}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={wkTempDev}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="week" tickFormatter={formatWeek} tick={CHART_AXIS_STYLE} />
              <YAxis tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="value"
                name="Temp Dev"
                stroke={CHART_COLORS.accent}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 5. Sleep Duration */}
        <ChartCard title="Sleep Duration (hours)" change={pctChange(wkDuration)}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={wkDuration}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="week" tickFormatter={formatWeek} tick={CHART_AXIS_STYLE} />
              <YAxis domain={[4, 10]} tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <ReferenceLine
                y={8}
                stroke={CHART_COLORS.success}
                strokeDasharray="6 3"
                label={{
                  value: "8h goal",
                  position: "right",
                  fill: CHART_COLORS.success,
                  fontSize: 10,
                }}
              />
              <Bar dataKey="value" name="Duration" fill={CHART_COLORS.cyan} radius={[2, 2, 0, 0]} opacity={0.7} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 6. Toss & Turns */}
        <ChartCard title="Toss & Turns (restless periods)" change={pctChange(wkRestless)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wkRestless}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="week" tickFormatter={formatWeek} tick={CHART_AXIS_STYLE} />
              <YAxis tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Bar dataKey="value" name="Restless" fill={CHART_COLORS.warning} radius={[2, 2, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 7. Sleep Latency */}
        <ChartCard title="Sleep Latency (minutes)" change={pctChange(wkLatency)}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={wkLatency}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="week" tickFormatter={formatWeek} tick={CHART_AXIS_STYLE} />
              <YAxis tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="value"
                name="Latency"
                stroke={CHART_COLORS.pink}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 8. Respiratory Rate */}
        <ChartCard title="Respiratory Rate (breaths/min)" change={pctChange(wkBreath)}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={wkBreath}>
              <defs>
                <linearGradient id="breathGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="week" tickFormatter={formatWeek} tick={CHART_AXIS_STYLE} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="value"
                name="Breath Rate"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                fill="url(#breathGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 9. Blood Oxygen (SpO2) */}
        <ChartCard title="Blood Oxygen SpO2 (%)" change={pctChange(wkSpo2)}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={wkSpo2}>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="week" tickFormatter={formatWeek} tick={CHART_AXIS_STYLE} />
              <YAxis domain={[94, 100]} tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <ReferenceLine
                y={95}
                stroke={CHART_COLORS.danger}
                strokeDasharray="6 3"
                label={{
                  value: "95% min",
                  position: "right",
                  fill: CHART_COLORS.danger,
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="SpO2"
                stroke={CHART_COLORS.secondary}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 10. Skin Temperature */}
        <ChartCard title="Skin Temperature (°C)" change={pctChange(wkSkinTemp)}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={wkSkinTemp}>
              <defs>
                <linearGradient id="skinTempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="week" tickFormatter={formatWeek} tick={CHART_AXIS_STYLE} />
              <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="value"
                name="Skin Temp"
                stroke={CHART_COLORS.accent}
                strokeWidth={2}
                fill="url(#skinTempGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 11. Recovery Score */}
        <ChartCard
          title="Recovery Score"
          change={pctChange(
            weeklyAverage(
              recentReadiness.map((d) => ({ date: d.date, value: d.score }))
            )
          )}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={weeklyAverage(
                recentReadiness.map((d) => ({ date: d.date, value: d.score }))
              )}
            >
              <CartesianGrid {...CHART_GRID_STYLE} />
              <XAxis dataKey="week" tickFormatter={formatWeek} tick={CHART_AXIS_STYLE} />
              <YAxis domain={[50, 100]} tick={CHART_AXIS_STYLE} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="value"
                name="Recovery"
                stroke={CHART_COLORS.recovery}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 12. Breathing Disturbance Index */}
        {wkBDI.length > 0 && (
          <ChartCard title="Breathing Disturbance Index" change={pctChange(wkBDI)}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wkBDI}>
                <defs>
                  <linearGradient id="bdiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.warning} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.warning} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...CHART_GRID_STYLE} />
                <XAxis dataKey="week" tickFormatter={formatWeek} tick={CHART_AXIS_STYLE} />
                <YAxis tick={CHART_AXIS_STYLE} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <ReferenceLine
                  y={5}
                  stroke={CHART_COLORS.danger}
                  strokeDasharray="6 3"
                  label={{
                    value: "Normal <5",
                    position: "right",
                    fill: CHART_COLORS.danger,
                    fontSize: 10,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="BDI"
                  stroke={CHART_COLORS.warning}
                  strokeWidth={2}
                  fill="url(#bdiGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* 13. Recovery Contributors (Radar) */}
        {radarData.length > 0 && (
          <ChartCard title="Recovery Contributors">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 9, fill: "hsl(240 5% 65%)" }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="7-day avg"
                  dataKey="avg7d"
                  stroke={CHART_COLORS.recovery}
                  fill="none"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
                <Radar
                  name="Latest"
                  dataKey="latest"
                  stroke={CHART_COLORS.recovery}
                  fill={CHART_COLORS.recovery}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Legend
                  wrapperStyle={{ fontSize: 10, color: "hsl(240 5% 65%)" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Legend for sleep stages */}
      <div className="flex gap-4 mt-2 justify-center">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS.deep }} />
          Deep
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS.rem }} />
          REM
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS.light }} />
          Light
        </div>
      </div>
    </SectionWrapper>
  );
}
