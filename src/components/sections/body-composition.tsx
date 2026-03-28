"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SectionWrapper } from "@/components/section-wrapper";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
    </SectionWrapper>
  );
}
