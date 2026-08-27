import * as cheerio from "cheerio";
import { findVolcanoCoordinates } from "../data/volcano-lookup";
import type { DisasterEvent } from "../types";
import { classifyVolcanoStatus, VOLCANO_LEVEL_LABEL, type VolcanoLevel } from "../status/volcano";

export type { VolcanoLevel };

const TINGKAT_AKTIVITAS_URL = "https://magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas";
const USER_AGENT = "Mozilla/5.0 (compatible; KitaJagaKita/0.1; +https://github.com/kevingit-byte/kitajagakita)";

export type MagmaVolcano = {
  name: string;
  province: string;
  level: VolcanoLevel;
  lat: number | null;
  lon: number | null;
};

const LEVEL_PATTERN: [RegExp, VolcanoLevel][] = [
  [/level\s*iv/i, "IV"],
  [/level\s*iii/i, "III"],
  [/level\s*ii/i, "II"],
  [/level\s*i\b/i, "I"],
];

function parseLevelHeading(text: string): VolcanoLevel | null {
  for (const [pattern, level] of LEVEL_PATTERN) {
    if (pattern.test(text)) return level;
  }
  return null;
}

/**
 * MAGMA ESDM has no JSON API for this data (confirmed in Phase 0: the
 * spec'd `laporan` endpoint renders no table at all; `tingkat-aktivitas` is
 * a real server-rendered HTML table, grouped by alert level via rowspan).
 * This is the one file that knows that table's structure - keep it isolated
 * so a MAGMA markup change only breaks this file, and fails gracefully
 * (returns []) rather than taking down the whole gunungapi route.
 */
export async function fetchMagmaVolcanoes(): Promise<MagmaVolcano[]> {
  const res = await fetch(TINGKAT_AKTIVITAS_URL, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 1800 },
  });
  if (!res.ok) {
    throw new Error(`MAGMA ESDM returned HTTP ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const table = $("table").first();
  if (table.length === 0) {
    throw new Error("MAGMA ESDM tingkat-aktivitas page has no <table> - markup may have changed");
  }

  const volcanoes: MagmaVolcano[] = [];
  let currentLevel: VolcanoLevel | null = null;

  table.find("tbody > tr").each((_, row) => {
    const $row = $(row);
    const levelHeading = $row.find("a.tx-inverse").first().text().trim();
    if (levelHeading) {
      currentLevel = parseLevelHeading(levelHeading);
    }

    // Volcano rows are the sibling <tr>s that follow a level-heading row
    // within the same rowspan group; they contain "Name - Province" text.
    const cellText = $row.find("td").last().text().trim();
    // Split on " - " (space-hyphen-space) specifically, not any hyphen: some
    // volcano names contain their own internal hyphen (e.g. "Lewotobi
    // Laki-laki"), which a bare `-` split breaks apart. Confirmed against
    // the real sample in docs/samples/magma-tingkat-aktivitas.html.
    const nameProvinceMatch = cellText.match(/^(.+?)\s+-\s+(.+?)(?:\s*Lihat laporan)?$/s);
    if (currentLevel && nameProvinceMatch && !levelHeading) {
      const name = nameProvinceMatch[1].trim();
      const province = nameProvinceMatch[2].replace(/\s+/g, " ").trim();
      const coords = findVolcanoCoordinates(name);
      volcanoes.push({
        name,
        province,
        level: currentLevel,
        lat: coords?.lat ?? null,
        lon: coords?.lon ?? null,
      });
    }
  });

  return volcanoes;
}

export function magmaVolcanoToEvent(volcano: MagmaVolcano): DisasterEvent | null {
  if (volcano.lat === null || volcano.lon === null) return null;

  const { status, statusReason, intensitas, tindakan } = classifyVolcanoStatus(volcano.level);
  return {
    id: `magma-${volcano.name.toLowerCase().replace(/\s+/g, "-")}`,
    type: "gunungapi",
    title: `${volcano.name} - ${VOLCANO_LEVEL_LABEL[volcano.level]}`,
    lat: volcano.lat,
    lon: volcano.lon,
    province: volcano.province,
    occurredAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    intensitas,
    tindakan,
    status,
    statusReason,
    raw: volcano,
    sourceName: "MAGMA ESDM (PVMBG)",
    sourceUrl: TINGKAT_AKTIVITAS_URL,
  };
}
