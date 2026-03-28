"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SectionWrapper } from "@/components/section-wrapper";

export function InfoSection() {
  return (
    <SectionWrapper id="info" title="Info">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground">About This Dashboard</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This is a personal health dashboard that aggregates data from multiple sources into a single view.
            Inspired by the quantified self movement, it tracks sleep, heart rate variability, fitness, lab results,
            and more — all in one place.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-4">Data Sources</h4>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
            <li><span className="text-foreground font-medium">Oura Ring</span> — Sleep, HRV, resting heart rate, readiness, activity</li>
            <li><span className="text-foreground font-medium">Garmin</span> — Running and fitness activities</li>
            <li><span className="text-foreground font-medium">Blood Work</span> — Lab results from periodic blood panels</li>
          </ul>

          <h4 className="text-sm font-semibold text-foreground mt-4">Tech Stack</h4>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>Next.js + React + TypeScript</li>
            <li>Tailwind CSS + Radix UI</li>
            <li>Recharts for data visualization</li>
            <li>Claude API for AI health insights</li>
            <li>Deployed on Vercel</li>
          </ul>

          <div className="pt-4 border-t border-border">
            <p className="text-[11px] text-muted-foreground">
              This dashboard is for personal health tracking purposes only and is not medical advice.
              Always consult with healthcare professionals for medical decisions.
            </p>
          </div>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
