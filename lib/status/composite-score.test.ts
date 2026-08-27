import { describe, expect, it } from "vitest";
import { computeCompositeScore, summarizeNearbyEvents } from "./composite-score";
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

const JAKARTA = { lat: -6.2, lon: 106.8167 };

describe("computeCompositeScore", () => {
  it("is AMAN with no events nearby and no AQI data", () => {
    const result = computeCompositeScore(JAKARTA, [], null);
    expect(result.level).toBe("AMAN");
    expect(result.nearestActiveEvent).toBeNull();
    expect(result.factors).toHaveLength(4); // always shows the full breakdown
  });

  it("ignores non-aktif events entirely, even if severe and close", () => {
    const event = makeEvent({ lat: -6.21, lon: 106.82, tindakan: "awas", status: "selesai" });
    const result = computeCompositeScore(JAKARTA, [event], null);
    expect(result.level).toBe("AMAN");
    expect(result.nearestActiveEvent).toBeNull();
  });

  it("reaches BAHAYA from distance+tindakan alone on a very close, very severe active event", () => {
    // ~1km from Jakarta, tindakan awas, aktif, no AQI data, no other events.
    const event = makeEvent({ lat: -6.209, lon: 106.8167, tindakan: "awas", status: "aktif" });
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

describe("summarizeNearbyEvents", () => {
  it("groups nearby events from the last 7 days by type", () => {
    const now = new Date("2026-08-27T00:00:00Z");
    const events = [
      makeEvent({ type: "banjir", lat: -6.21, lon: 106.82, occurredAt: "2026-08-25T00:00:00Z" }),
      makeEvent({ type: "banjir", lat: -6.22, lon: 106.83, occurredAt: "2026-08-26T00:00:00Z" }),
      makeEvent({ type: "cuaca", lat: -6.19, lon: 106.81, occurredAt: "2026-08-24T00:00:00Z" }),
    ];
    const result = summarizeNearbyEvents(JAKARTA, events, now);
    expect(result).toEqual([
      { type: "banjir", count: 2 },
      { type: "cuaca", count: 1 },
    ]);
  });

  it("excludes events older than 7 days", () => {
    const now = new Date("2026-08-27T00:00:00Z");
    const oldEvent = makeEvent({ type: "banjir", lat: -6.21, lon: 106.82, occurredAt: "2026-08-01T00:00:00Z" });
    expect(summarizeNearbyEvents(JAKARTA, [oldEvent], now)).toEqual([]);
  });

  it("excludes events outside the 100km radius", () => {
    const now = new Date("2026-08-27T00:00:00Z");
    const farEvent = makeEvent({ type: "banjir", lat: 10, lon: 120, occurredAt: "2026-08-26T00:00:00Z" });
    expect(summarizeNearbyEvents(JAKARTA, [farEvent], now)).toEqual([]);
  });
});
