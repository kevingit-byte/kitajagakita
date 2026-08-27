import { describe, expect, it } from "vitest";
import { buildProvinceSummaries, buildTypeCounts } from "./national-overview";
import type { DisasterEvent } from "../types";

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
    intensitas: null,
    tindakan: "siaga",
    status: "aktif",
    statusReason: "test",
    raw: {},
    sourceName: "Test",
    sourceUrl: "https://example.com",
    ...overrides,
  };
}

describe("buildProvinceSummaries", () => {
  it("assigns an event to its nearest province and only includes provinces with events", () => {
    // Coordinates near the Ruteng cluster, which sits in NTT.
    const event = makeEvent({ lat: -8.28, lon: 120.6, status: "aktif", tindakan: "siaga" });
    const summaries = buildProvinceSummaries([event]);

    expect(summaries).toHaveLength(1);
    expect(summaries[0].province).toBe("Nusa Tenggara Timur");
    expect(summaries[0].totalEvents).toBe(1);
    expect(summaries[0].mostUrgentActiveTindakan).toBe("siaga");
  });

  it("only counts aktif events toward activeEvents and mostUrgentActiveTindakan", () => {
    const events = [
      makeEvent({ lat: -8.28, lon: 120.6, status: "selesai", tindakan: "awas" }),
      makeEvent({ lat: -8.28, lon: 120.6, status: "aktif", tindakan: "waspada" }),
    ];
    const summaries = buildProvinceSummaries(events);
    const ntt = summaries.find((s) => s.province === "Nusa Tenggara Timur")!;

    expect(ntt.totalEvents).toBe(2);
    expect(ntt.activeEvents).toBe(1);
    expect(ntt.mostUrgentActiveTindakan).toBe("waspada"); // not awas, since that one wasn't aktif
  });
});

describe("buildTypeCounts", () => {
  it("counts events per hazard type", () => {
    const events = [
      makeEvent({ type: "gempa" }),
      makeEvent({ type: "gempa" }),
      makeEvent({ type: "karhutla" }),
    ];
    expect(buildTypeCounts(events)).toEqual({ gempa: 2, karhutla: 1 });
  });
});
