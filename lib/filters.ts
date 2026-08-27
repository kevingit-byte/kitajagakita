import type { DisasterEvent, DisasterType, EventStatus, Severity } from "./types";

export type TimeRange = "today" | "3d" | "7d" | "30d";

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

/** "today" is the start of the current calendar day (local time), not a rolling 24h window. */
function cutoffForRange(range: TimeRange, now: Date): number {
  if (range === "today") {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay.getTime();
  }
  const days = { "3d": 3, "7d": 7, "30d": 30 }[range];
  return now.getTime() - days * 24 * 60 * 60 * 1000;
}

export function filterEvents(events: DisasterEvent[], filters: EventFilters, now: Date = new Date()): DisasterEvent[] {
  const cutoff = cutoffForRange(filters.timeRange, now);

  return events.filter((event) => {
    if (filters.types.length > 0 && !filters.types.includes(event.type)) return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(event.status)) return false;
    if (event.severity < filters.minSeverity) return false;

    const occurredMs = new Date(event.occurredAt).getTime();
    if (Number.isFinite(occurredMs) && occurredMs < cutoff) return false;

    return true;
  });
}
