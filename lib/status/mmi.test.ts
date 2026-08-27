import { describe, expect, it } from "vitest";
import { parseRegionSig, sigFromMmi } from "./mmi";

describe("sigFromMmi", () => {
  it("maps MMI I-II to SIG I", () => {
    expect(sigFromMmi(1)).toBe(1);
    expect(sigFromMmi(2)).toBe(1);
  });
  it("maps MMI III-IV to SIG II", () => {
    expect(sigFromMmi(3)).toBe(2);
    expect(sigFromMmi(4)).toBe(2);
  });
  it("maps MMI V-VI to SIG III", () => {
    expect(sigFromMmi(5)).toBe(3);
    expect(sigFromMmi(6)).toBe(3);
  });
  it("maps MMI VII-VIII to SIG IV", () => {
    expect(sigFromMmi(7)).toBe(4);
    expect(sigFromMmi(8)).toBe(4);
  });
  it("maps MMI IX-XII to SIG V", () => {
    expect(sigFromMmi(9)).toBe(5);
    expect(sigFromMmi(12)).toBe(5);
  });
});

describe("parseRegionSig", () => {
  it("returns null when Dirasakan is empty - never estimates", () => {
    expect(parseRegionSig(null)).toBeNull();
    expect(parseRegionSig(undefined)).toBeNull();
    expect(parseRegionSig("")).toBeNull();
  });

  it("parses a single region with a single MMI value", () => {
    expect(parseRegionSig("III Sigi")).toEqual([{ wilayah: "Sigi", sig: 2, sigLabel: "SIG II" }]);
  });

  it("parses a single region with an MMI range, using the upper bound", () => {
    expect(parseRegionSig("II-III Kab. Manggarai")).toEqual([
      { wilayah: "Kab. Manggarai", sig: 2, sigLabel: "SIG II" },
    ]);
  });

  it("parses multiple comma-separated regions independently, real BMKG sample", () => {
    // Real Dirasakan text from docs/samples/bmkg-gempadirasakan.json - one
    // earthquake felt at different intensities in neighboring kabupaten.
    const result = parseRegionSig(
      "III-IV Kab. Manggarai, III Kab. Manggarai Timur, III Kab. Ngada, III Kab. Nagekeo, II Kab. Ende, II Kab. Sumba Timur",
    );
    expect(result).toEqual([
      { wilayah: "Kab. Manggarai", sig: 2, sigLabel: "SIG II" },
      { wilayah: "Kab. Manggarai Timur", sig: 2, sigLabel: "SIG II" },
      { wilayah: "Kab. Ngada", sig: 2, sigLabel: "SIG II" },
      { wilayah: "Kab. Nagekeo", sig: 2, sigLabel: "SIG II" },
      { wilayah: "Kab. Ende", sig: 1, sigLabel: "SIG I" },
      { wilayah: "Kab. Sumba Timur", sig: 1, sigLabel: "SIG I" },
    ]);
  });
});
