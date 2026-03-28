"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SectionWrapper } from "@/components/section-wrapper";
import {
  User,
  Calendar,
  Ruler,
  Weight,
  Droplets,
  Heart,
  Wind,
} from "lucide-react";
import type { PatientInfo } from "@/types/health";

interface PatientInfoSectionProps {
  data: PatientInfo;
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

interface VitalProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}

function VitalCard({ icon, label, value, color = "text-foreground" }: VitalProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-secondary/80">{icon}</div>
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        <div className={`text-sm font-semibold ${color}`}>{value}</div>
      </div>
    </div>
  );
}

export function PatientInfoSection({ data }: PatientInfoSectionProps) {
  const age = calculateAge(data.dob);

  return (
    <SectionWrapper id="patient-info" title="Patient Info">
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            <VitalCard
              icon={<User className="w-4 h-4 text-blue-400" />}
              label="Name"
              value={data.name}
            />
            <VitalCard
              icon={<Calendar className="w-4 h-4 text-purple-400" />}
              label="Age"
              value={`${age} years`}
            />
            <VitalCard
              icon={<Ruler className="w-4 h-4 text-cyan-400" />}
              label="Height"
              value={`${data.heightCm} cm`}
            />
            <VitalCard
              icon={<Weight className="w-4 h-4 text-amber-400" />}
              label="Weight"
              value={`${data.weightKg} kg`}
            />
            <VitalCard
              icon={<Droplets className="w-4 h-4 text-red-400" />}
              label="Blood Type"
              value={data.bloodType}
            />
            <VitalCard
              icon={<Heart className="w-4 h-4 text-rose-400" />}
              label="Blood Pressure"
              value={data.latestBp}
              color="text-emerald-400"
            />
            <VitalCard
              icon={<Wind className="w-4 h-4 text-teal-400" />}
              label="SpO2"
              value={`${data.spo2}%`}
              color="text-emerald-400"
            />
          </div>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
