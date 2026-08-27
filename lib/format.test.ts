import { describe, expect, it } from "vitest";
import { formatRelativeTime, shortPlaceName, keyStatLine, intensitasLines, regionIntensityForLocation } from "./format";
import type { DisasterEvent } from "./types";

const NOW = new Date("2026-08-27T12:00:00Z");

describe("formatRelativeTime", () => {
  it("formats minutes, hours, and days correctly", () => {
    expect(formatRelativeTime("2026-08-27T11:59:55Z", NOW)).toBe("Baru saja");
    expect(formatRelativeTime("2026-08-27T11:30:00Z", NOW)).toBe("30 menit yang lalu");
    expect(formatRelativeTime("2026-08-27T09:00:00Z", NOW)).toBe("3 jam yang lalu");
    expect(formatRelativeTime("2026-08-25T12:00:00Z", NOW)).toBe("2 hari yang lalu");
  });
});

function makeEvent(overrides: Partial<DisasterEvent>): DisasterEvent {
  return {
    id: "test",
    type: "gempa",
    title: "Test",
    lat: -8.28,
    lon: 120.6,
    province: null,
    occurredAt: NOW.toISOString(),
    lastUpdatedAt: NOW.toISOString(),
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

describe("shortPlaceName", () => {
  it("extracts a clean place name from a gempa event's wilayah", () => {
    const event = makeEvent({ type: "gempa", raw: { wilayah: "41 km TimurLaut MBAY-NAGEKEO-NTT" } });
    expect(shortPlaceName(event)).toBe("MBAY-NAGEKEO-NTT");
  });

  it("uses the volcano name directly for gunungapi", () => {
    const event = makeEvent({ type: "gunungapi", raw: { name: "Semeru" } });
    expect(shortPlaceName(event)).toBe("Semeru");
  });

  it("falls back to province when available", () => {
    const event = makeEvent({ type: "banjir", province: "Demak" });
    expect(shortPlaceName(event)).toBe("Demak");
  });

  it("falls back to coordinates as a last resort", () => {
    const event = makeEvent({ type: "karhutla", province: null, lat: -2.2, lon: 113.9 });
    expect(shortPlaceName(event)).toBe("-2.20, 113.90");
  });
});

describe("keyStatLine", () => {
  it("shows magnitude for gempa", () => {
    expect(keyStatLine(makeEvent({ type: "gempa", raw: { magnitude: 5.7 } }))).toBe("M 5,7");
  });

  it("shows hotspot count for karhutla", () => {
    expect(keyStatLine(makeEvent({ type: "karhutla", raw: { pointCount: 12 } }))).toBe("12 titik panas terdeteksi");
  });

  it("shows level for gunungapi", () => {
    expect(keyStatLine(makeEvent({ type: "gunungapi", raw: { level: "III" } }))).toBe("Level III");
  });

  it("falls back to intensitas for other types", () => {
    expect(keyStatLine(makeEvent({ type: "lainnya", intensitas: "Tingkat peringatan Orange (GDACS)" }))).toBe(
      "Tingkat peringatan Orange (GDACS)",
    );
  });

  it("falls back to a no-report message when intensitas is null", () => {
    expect(keyStatLine(makeEvent({ type: "lainnya", intensitas: null }))).toBe("Belum ada laporan");
  });
});

describe("intensitasLines", () => {
  it("shows 'Belum ada laporan dirasakan' for a gempa with no regionIntensities", () => {
    expect(intensitasLines(makeEvent({ type: "gempa", regionIntensities: null }))).toEqual([
      "Belum ada laporan dirasakan",
    ]);
  });

  it("lists every region's SIG-BMKG reading for a gempa, naming the scale and source", () => {
    const event = makeEvent({
      type: "gempa",
      regionIntensities: [
        { wilayah: "Kab. Manggarai", sig: 2, sigLabel: "SIG II" },
        { wilayah: "Kab. Ende", sig: 1, sigLabel: "SIG I" },
      ],
    });
    expect(intensitasLines(event)).toEqual(["Kab. Manggarai: SIG II (BMKG)", "Kab. Ende: SIG I (BMKG)"]);
  });

  it("shows the plain intensitas string for non-gempa types", () => {
    expect(intensitasLines(makeEvent({ type: "gunungapi", intensitas: "Level III (Siaga) (PVMBG)" }))).toEqual([
      "Level III (Siaga) (PVMBG)",
    ]);
  });
});

describe("regionIntensityForLocation", () => {
  const event = makeEvent({
    type: "gempa",
    regionIntensities: [
      { wilayah: "Kab. Manggarai", sig: 2, sigLabel: "SIG II" },
      { wilayah: "Nagekeo", sig: 3, sigLabel: "SIG III" },
    ],
  });

  it("matches a region name ignoring the 'Kab.' prefix and case", () => {
    expect(regionIntensityForLocation(event, "manggarai")?.sigLabel).toBe("SIG II");
  });

  it("matches a plain region name against a bare Dirasakan entry", () => {
    expect(regionIntensityForLocation(event, "Nagekeo")?.sigLabel).toBe("SIG III");
  });

  it("returns null when no region matches - never falls back to the max", () => {
    expect(regionIntensityForLocation(event, "Jakarta")).toBeNull();
  });

  it("returns null when the event has no regionIntensities at all", () => {
    expect(regionIntensityForLocation(makeEvent({ type: "gempa", regionIntensities: null }), "Manggarai")).toBeNull();
  });
});
