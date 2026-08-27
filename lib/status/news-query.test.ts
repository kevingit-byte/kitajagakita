import { describe, expect, it } from "vitest";
import { extractPlaceName, buildNewsQuery } from "./news-query";

describe("extractPlaceName", () => {
  it("strips the concatenated-direction gempaterkini style", () => {
    expect(extractPlaceName("41 km TimurLaut MBAY-NAGEKEO-NTT")).toBe("MBAY-NAGEKEO-NTT");
  });

  it("strips the spaced-direction autogempa/gempadirasakan style with the laut/darat prefix", () => {
    expect(extractPlaceName("Pusat gempa berada di laut 51 km timur laut Ruteng-Manggarai")).toBe(
      "Ruteng-Manggarai",
    );
  });

  it("does not double-strip a place name that itself contains a direction word", () => {
    // Maluku Barat Daya is a real province name, not "Barat Daya" repeated.
    expect(extractPlaceName("Pusat gempa berada di laut 168 km barat laut Maluku Barat Daya")).toBe(
      "Maluku Barat Daya",
    );
  });

  it("handles a single-word direction followed by a place containing that same word", () => {
    // Buru Selatan (South Buru Regency) - only the leading "Barat" is a direction.
    expect(extractPlaceName("Pusat gempa berada di laut 46 km Barat Buru Selatan")).toBe("Buru Selatan");
  });
});

describe("buildNewsQuery", () => {
  it("builds a gempa query from wilayah, matching the spec's example pattern", () => {
    expect(buildNewsQuery({ type: "gempa", wilayah: "41 km TimurLaut MBAY-NAGEKEO-NTT" })).toBe(
      "gempa MBAY-NAGEKEO-NTT",
    );
  });

  it("uses the volcano's own name for gunungapi, not a generic type+place query", () => {
    expect(buildNewsQuery({ type: "gunungapi", volcanoName: "Merapi" })).toBe("Merapi");
  });

  it("falls back to province when no wilayah is available", () => {
    expect(buildNewsQuery({ type: "banjir", province: "Demak" })).toBe("banjir Demak");
  });

  it("falls back to a reverse-geocoded place for karhutla, which has no natural place name", () => {
    expect(buildNewsQuery({ type: "karhutla", geocodedPlace: "Ketapang" })).toBe("karhutla Ketapang");
  });

  it("returns null when no place information exists at all", () => {
    expect(buildNewsQuery({ type: "lainnya" })).toBeNull();
  });
});
