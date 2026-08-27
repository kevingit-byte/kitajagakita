import type { DisasterEvent, DisasterType, EventStatus, Severity } from "./types";

export type TimeRange = "24h" | "7d" | "30d";

export type EventFilters = {
  types: DisasterType[]; // empty = all types
  statuses: EventStatus[]; // empty = all statuses
  timeRange: TimeRange;
  minSeverity: Severity;
};

export const DEFAULT_FILTERS: EventFilters = {
  types: [],
  statuses: [],
  timeRange: "7d",
  minSeverity: 1,
};

const TIME_RANGE_MS: Record<TimeRange, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function filterEvents(events: DisasterEvent[], filters: EventFilters, now: Date = new Date()): DisasterEvent[] {
  const cutoff = now.getTime() - TIME_RANGE_MS[filters.timeRange];

  return events.filter((event) => {
    if (filters.types.length > 0 && !filters.types.includes(event.type)) return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(event.status)) return false;
    if (event.severity < filters.minSeverity) return false;

    const occurredMs = new Date(event.occurredAt).getTime();
    if (Number.isFinite(occurredMs) && occurredMs < cutoff) return false;

    return true;
  });
}
