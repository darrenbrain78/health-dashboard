"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionWrapper } from "@/components/section-wrapper";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CHART_AXIS_STYLE, CHART_GRID_STYLE, CHART_TOOLTIP_STYLE } from "@/lib/chart-config";
import { cn } from "@/lib/utils";
import type { BodyComposition } from "@/types/health";

interface BodyCompositionSectionProps {
  data: BodyComposition[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatDelta(current: number, previous: number | undefined, unit: string, invert = false): React.ReactNode {
  if (previous === undefined) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) return null;
  const isPositive = diff > 0;
  const isGood = invert ? !isPositive : isPositive;
  return (
    <span
      className={cn(
        "text-[10px] font-medium ml-1.5",
        isGood ? "text-emerald-400" : "text-red-400"
      )}
    >
      {isPositive ? "+" : ""}
      {diff.toFixed(1)}
      {unit}
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  color: string;
  delta: React.ReactNode;
}

function MetricCard({ label, value, unit, color, delta }: MetricCardProps) {
  return (
    <div className="bg-secondary/50 rounded-lg p-4">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-1 flex items-baseline">
        <span className={cn("text-2xl font-bold tabular-nums", color)}>
          {value}
        </span>
        <span className="text-xs text-muted-foreground ml-1">{unit}</span>
        {delta}
      </div>
    </div>
  );
}

export function BodyCompositionSection({ data }: BodyCompositionSectionProps) {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const latestDate = sorted[sorted.length - 1]?.date;

  return (
    <SectionWrapper id="body-composition" title="Body Composition">
      <Card>
        <CardContent className="p-4">
          <Tabs defaultValue={latestDate}>
            <TabsList className="mb-4">
              {sorted.map((entry) => (
                <TabsTrigger key={entry.date} value={entry.date}>
                  {formatDate(entry.date)}
                </TabsTrigger>
              ))}
            </TabsList>

            {sorted.map((entry, idx) => {
              const prev = idx > 0 ? sorted[idx - 1] : undefined;
              return (
                <TabsContent key={entry.date} value={entry.date}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <MetricCard
                      label="Weight"
                      value={entry.weightKg}
                      unit="kg"
                      color="text-blue-500"
                      delta={formatDelta(entry.weightKg, prev?.weightKg, " kg", true)}
                    />
                    <MetricCard
                      label="Body Fat"
                      value={entry.bodyFatPct}
                      unit="%"
                      color="text-amber-500"
                      delta={formatDelta(entry.bodyFatPct, prev?.bodyFatPct, "%", true)}
                    />
                    <MetricCard
                      label="Lean Mass"
                      value={entry.leanMassKg}
                      unit="kg"
                      color="text-emerald-500"
                      delta={formatDelta(entry.leanMassKg, prev?.leanMassKg, " kg")}
                    />
                    <MetricCard
                      label="BMI"
                      value={entry.bmi.toFixed(1)}
                      unit=""
                      color="text-cyan-500"
                      delta={formatDelta(entry.bmi, prev?.bmi, "", true)}
                    />
                    <MetricCard
                      label="Bone Mass"
                      value={entry.boneMassKg}
                      unit="kg"
                      color="text-muted-foreground"
                      delta={formatDelta(entry.boneMassKg, prev?.boneMassKg, " kg")}
                    />
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Trend Charts */}
      {sorted.length >= 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {([
            { key: "weightKg" as const, label: "Weight (kg)", color: "#3b82f6", refLine: undefined },
            { key: "bodyFatPct" as const, label: "Body Fat (%)", color: "#f59e0b", refLine: undefined },
            { key: "leanMassKg" as const, label: "Lean Mass (kg)", color: "#10b981", refLine: undefined },
            { key: "bmi" as const, label: "BMI", color: "#06b6d4", refLine: 25 },
          ] as const).map(({ key, label, color, refLine }) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sorted.map((d) => ({ date: formatDate(d.date), value: d[key] }))}>
                      <CartesianGrid {...CHART_GRID_STYLE} />
                      <XAxis dataKey="date" tick={CHART_AXIS_STYLE} />
                      <YAxis
                        domain={["dataMin - 1", "dataMax + 1"]}
                        tick={CHART_AXIS_STYLE}
                      />
                      <Tooltip {...CHART_TOOLTIP_STYLE} />
                      {refLine != null && (
                        <ReferenceLine
                          y={refLine}
                          stroke="#ef4444"
                          strokeDasharray="6 3"
                          label={{
                            value: `${refLine}`,
                            position: "right",
                            fill: "#ef4444",
                            fontSize: 10,
                          }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="value"
                        name={label}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ r: 3, fill: color }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </SectionWrapper>
  );
}
