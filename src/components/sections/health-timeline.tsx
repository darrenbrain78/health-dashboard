"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SectionWrapper } from "@/components/section-wrapper";
import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/types/health";

interface TimelineSectionProps {
  data: TimelineEvent[];
}

const categoryConfig: Record<
  TimelineEvent["category"],
  { label: string; color: string }
> = {
  "medical-visit": {
    label: "Medical Visit",
    color: "bg-blue-500/15 text-blue-400",
  },
  "lab-work": {
    label: "Lab Work",
    color: "bg-emerald-500/15 text-emerald-400",
  },
  assessment: {
    label: "Assessment",
    color: "bg-purple-500/15 text-purple-400",
  },
  milestone: {
    label: "Milestone",
    color: "bg-amber-500/15 text-amber-400",
  },
};

function groupByMonth(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const map = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const d = new Date(event.date);
    const key = d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    const list = map.get(key) ?? [];
    list.push(event);
    map.set(key, list);
  }
  return map;
}

export function HealthTimelineSection({ data }: TimelineSectionProps) {
  const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
  const grouped = groupByMonth(sorted);

  return (
    <SectionWrapper id="health-timeline" title="Health Timeline">
      <Card>
        <CardContent className="p-4">
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([month, events]) => (
              <div key={month}>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {month}
                </div>
                <div className="space-y-3">
                  {events.map((event, i) => {
                    const config = categoryConfig[event.category];
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                      >
                        <span
                          className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5",
                            config.color
                          )}
                        >
                          {config.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            {event.title}
                          </div>
                          {event.detail && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {event.detail}
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
