"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SectionWrapper } from "@/components/section-wrapper";
import { cn } from "@/lib/utils";
import type { Condition } from "@/types/health";

interface ConditionsSectionProps {
  data: Condition[];
}

const statusColors = {
  active: "bg-red-500/10 text-red-400",
  managed: "bg-amber-500/10 text-amber-400",
  resolved: "bg-emerald-500/10 text-emerald-400",
};

export function ConditionsSection({ data }: ConditionsSectionProps) {
  return (
    <SectionWrapper id="conditions" title="Conditions">
      <Card>
        <CardContent className="p-4">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conditions recorded.</p>
          ) : (
            <div className="space-y-3">
              {data.map((c, i) => (
                <div key={i} className="flex items-center gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{c.name}</div>
                    {c.diagnosedDate && <div className="text-[10px] text-muted-foreground">Since {new Date(c.diagnosedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</div>}
                    {c.notes && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{c.notes}</div>}
                  </div>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full capitalize", statusColors[c.status])}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
