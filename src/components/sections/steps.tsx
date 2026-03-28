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
  ReferenceLine,
} from "recharts";
import { CHART_COLORS, CHART_AXIS_STYLE, CHART_GRID_STYLE, CHART_TOOLTIP_STYLE } from "@/lib/chart-config";
import type { ActivityData } from "@/types/health";

interface StepsSectionProps {
  data: ActivityData[];
}

export function StepsSection({ data }: StepsSectionProps) {
  const recent = data.slice(-14);
  const latest = data[data.length - 1];
  const avg = Math.round(recent.reduce((s, d) => s + d.steps, 0) / recent.length);
  const max = Math.max(...recent.map((d) => d.steps));
  const goal = 10000;
  const daysAboveGoal = recent.filter((d) => d.steps >= goal).length;

  const chartData = recent.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
    steps: d.steps,
  }));

  return (
    <SectionWrapper id="steps" title="Daily Steps">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Today</div>
          <div className="text-2xl font-bold text-emerald-500 tabular-nums">{latest?.steps?.toLocaleString() ?? "—"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">14-Day Avg</div>
          <div className="text-2xl font-bold text-muted-foreground tabular-nums">{avg.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">14-Day High</div>
          <div className="text-2xl font-bold text-primary tabular-nums">{max.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-muted-foreground">Days &ge; 10K</div>
          <div className="text-2xl font-bold text-amber-500 tabular-nums">{daysAboveGoal}<span className="text-xs text-muted-foreground">/{recent.length}</span></div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Steps (14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid {...CHART_GRID_STYLE} />
                <XAxis dataKey="date" tick={CHART_AXIS_STYLE} />
                <YAxis tick={CHART_AXIS_STYLE} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <ReferenceLine y={goal} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "10K Goal", position: "right", fill: "#f59e0b", fontSize: 10 }} />
                <Bar dataKey="steps" fill={CHART_COLORS.steps} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
