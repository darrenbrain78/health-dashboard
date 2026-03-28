"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionWrapper } from "@/components/section-wrapper";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkline } from "@/components/ui/sparkline";
import { CHART_COLORS } from "@/lib/chart-config";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LabResult, LabStatus } from "@/types/health";

interface LabResultsSectionProps {
  data: LabResult[];
}

/* ------------------------------------------------------------------ */
/*  Tab definitions — map display tabs to real data categories         */
/* ------------------------------------------------------------------ */
const TAB_DEFINITIONS: { label: string; categories: string[] }[] = [
  { label: "Iron Studies", categories: ["Iron Status"] },
  { label: "Liver", categories: ["Liver"] },
  { label: "Lipids", categories: ["Cholesterol"] },
  { label: "CBC", categories: ["Red Blood Cells", "White Blood Cells", "Clotting"] },
  { label: "Kidney", categories: ["Kidney"] },
  {
    label: "Metabolic",
    categories: ["Diabetes", "Proteins", "Inflammation", "Gout Risk", "Minerals", "Muscle Health"],
  },
  {
    label: "Vitamins & Hormones",
    categories: ["Vitamins", "Thyroid", "Hormones"],
  },
];

/* ------------------------------------------------------------------ */
/*  Status colours                                                     */
/* ------------------------------------------------------------------ */
const statusSparklineColor: Record<LabStatus, string> = {
  optimal: "#10b981",
  good: "#10b981",
  borderline: "#f59e0b",
  elevated: "#ef4444",
  critical: "#ef4444",
};

const statusDotColor: Record<LabStatus, string> = {
  optimal: "bg-emerald-500",
  good: "bg-emerald-400",
  borderline: "bg-amber-400",
  elevated: "bg-orange-500",
  critical: "bg-red-500",
};

/* ------------------------------------------------------------------ */
/*  Helper: compute % change                                           */
/* ------------------------------------------------------------------ */
function pctChange(history: { date: string; value: number | null }[]): number | null {
  const valid = history.filter((h) => h.value !== null) as { date: string; value: number }[];
  if (valid.length < 2) return null;
  const sorted = [...valid].sort((a, b) => a.date.localeCompare(b.date));
  const prev = sorted[sorted.length - 2].value;
  const curr = sorted[sorted.length - 1].value;
  if (prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

/* ------------------------------------------------------------------ */
/*  Helper type for processed markers                                  */
/* ------------------------------------------------------------------ */
interface ProcessedMarker {
  marker: string;
  category: string;
  latestValue: number;
  unit: string;
  referenceRange: string;
  status: LabStatus;
  latestDate: string;
  history: { date: string; value: number | null }[];
  change: number | null;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export function LabResultsSection({ data }: LabResultsSectionProps) {
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());

  /* Build latest-by-marker map */
  const { markerMap, allDates } = useMemo(() => {
    const map = new Map<string, ProcessedMarker>();

    for (const result of data) {
      const key = `${result.category}:${result.marker}`;
      const existing = map.get(key);
      if (!existing || result.date > existing.latestDate) {
        map.set(key, {
          marker: result.marker,
          category: result.category,
          latestValue: result.value,
          unit: result.unit,
          referenceRange: result.referenceRange,
          status: result.status,
          latestDate: result.date,
          history: result.history,
          change: pctChange(result.history),
        });
      }
    }

    const dates = [...new Set(data.flatMap((d) => d.history.map((h) => h.date)))]
      .sort((a, b) => a.localeCompare(b));

    return { markerMap: map, allDates: dates };
  }, [data]);

  /* Get markers for a set of categories */
  function markersForCategories(categories: string[]): ProcessedMarker[] {
    const catSet = new Set(categories);
    return [...markerMap.values()].filter((m) => catSet.has(m.category));
  }

  /* Toggle panel in historical table */
  function togglePanel(panel: string) {
    setExpandedPanels((prev) => {
      const next = new Set(prev);
      if (next.has(panel)) next.delete(panel);
      else next.add(panel);
      return next;
    });
  }

  /* Build panel groups for historical table */
  const panelGroups = useMemo(() => {
    const groups: { label: string; categories: string[]; markers: ProcessedMarker[] }[] = [];
    for (const tab of TAB_DEFINITIONS) {
      const markers = markersForCategories(tab.categories);
      if (markers.length > 0) {
        groups.push({ label: tab.label, categories: tab.categories, markers });
      }
    }
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerMap]);

  /* Format date for display */
  function fmtDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function fmtDateShort(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  }

  /* Find value for a marker on a specific date */
  function valueOnDate(marker: ProcessedMarker, date: string): { value: number | null; status: LabStatus | null } {
    // Find the actual LabResult for this marker on this date to get real status
    const match = data.find(
      (d) => d.category === marker.category && d.marker === marker.marker && d.date === date
    );
    if (match) {
      return { value: match.value, status: match.status };
    }
    // Fall back to history entry (no status available)
    const histEntry = marker.history.find((h) => h.date === date);
    if (histEntry && histEntry.value !== null) {
      return { value: histEntry.value, status: null };
    }
    return { value: null, status: null };
  }

  /* Determine status for a value given reference range */
  function statusForValue(marker: ProcessedMarker, date: string): LabStatus | null {
    const { status } = valueOnDate(marker, date);
    return status;
  }

  return (
    <SectionWrapper id="lab-results" title="Lab Results">
      {/* ========== TABBED MARKER CARDS ========== */}
      <Tabs defaultValue={TAB_DEFINITIONS[0].label}>
        <TabsList className="flex-wrap h-auto gap-1 mb-2">
          {TAB_DEFINITIONS.map((tab) => (
            <TabsTrigger key={tab.label} value={tab.label} className="text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_DEFINITIONS.map((tab) => {
          const markers = markersForCategories(tab.categories);

          return (
            <TabsContent key={tab.label} value={tab.label}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {markers.map((m) => (
                  <Card key={m.marker} className="relative overflow-hidden">
                    <CardContent className="p-4">
                      {/* Header row: name + badge */}
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground leading-tight">
                          {m.marker}
                        </span>
                        <Badge status={m.status} />
                      </div>

                      {/* Value row */}
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-2xl font-bold tabular-nums text-foreground">
                          {m.latestValue}
                        </span>
                        <span className="text-xs text-muted-foreground">{m.unit}</span>
                      </div>

                      {/* % change */}
                      <div className="flex items-center gap-1 mb-3">
                        {m.change !== null ? (
                          <>
                            {m.change > 0 ? (
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                            ) : m.change < 0 ? (
                              <TrendingDown className="w-3 h-3 text-red-400" />
                            ) : (
                              <Minus className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span
                              className={`text-[11px] font-medium tabular-nums ${
                                m.change > 0
                                  ? "text-emerald-400"
                                  : m.change < 0
                                  ? "text-red-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {m.change > 0 ? "+" : ""}
                              {m.change.toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-1">
                              vs previous
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            No previous data
                          </span>
                        )}
                      </div>

                      {/* Sparkline */}
                      {m.history.filter((h) => h.value !== null).length > 1 && (
                        <div className="h-8">
                          <Sparkline
                            data={m.history
                              .filter((h) => h.value !== null)
                              .map((h) => ({ value: h.value as number }))}
                            color={statusSparklineColor[m.status]}
                            height={32}
                          />
                        </div>
                      )}

                      {/* Reference range */}
                      <div className="text-[10px] text-muted-foreground mt-1">
                        Ref: {m.referenceRange}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* ========== HISTORICAL LAB RESULTS TABLE ========== */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Historical Lab Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground w-48">
                    Marker
                  </th>
                  {allDates.map((date) => (
                    <th
                      key={date}
                      className="text-center py-2 px-3 text-xs font-medium text-muted-foreground min-w-[90px]"
                    >
                      {fmtDate(date)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {panelGroups.map((group) => {
                  const isExpanded = expandedPanels.has(group.label);
                  return (
                    <PanelGroup
                      key={group.label}
                      label={group.label}
                      markerCount={group.markers.length}
                      isExpanded={isExpanded}
                      onToggle={() => togglePanel(group.label)}
                      markers={group.markers}
                      allDates={allDates}
                      valueOnDate={valueOnDate}
                      statusForValue={statusForValue}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}

/* ------------------------------------------------------------------ */
/*  Panel group sub-component for the historical table                 */
/* ------------------------------------------------------------------ */
interface PanelGroupProps {
  label: string;
  markerCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  markers: ProcessedMarker[];
  allDates: string[];
  valueOnDate: (marker: ProcessedMarker, date: string) => { value: number | null; status: LabStatus | null };
  statusForValue: (marker: ProcessedMarker, date: string) => LabStatus | null;
}

function PanelGroup({
  label,
  markerCount,
  isExpanded,
  onToggle,
  markers,
  allDates,
  valueOnDate,
}: PanelGroupProps) {
  return (
    <>
      {/* Panel header row */}
      <tr
        className="border-b border-border bg-secondary/40 cursor-pointer hover:bg-secondary/60 transition-colors"
        onClick={onToggle}
      >
        <td className="py-2 px-4" colSpan={allDates.length + 1}>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className="text-xs font-semibold text-foreground">{label}</span>
            <span className="text-[10px] text-muted-foreground">
              {markerCount} marker{markerCount !== 1 ? "s" : ""}
            </span>
          </div>
        </td>
      </tr>

      {/* Marker rows */}
      {isExpanded &&
        markers.map((marker) => (
          <tr key={marker.marker} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
            <td className="py-1.5 px-4 pl-9">
              <span className="text-xs text-foreground">{marker.marker}</span>
              <span className="text-[10px] text-muted-foreground ml-1">({marker.unit})</span>
            </td>
            {allDates.map((date) => {
              const { value, status } = valueOnDate(marker, date);
              return (
                <td key={date} className="text-center py-1.5 px-3">
                  {value !== null ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          status ? statusDotColor[status] : "bg-muted-foreground"
                        }`}
                      />
                      <span className="text-xs tabular-nums text-foreground">{value}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
    </>
  );
}
