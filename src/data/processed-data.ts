import type { HealthData } from "@/types/health";
import data from "./health-data.json";

export const healthData: HealthData = data as unknown as HealthData;
