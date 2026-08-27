import { describe, expect, it } from "vitest";
import { bmkgQuakeToSequencedEvent } from "./orchestrate-earthquakes";
import type { BmkgQuake } from "../sources/bmkg";

function makeQuake(overrides: Partial<BmkgQuake> = {}): BmkgQuake {
  return {
    id: "q1",
    magnitude: 5.0,
    dateTime: "2026-08-27T00:00:00Z",
    lat: -8.3,
    lon: 120.6,
    depthKm: 10,
    wilayah: "Ruteng-Manggarai",
    potensi: null,
    dirasakan: null,
    shakemap: null,
    ...overrides,
  };
}

describe("bmkgQuakeToSequencedEvent - intensitas/tindakan", () => {
  it("sets intensitas to null and regionIntensities to null when Dirasakan is empty - never estimates", () => {
    const event = bmkgQuakeToSequencedEvent(makeQuake({ dirasakan: null }), []);
    expect(event.intensitas).toBeNull();
    expect(event.regionIntensities).toBeNull();
  });

  it("falls back to a magnitude-based tindakan when there is no felt report", () => {
    const weak = bmkgQuakeToSequencedEvent(makeQuake({ magnitude: 3.0, dirasakan: null }), []);
    expect(weak.tindakan).toBe("normal");
    const strong = bmkgQuakeToSequencedEvent(makeQuake({ magnitude: 6.5, dirasakan: null }), []);
    expect(strong.tindakan).toBe("siaga");
  });

  it("parses per-region SIG-BMKG readings from Dirasakan and never collapses them to a single intensitas value", () => {
    const event = bmkgQuakeToSequencedEvent(
      makeQuake({ dirasakan: "III-IV Kab. Manggarai, II Kab. Ende" }),
      [],
    );
    expect(event.intensitas).toBeNull();
    expect(event.regionIntensities).toEqual([
      { wilayah: "Kab. Manggarai", sig: 2, sigLabel: "SIG II" },
      { wilayah: "Kab. Ende", sig: 1, sigLabel: "SIG I" },
    ]);
  });

  it("derives tindakan from the max SIG across regions when Dirasakan is present", () => {
    // Max SIG here is II (from the III-IV region) -> tindakan normal, even
    // though the raw magnitude alone would have implied "waspada".
    const event = bmkgQuakeToSequencedEvent(
      makeQuake({ magnitude: 5.5, dirasakan: "III-IV Kab. Manggarai" }),
      [],
    );
    expect(event.tindakan).toBe("normal");
  });

  it("reaches awas tindakan for a SIG V region", () => {
    const event = bmkgQuakeToSequencedEvent(makeQuake({ dirasakan: "IX Kota Palu" }), []);
    expect(event.tindakan).toBe("awas");
  });
});
