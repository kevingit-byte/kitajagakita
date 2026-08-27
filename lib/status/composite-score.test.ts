import { describe, expect, it } from "vitest";
import { computeCompositeScore } from "./composite-score";
import type { DisasterEvent } from "../types";

function makeEvent(overrides: Partial<DisasterEvent>): DisasterEvent {
  return {
    id: "test",
    type: "gempa",
    title: "Test Event",
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

const JAKARTA = { lat: -6.2, lon: 106.8167 };

describe("computeCompositeScore", () => {
  it("is AMAN with no events nearby and no AQI data", () => {
    const result = computeCompositeScore(JAKARTA, [], null);
    expect(result.level).toBe("AMAN");
    expect(result.nearestActiveEvent).toBeNull();
    expect(result.factors).toHaveLength(4); // always shows the full breakdown
  });

  it("ignores non-aktif events entirely, even if severe and close", () => {
    const event = makeEvent({ lat: -6.21, lon: 106.82, severity: 5, status: "selesai" });
    const result = computeCompositeScore(JAKARTA, [event], null);
    expect(result.level).toBe("AMAN");
    expect(result.nearestActiveEvent).toBeNull();
  });

  it("reaches BAHAYA from distance+severity alone on a very close, very severe active event", () => {
    // ~1km from Jakarta, severity 5, aktif, no AQI data, no other events.
    const event = makeEvent({ lat: -6.209, lon: 106.8167, severity: 5, severityLabel: "Kritis", status: "aktif" });
    const result = computeCompositeScore(JAKARTA, [event], null);
    expect(result.level).toBe("BAHAYA");
    expect(result.nearestActiveDistanceKm).toBeLessThan(5);
  });

  it("is WASPADA from hazardous AQI alone, with no nearby events", () => {
    const result = computeCompositeScore(JAKARTA, [], 350); // hazardous
    expect(result.level).toBe("WASPADA");
  });

  it("counts only active events within 100km toward the count factor", () => {
    const near = makeEvent({ id: "near", lat: -6.3, lon: 106.9, status: "aktif" }); // well within 100km
    const far = makeEvent({ id: "far", lat: 10, lon: 120, status: "aktif" }); // far away
    const result = computeCompositeScore(JAKARTA, [near, far], null);
    expect(result.activeEventsWithin100km).toBe(1);
  });

  it("always returns a full factor breakdown, never a bare score", () => {
    const result = computeCompositeScore(JAKARTA, [], 120);
    expect(result.factors.every((f) => f.label && f.detail)).toBe(true);
  });
});
