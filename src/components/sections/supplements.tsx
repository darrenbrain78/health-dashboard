"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionWrapper } from "@/components/section-wrapper";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Supplement } from "@/types/health";

interface SupplementsSectionProps {
  data: Supplement[];
}

export function SupplementsSection({ data }: SupplementsSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const preview = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <SectionWrapper id="supplements" title="Supplements">
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-3">
                    Supplement
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-3">
                    Daily Dosage
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-3">
                    Frequency
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-3">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.map((sup, i) => (
                  <tr
                    key={i}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {sup.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {sup.dosage}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">
                      {sup.frequency}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {sup.reason}
                    </td>
                  </tr>
                ))}
                {expanded &&
                  rest.map((sup, i) => (
                    <tr
                      key={`rest-${i}`}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {sup.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {sup.dosage}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        {sup.frequency}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {sup.reason}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {rest.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Hide Detailed Supplements
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Show Detailed Supplements ({rest.length} more)
                </>
              )}
            </button>
          )}
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
