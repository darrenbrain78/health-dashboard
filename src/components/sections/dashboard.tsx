"use client";

import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/metric-card";
import { SectionWrapper } from "@/components/section-wrapper";
import { useLiveSensors } from "@/lib/live-sensors";
import { ALL_SENSOR_IDS, SENSOR_CONFIG, CLUSTER_ORDER, CLUSTER_LABELS } from "@/lib/sensor-config";
import type { SensorCluster } from "@/lib/sensor-config";
import type { HealthData } from "@/types/health";

interface DashboardSectionProps {
  data: HealthData;
}

function computeStepStreak(activityData: HealthData["activityData"]): number {
  let streak = 0;
  for (let i = activityData.length - 1; i >= 0; i--) {
    if (activityData[i].steps >= 10000) streak++;
    else break;
  }
  return streak;
}

function daysOverdue(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.floor((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function DashboardSection({ data }: DashboardSectionProps) {
  const recentSleep = data.sleepData.slice(-7);
  const recentActivity = data.activityData.slice(-7);

  const latestSleep = data.sleepData[data.sleepData.length - 1];
  const latestActivity = data.activityData[data.activityData.length - 1];
  const latestReadiness = data.readinessData[data.readinessData.length - 1];

  // Step streak
  const stepStreak = computeStepStreak(data.activityData);

  // VO2 Max
  const latestVO2 = data.vo2MaxEntries[data.vo2MaxEntries.length - 1];

  // Latest daily steps
  const latestSteps = latestActivity?.steps ?? 0;

  // Weekly running (from workouts)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyRunWorkouts = data.workoutActivities.filter(
    (w) => w.activity === "running" && new Date(w.date) >= weekAgo
  );
  const weeklyRunMinutes = weeklyRunWorkouts.reduce((s, w) => s + w.durationMinutes, 0);

  // Total datapoints estimate
  const totalDatapoints = (
    data.sleepData.length +
    data.activityData.length +
    data.readinessData.length +
    data.dailyHeartRate.length * 100 + // approximate original HR readings
    data.workoutActivities.length +
    data.spo2Data.length +
    data.dailyTemperature.length * 100 +
    data.labResults.length
  );

  // Latest sync date
  const allDates = [
    ...data.sleepData.map((d) => d.date),
    ...data.activityData.map((d) => d.date),
  ];
  const latestDate = allDates.sort().pop() ?? "";

  // Goals
  const goals = data.goals;
  const achievedGoals = goals.filter((g) => g.achieved);
  const workingGoals = goals.filter((g) => !g.achieved);

  const { sensors, loading: sensorsLoading } = useLiveSensors(ALL_SENSOR_IDS);
  const hasLiveSensors = sensors.size > 0;

  return (
    <SectionWrapper id="dashboard" title="">
      {/* LIVE Badge */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-emerald-400">LIVE</span>
          <span className="text-xs text-muted-foreground">· {latestDate ? `${daysOverdue(latestDate) === 0 ? "Today" : daysOverdue(latestDate) + "d ago"}` : ""}</span>
        </div>
        <span className="text-xs text-muted-foreground">{(totalDatapoints / 1000).toFixed(0)}k+ datapoints</span>
      </div>

      {/* Live Sensor Cards */}
      {(sensorsLoading || hasLiveSensors) && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Today (Live)</h3>
            {sensorsLoading && (
              <span className="text-[10px] text-muted-foreground animate-pulse">Loading sensors...</span>
            )}
          </div>
          {sensorsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Card key={i} className="p-3 border-border/30">
                  <div className="h-3 w-16 bg-secondary rounded animate-pulse mb-2" />
                  <div className="h-6 w-12 bg-secondary rounded animate-pulse" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {CLUSTER_ORDER.filter((cluster) =>
                SENSOR_CONFIG.some((cfg) => cfg.cluster === cluster && sensors.has(cfg.entityId))
              ).map((cluster) => {
                const clusterSensors = SENSOR_CONFIG.filter(
                  (cfg) => cfg.cluster === cluster && sensors.has(cfg.entityId)
                );
                return (
                  <div key={cluster}>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
                      {CLUSTER_LABELS[cluster]}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {clusterSensors.map((cfg) => {
                        const sv = sensors.get(cfg.entityId)!;
                        const display = cfg.format ? cfg.format(sv.state) : sv.state;
                        return (
                          <Card key={cfg.entityId} className="p-2.5 border-border/30">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                              </span>
                              <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
                            </div>
                            <div className={`text-lg font-bold tabular-nums ${cfg.getColor(sv.state)}`}>
                              {display}
                              {cfg.unit && <span className="text-[10px] text-muted-foreground ml-1">{cfg.unit}</span>}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4 border-border/50">
          <div className="text-[10px] text-muted-foreground mb-1">🔥 10k+ Step Streak</div>
          <div className="text-2xl font-bold text-primary tabular-nums">{stepStreak}</div>
          <div className="text-[10px] text-muted-foreground">days</div>
        </Card>

        <Card className="p-4 border-border/50">
          <div className="text-[10px] text-muted-foreground mb-1">🫁 VO2 Max</div>
          <div className="text-2xl font-bold text-cyan-500 tabular-nums">{latestVO2?.vo2Max ?? "—"}</div>
          <div className="text-[10px] text-muted-foreground">mL/kg/min</div>
        </Card>

        <Card className="p-4 border-border/50">
          <div className="text-[10px] text-muted-foreground mb-1">❤️ Resting Heart Rate</div>
          <div className="text-2xl font-bold text-red-500 tabular-nums">{latestSleep?.lowestHR ?? latestSleep?.restingHR ?? "—"}</div>
          <div className="text-[10px] text-muted-foreground">bpm</div>
        </Card>

        <Card className="p-4 border-border/50">
          <div className="text-[10px] text-muted-foreground mb-1">👟 Daily Steps</div>
          <div className="text-2xl font-bold text-emerald-500 tabular-nums">{latestSteps.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground">steps</div>
        </Card>

        <Card className="p-4 border-border/50">
          <div className="text-[10px] text-muted-foreground mb-1">🏃 Weekly Running</div>
          <div className="text-2xl font-bold text-purple-500 tabular-nums">{Math.round(weeklyRunMinutes)}</div>
          <div className="text-[10px] text-muted-foreground">min</div>
        </Card>
      </div>

      {/* 2026 Goals */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">2026 Goals</h3>
          <span className="text-xs text-muted-foreground">{achievedGoals.length}/{goals.length}</span>
        </div>

        {achievedGoals.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] text-emerald-400 font-medium mb-2">✓ ACHIEVED</div>
            <div className="flex flex-wrap gap-2">
              {achievedGoals.map((g, i) => (
                <span key={i} className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md">
                  {g.emoji} {g.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {workingGoals.length > 0 && (
          <div>
            <div className="text-[10px] text-amber-400 font-medium mb-2">☀️ WORKING ON · {workingGoals.length}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {workingGoals.map((g, i) => (
                <Card key={i} className="p-3 border-border/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs">{g.emoji} {g.title}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {g.current} → {g.target} {g.unit}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vitals Grid */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Vitals</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          <Card className="p-3 text-center border-border/30">
            <div className="text-[10px] text-muted-foreground">Age</div>
            <div className="text-lg font-bold tabular-nums">{new Date().getFullYear() - 1978}</div>
          </Card>
          {sensors.has("sensor.oura_ring_cardiovascular_age") && (() => {
            const cardioAge = Number(sensors.get("sensor.oura_ring_cardiovascular_age")!.state);
            const chronoAge = new Date().getFullYear() - 1978;
            const isGood = cardioAge <= chronoAge;
            return (
              <Card className="p-3 text-center border-border/30">
                <div className="text-[10px] text-muted-foreground">Cardio Age</div>
                <div className={`text-lg font-bold tabular-nums ${isGood ? "text-emerald-500" : "text-red-500"}`}>{cardioAge}</div>
              </Card>
            );
          })()}
          <Card className="p-3 text-center border-border/30">
            <div className="text-[10px] text-muted-foreground">Blood</div>
            <div className="text-lg font-bold">{data.patientInfo.bloodType}</div>
          </Card>
          <Card className="p-3 text-center border-border/30">
            <div className="text-[10px] text-muted-foreground">BP</div>
            <div className="text-lg font-bold tabular-nums">{data.patientInfo.latestBp}</div>
          </Card>
          <Card className="p-3 text-center border-border/30">
            <div className="text-[10px] text-muted-foreground">SpO₂</div>
            <div className="text-lg font-bold tabular-nums">{data.patientInfo.spo2}%</div>
          </Card>
          <Card className="p-3 text-center border-border/30">
            <div className="text-[10px] text-muted-foreground">Height</div>
            <div className="text-lg font-bold tabular-nums">{data.patientInfo.heightCm}<span className="text-[10px] text-muted-foreground">cm</span></div>
          </Card>
          <Card className="p-3 text-center border-border/30">
            <div className="text-[10px] text-muted-foreground">Weight</div>
            <div className="text-lg font-bold tabular-nums">{data.patientInfo.weightKg}<span className="text-[10px] text-muted-foreground">kg</span></div>
          </Card>
          <Card className="p-3 text-center border-border/30">
            <div className="text-[10px] text-muted-foreground">Recovery</div>
            <div className="text-lg font-bold text-emerald-500 tabular-nums">{latestReadiness?.score ?? "—"}</div>
          </Card>
          <Card className="p-3 text-center border-border/30">
            <div className="text-[10px] text-muted-foreground">HRV</div>
            <div className="text-lg font-bold text-cyan-500 tabular-nums">{latestSleep?.hrvAvg ?? "—"}<span className="text-[10px] text-muted-foreground">ms</span></div>
          </Card>
          <Card className="p-3 text-center border-border/30">
            <div className="text-[10px] text-muted-foreground">Steps</div>
            <div className="text-lg font-bold text-primary tabular-nums">{(latestSteps / 1000).toFixed(1)}k</div>
          </Card>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Next Steps</h3>
        <div className="space-y-2">
          {[
            { title: "Male Hormone Check + PSA Results", date: "2026-03-25", status: "pending" },
            { title: "Vitamin D Retest", date: "2026-09-21", status: "upcoming" },
            { title: "Thyroid Panel (next Medichecks)", date: "2027-03-01", status: "upcoming" },
            { title: "Nuffield Health Assessment", date: "2026-08-01", status: "upcoming" },
          ].map((item, i) => {
            const overdue = daysOverdue(item.date);
            const until = daysUntil(item.date);
            const isOverdue = overdue > 0 && item.status !== "upcoming";
            return (
              <Card key={i} className="p-3 flex items-center justify-between border-border/30">
                <span className="text-sm">{item.title}</span>
                <span className={`text-xs font-medium ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
                  {isOverdue ? `${overdue}d overdue` : `${until}d`}
                </span>
              </Card>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
}
