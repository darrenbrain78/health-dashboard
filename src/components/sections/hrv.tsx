"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionWrapper } from "@/components/section-wrapper";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CHART_COLORS, CHART_AXIS_STYLE, CHART_GRID_STYLE, CHART_TOOLTIP_STYLE } from "@/lib/chart-config";
import type { SleepData } from "@/types/health";

interface HRVSectionProps {
  data: SleepData[];
}

export function HRVSection({ data }: HRVSectionProps) {
  const recent = data.slice(-30);
  const latest = data[data.length - 1];
  const avg = Math.round(recent.reduce((s, d) => s + d.hrvAvg, 0) / recent.length);
  const max = Math.max(...recent.map((d) => d.hrvAvg));
  const min = Math.min(...recent.map((d) => d.hrvAvg));

  const chartData = recent.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    hrv: d.hrvAvg,
  }));

  return (
    <SectionWrapper id="hrv" title="Heart Rate Variability">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Current HRV</div>
          <div className="text-2xl font-bold text-cyan-500">{latest?.hrvAvg ?? "—"}<span className="text-xs text-muted-foreground ml-1">ms</span></div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">30-Day Avg</div>
          <div className="text-2xl font-bold text-muted-foreground">{avg}<span className="text-xs text-muted-foreground ml-1">ms</span></div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">30-Day High</div>
          <div className="text-2xl font-bold text-emerald-500">{max}<span className="text-xs text-muted-foreground ml-1">ms</span></div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">30-Day Low</div>
          <div className="text-2xl font-bold text-red-500">{min}<span className="text-xs text-muted-foreground ml-1">ms</span></div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>HRV Trend (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid {...CHART_GRID_STYLE} />
                <XAxis dataKey="date" tick={CHART_AXIS_STYLE} interval={4} />
                <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={CHART_AXIS_STYLE} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="hrv" stroke={CHART_COLORS.hrv} strokeWidth={2} dot={{ r: 2, fill: CHART_COLORS.hrv }} name="HRV (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
