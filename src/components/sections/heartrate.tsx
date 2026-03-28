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

interface HeartRateSectionProps {
  data: SleepData[];
}

export function HeartRateSection({ data }: HeartRateSectionProps) {
  const recent = data.slice(-30);
  const latest = data[data.length - 1];
  const avg = Math.round(recent.reduce((s, d) => s + d.restingHR, 0) / recent.length);

  const chartData = recent.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    rhr: d.restingHR,
  }));

  return (
    <SectionWrapper id="heartrate" title="Resting Heart Rate">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Current RHR</div>
          <div className="text-2xl font-bold text-red-500">{latest?.restingHR ?? "—"}<span className="text-xs text-muted-foreground ml-1">bpm</span></div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">30-Day Avg</div>
          <div className="text-2xl font-bold text-muted-foreground">{avg}<span className="text-xs text-muted-foreground ml-1">bpm</span></div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Breath Rate</div>
          <div className="text-2xl font-bold text-blue-500">{latest?.breathRate?.toFixed(1) ?? "—"}<span className="text-xs text-muted-foreground ml-1">/min</span></div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resting Heart Rate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid {...CHART_GRID_STYLE} />
                <XAxis dataKey="date" tick={CHART_AXIS_STYLE} interval={4} />
                <YAxis domain={["dataMin - 3", "dataMax + 3"]} tick={CHART_AXIS_STYLE} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="rhr" stroke={CHART_COLORS.heartRate} strokeWidth={2} dot={{ r: 2, fill: CHART_COLORS.heartRate }} name="RHR (bpm)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
