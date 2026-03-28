"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Sparkline } from "./ui/sparkline";

type MetricColor = "green" | "yellow" | "orange" | "red" | "purple" | "cyan";
type Trend = "up" | "down" | "flat";
type Valence = "positive" | "negative" | "neutral";

const colorMap: Record<MetricColor, { text: string; sparkline: string }> = {
  green: { text: "text-emerald-500", sparkline: "#10b981" },
  yellow: { text: "text-amber-500", sparkline: "#f59e0b" },
  orange: { text: "text-orange-500", sparkline: "#f97316" },
  red: { text: "text-red-500", sparkline: "#ef4444" },
  purple: { text: "text-purple-500", sparkline: "#a855f7" },
  cyan: { text: "text-cyan-500", sparkline: "#06b6d4" },
};

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: Trend;
  valence?: Valence;
  color?: MetricColor;
  sparkline?: { value: number }[];
}

export function MetricCard({
  label,
  value,
  unit,
  trend,
  valence = "neutral",
  color = "cyan",
  sparkline,
}: MetricCardProps) {
  const colors = colorMap[color];
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;
  const trendColor =
    valence === "positive"
      ? "text-emerald-500"
      : valence === "negative"
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <div className="min-w-0 overflow-hidden">
      <div className="text-[10px] text-muted-foreground truncate">{label}</div>
      <div className={cn("text-lg font-bold tabular-nums", colors.text)}>
        {value}
        {unit && (
          <span className="text-[10px] text-muted-foreground ml-0.5">
            {unit}
          </span>
        )}
        {TrendIcon && (
          <TrendIcon className={cn("inline w-3 h-3 ml-1", trendColor)} />
        )}
      </div>
      {sparkline && sparkline.length > 0 && (
        <div className="mt-0.5">
          <Sparkline data={sparkline} color={colors.sparkline} />
        </div>
      )}
    </div>
  );
}
