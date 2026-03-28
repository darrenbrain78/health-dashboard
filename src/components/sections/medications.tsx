"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SectionWrapper } from "@/components/section-wrapper";
import { Pill } from "lucide-react";
import type { Medication } from "@/types/health";

interface MedicationsSectionProps {
  data: Medication[];
}

export function MedicationsSection({ data }: MedicationsSectionProps) {
  return (
    <SectionWrapper id="medications" title="Medications">
      <Card>
        <CardContent className="p-4">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Pill className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No current medications</p>
              <p className="text-xs text-muted-foreground/60 mt-1">No prescriptions on file</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((med, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-blue-500/10">
                    <Pill className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{med.name}</div>
                    <div className="text-[11px] text-muted-foreground">{med.dosage} &middot; {med.frequency}</div>
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
