"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
} from "recharts";

interface SparklineProps {
  data: { value: number }[];
  color?: string;
  height?: number;
}

export function Sparkline({
  data,
  color = "#14b8a6",
  height = 8,
}: SparklineProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="overflow-hidden" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <YAxis domain={["dataMin", "dataMax"]} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
