"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { DashboardSection } from "@/components/sections/dashboard";
import { PatientInfoSection } from "@/components/sections/patient-info";
import { LabResultsSection } from "@/components/sections/lab-results";
import { HealthMetricsSection } from "@/components/sections/health-metrics";
import { BodyCompositionSection } from "@/components/sections/body-composition";
import { ConditionsSection } from "@/components/sections/conditions";
import { MedicationsSection } from "@/components/sections/medications";
import { ImmunizationsSection } from "@/components/sections/immunizations";
import { SupplementsSection } from "@/components/sections/supplements";
import { FitnessSection } from "@/components/sections/fitness";
import { SleepSection } from "@/components/sections/sleep";
import { HealthTimelineSection } from "@/components/sections/health-timeline";
import { ChatSection } from "@/components/sections/chat";
import { InfoSection } from "@/components/sections/info";
import { healthData as realHealthData } from "@/data/processed-data";

const sectionIds = [
  "dashboard",
  "info",
  "lab-results",
  "health-metrics",
  "sleep",
  "running",
  "conditions",
  "medications",
  "immunizations",
  "body-composition",
  "supplements",
  "health-timeline",
  "chat",
];

export default function Home() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const handleScroll = useCallback(() => {
    const scrollPos = window.scrollY + 100;
    for (let i = sectionIds.length - 1; i >= 0; i--) {
      const el = document.getElementById(sectionIds[i]);
      if (el && el.offsetTop <= scrollPos) {
        setActiveSection(sectionIds[i]);
        break;
      }
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const data = realHealthData;

  return (
    <>
      <Sidebar activeSection={activeSection} />
      <main className="main-content">
        <div className="max-w-5xl mx-auto space-y-12">
          <DashboardSection data={data} />
          <PatientInfoSection data={data.patientInfo} />
          <LabResultsSection data={data.labResults} />
          <HealthMetricsSection data={data} />
          <SleepSection data={data} />
          <FitnessSection data={data.runActivities} workouts={data.workoutActivities} />
          <ConditionsSection data={data.conditions} />
          <MedicationsSection data={data.medications} />
          <ImmunizationsSection data={data.immunizations} />
          <BodyCompositionSection data={data.bodyComposition} />
          <SupplementsSection data={data.supplements} />
          <HealthTimelineSection data={data.timelineEvents} />
          <ChatSection />
          <InfoSection />
        </div>
      </main>
    </>
  );
}
