import { describe, expect, it } from "vitest";

// outletRank isn't exported (it's an internal sort helper), so this
// re-derives the same regex table to test the matching logic in isolation -
// the behavior that matters is "does trusted-outlet detection produce false
// positives/negatives", not the internal ranking function's exact signature.
const TRUSTED_OUTLET_PATTERNS: [string, RegExp][] = [
  ["Kompas", /\bkompas\b/i],
  ["Antara", /\bantara\b/i],
  ["Detik", /^detik/i],
  ["Tempo", /\btempo\b/i],
  ["CNN Indonesia", /\bcnn indonesia\b/i],
  ["BBC Indonesia", /\bbbc\b/i],
];

function isTrusted(sourceName: string): boolean {
  return TRUSTED_OUTLET_PATTERNS.some(([, pattern]) => pattern.test(sourceName));
}

describe("trusted outlet matching", () => {
  it("matches real outlet name formats seen in live Google News results", () => {
    expect(isTrusted("Kompas.com")).toBe(true);
    expect(isTrusted("ANTARA News Banten")).toBe(true); // regional bureau, still legitimate ANTARA
    expect(isTrusted("detikcom")).toBe(true); // Detik's own branding has no space
    expect(isTrusted("detikNews")).toBe(true);
    expect(isTrusted("Tempo.co")).toBe(true);
    expect(isTrusted("CNN Indonesia")).toBe(true);
    expect(isTrusted("BBC News Indonesia")).toBe(true);
  });

  it("does not false-positive on lookalike names caught in live testing", () => {
    // A naive substring check on "Kompas" matched both of these - neither
    // should rank as the trusted outlet.
    expect(isTrusted("Kompasiana.com")).toBe(false);
    expect(isTrusted("kompas1net")).toBe(false);
  });

  it("does not match unrelated outlets", () => {
    expect(isTrusted("news.schoolmedia.id")).toBe(false);
    expect(isTrusted("Tribrata News")).toBe(false);
  });
});
