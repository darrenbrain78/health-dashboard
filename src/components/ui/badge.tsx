import { cn } from "@/lib/utils";

type LabStatus = "optimal" | "good" | "borderline" | "elevated" | "critical";

const statusStyles: Record<LabStatus, string> = {
  optimal:
    "bg-[var(--lab-optimal-bg)] text-[var(--lab-optimal-text)] border-transparent",
  good: "bg-[var(--lab-good-bg)] text-[var(--lab-good-text)] border-transparent",
  borderline:
    "bg-[var(--lab-borderline-bg)] text-[var(--lab-borderline-text)] border-transparent",
  elevated:
    "bg-[var(--lab-elevated-bg)] text-[var(--lab-elevated-text)] border-transparent",
  critical:
    "bg-[var(--lab-critical-bg)] text-[var(--lab-critical-text)] border-transparent",
};

const statusLabels: Record<LabStatus, string> = {
  optimal: "Optimal",
  good: "Good",
  borderline: "Borderline",
  elevated: "Elevated",
  critical: "Critical",
};

interface BadgeProps {
  status: LabStatus;
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ status, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border",
        statusStyles[status],
        className
      )}
    >
      {children ?? statusLabels[status]}
    </span>
  );
}

export type { LabStatus };
