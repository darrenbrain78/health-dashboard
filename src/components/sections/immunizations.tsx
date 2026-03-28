"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SectionWrapper } from "@/components/section-wrapper";
import { Syringe } from "lucide-react";
import type { Immunization } from "@/types/health";

interface ImmunizationsSectionProps {
  data: Immunization[];
}

export function ImmunizationsSection({ data }: ImmunizationsSectionProps) {
  return (
    <SectionWrapper id="immunizations" title="Immunizations">
      <Card>
        <CardContent className="p-4">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No immunizations recorded.</p>
          ) : (
            <div className="space-y-3">
              {data.map((imm, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-purple-500/10">
                    <Syringe className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{imm.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(imm.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      {imm.provider && <span className="ml-1.5 text-muted-foreground/70">&middot; {imm.provider}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
