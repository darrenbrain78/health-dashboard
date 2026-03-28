"use client";

import { useState, useEffect } from "react";
import { getHAConfig, isHAAvailable } from "@/lib/ha-config";

export interface SensorValue {
  entityId: string;
  state: string;
  unit: string;
  friendlyName: string;
  lastUpdated: string;
}

export async function fetchSensors(
  entityIds: string[]
): Promise<Map<string, SensorValue>> {
  const result = new Map<string, SensorValue>();

  if (!isHAAvailable()) return result;

  const { url, token } = getHAConfig({ useProxy: true });
  if (!token) return result;

  try {
    const base = url || "";
    const res = await fetch(`${base}/api/states`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return result;

    const states = (await res.json()) as Array<{
      entity_id: string;
      state: string;
      attributes: Record<string, unknown>;
      last_updated: string;
    }>;

    const idSet = new Set(entityIds);

    for (const entity of states) {
      if (
        idSet.has(entity.entity_id) &&
        entity.state !== "unavailable" &&
        entity.state !== "unknown"
      ) {
        result.set(entity.entity_id, {
          entityId: entity.entity_id,
          state: entity.state,
          unit: (entity.attributes.unit_of_measurement as string) ?? "",
          friendlyName: (entity.attributes.friendly_name as string) ?? entity.entity_id,
          lastUpdated: entity.last_updated,
        });
      }
    }
  } catch {
    // HA not reachable
  }

  return result;
}

export function useLiveSensors(entityIds: string[]): {
  sensors: Map<string, SensorValue>;
  loading: boolean;
} {
  const [sensors, setSensors] = useState<Map<string, SensorValue>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchSensors(entityIds).then((data) => {
      if (!cancelled) {
        setSensors(data);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { sensors, loading };
}
