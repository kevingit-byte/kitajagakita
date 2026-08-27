import { describe, expect, it } from "vitest";
import { filterEvents, DEFAULT_FILTERS } from "./filters";
import type { DisasterEvent } from "./types";

function makeEvent(overrides: Partial<DisasterEvent>): DisasterEvent {
  return {
    id: "test",
    type: "gempa",
    title: "Test",
    lat: 0,
    lon: 0,
    province: null,
    occurredAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    severity: 3,
    severityLabel: "Berat",
    status: "aktif",
    statusReason: "test",
    raw: {},
    sourceName: "Test",
    sourceUrl: "https://example.com",
    ...overrides,
  };
}

describe("filterEvents - timeRange", () => {
  // Local noon on 27 Aug 2026.
  const NOW = new Date(2026, 7, 27, 12, 0, 0);

  it("'today' only includes events since local midnight, not a rolling 24h window", () => {
    const earlyToday = makeEvent({ occurredAt: new Date(2026, 7, 27, 1, 0, 0).toISOString() }); // 1am today
    const lateYesterday = makeEvent({ id: "y", occurredAt: new Date(2026, 7, 26, 20, 0, 0).toISOString() }); // 8pm yesterday, <24h ago

    const result = filterEvents([earlyToday, lateYesterday], { ...DEFAULT_FILTERS, timeRange: "today" }, NOW);
    expect(result.map((e) => e.id)).toEqual(["test"]);
  });

  it("'3d' includes events from the last 3 days", () => {
    const within = makeEvent({ occurredAt: new Date(2026, 7, 25, 0, 0, 0).toISOString() });
    const outside = makeEvent({ id: "old", occurredAt: new Date(2026, 7, 20, 0, 0, 0).toISOString() });

    const result = filterEvents([within, outside], { ...DEFAULT_FILTERS, timeRange: "3d" }, NOW);
    expect(result.map((e) => e.id)).toEqual(["test"]);
  });
});
