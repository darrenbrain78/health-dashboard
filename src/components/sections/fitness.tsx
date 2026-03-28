"use client";

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
} from "recharts";
import { CHART_COLORS, CHART_AXIS_STYLE, CHART_GRID_STYLE, CHART_TOOLTIP_STYLE } from "@/lib/chart-config";
import type { RunActivity } from "@/types/health";

interface FitnessSectionProps {
  data: RunActivity[];
}

export function FitnessSection({ data }: FitnessSectionProps) {
  const runsWithDistance = data.filter((r) => r.distanceMiles != null && r.distanceMiles > 0);
  const totalMiles = runsWithDistance.reduce((s, r) => s + (r.distanceMiles ?? 0), 0);
  const longestRun = runsWithDistance.length > 0
    ? Math.max(...runsWithDistance.map((r) => r.distanceMiles ?? 0))
    : 0;
  const avgPaceMin = runsWithDistance.length > 0
    ? runsWithDistance.reduce((s, r) => {
        if (!r.pacePerMile) return s;
        const [m, sec] = r.pacePerMile.split(":").map(Number);
        return s + m + sec / 60;
      }, 0) / runsWithDistance.filter(r => r.pacePerMile).length
    : 0;
  const mostElevation = data.length > 0
    ? Math.max(...data.map((r) => r.elevationGainFt ?? 0))
    : 0;

  const chartData = data
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      miles: r.distanceMiles ?? 0,
      name: r.name ?? r.type ?? "Run",
    }));

  return (
    <SectionWrapper id="running" title="Running">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Total Miles</div>
          <div className="text-2xl font-bold text-primary tabular-nums">{totalMiles.toFixed(1)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Longest Run</div>
          <div className="text-2xl font-bold text-emerald-500 tabular-nums">{longestRun.toFixed(1)}<span className="text-xs text-muted-foreground ml-1">mi</span></div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Avg Pace</div>
          <div className="text-2xl font-bold text-amber-500 tabular-nums">
            {avgPaceMin > 0
              ? `${Math.floor(avgPaceMin)}:${String(Math.round((avgPaceMin % 1) * 60)).padStart(2, "0")}`
              : "—"}
            <span className="text-xs text-muted-foreground ml-1">/mi</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Most Elevation</div>
          <div className="text-2xl font-bold text-orange-500 tabular-nums">{mostElevation}<span className="text-xs text-muted-foreground ml-1">ft</span></div>
        </Card>
      </div>

      {runsWithDistance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid {...CHART_GRID_STYLE} />
                  <XAxis dataKey="date" tick={CHART_AXIS_STYLE} />
                  <YAxis tick={CHART_AXIS_STYLE} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="miles" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="Miles" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Run Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 20)
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
    </SectionWrapper>
  );
}
