import { describe, expect, it } from "vitest";
import { passesConfidenceFilter, type FirmsRow } from "./firms";

function makeRow(confidence: string): FirmsRow {
  return {
    latitude: "0",
    longitude: "0",
    confidence,
    acq_date: "2026-08-27",
    acq_time: "0000",
    frp: "1",
    satellite: "N20",
    daynight: "D",
  };
}

describe("passesConfidenceFilter", () => {
  it("VIIRS: rejects 'l' (low), keeps 'n' (nominal) and 'h' (high)", () => {
    expect(passesConfidenceFilter(makeRow("l"), "VIIRS_NOAA20_NRT")).toBe(false);
    expect(passesConfidenceFilter(makeRow("n"), "VIIRS_NOAA20_NRT")).toBe(true);
    expect(passesConfidenceFilter(makeRow("h"), "VIIRS_NOAA20_NRT")).toBe(true);
    expect(passesConfidenceFilter(makeRow("l"), "VIIRS_SNPP_NRT")).toBe(false);
  });

  it("MODIS: uses the numeric 0-100 scale with a >=80 threshold (SiPongi practice), not the VIIRS letters", () => {
    expect(passesConfidenceFilter(makeRow("79"), "MODIS_NRT")).toBe(false);
    expect(passesConfidenceFilter(makeRow("80"), "MODIS_NRT")).toBe(true);
    expect(passesConfidenceFilter(makeRow("100"), "MODIS_NRT")).toBe(true);
  });
});
