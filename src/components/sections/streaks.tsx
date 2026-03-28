"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SectionWrapper } from "@/components/section-wrapper";
import { Flame, Footprints, Moon, Dumbbell } from "lucide-react";
import type { HealthData } from "@/types/health";

interface StreaksSectionProps {
  data: HealthData;
}

function calculateStreak(values: boolean[]): number {
  let streak = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i]) streak++;
    else break;
  }
  return streak;
}

export function StreaksSection({ data }: StreaksSectionProps) {
  const stepStreak = calculateStreak(data.activityData.map((d) => d.steps >= 8000));
  const sleepStreak = calculateStreak(data.sleepData.map((d) => d.score >= 75));
  const activeStreak = calculateStreak(data.activityData.map((d) => d.activeMinutes >= 30));

  const streaks = [
    { icon: Footprints, label: "Steps 8K+", value: stepStreak, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: Moon, label: "Sleep 75+", value: sleepStreak, color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: Dumbbell, label: "Active 30m+", value: activeStreak, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <SectionWrapper id="streaks" title="Streaks">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {streaks.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</span>
                    <span className="text-xs text-muted-foreground">days</span>
                    {s.value >= 7 && <Flame className="w-4 h-4 text-orange-500 ml-1" />}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
