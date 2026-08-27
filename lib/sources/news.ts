import { XMLParser } from "fast-xml-parser";
import type { NewsLink } from "../types";

const BASE_URL = "https://news.google.com/rss/search";

// Ranked ahead of other outlets in the results; matched against the source
// name Google News appends to each title (e.g. "... - Kompas.com").
const TRUSTED_OUTLETS = ["Kompas", "Antara", "Detik", "Tempo", "CNN Indonesia", "BBC Indonesia"];

type NewsItem = { title: string; link: string; pubDate: string };

function parseTitleAndSource(rawTitle: string): { title: string; sourceName: string } {
  // Google News RSS titles end with " - <Outlet Name>" (confirmed in Phase
  // 0 sample); the article's real URL is not in a separate field, and
  // <link> is a Google redirect - fine to surface directly, no need to
  // resolve it server-side since the user just clicks through.
  const lastDash = rawTitle.lastIndexOf(" - ");
  if (lastDash === -1) return { title: rawTitle, sourceName: "Tidak diketahui" };
  return {
    title: rawTitle.slice(0, lastDash),
    sourceName: rawTitle.slice(lastDash + 3),
  };
}

function outletRank(sourceName: string): number {
  const index = TRUSTED_OUTLETS.findIndex((outlet) =>
    sourceName.toLowerCase().includes(outlet.toLowerCase()),
  );
  return index === -1 ? TRUSTED_OUTLETS.length : index;
}

export async function fetchNewsForQuery(query: string, maxResults = 5): Promise<NewsLink[]> {
  const params = new URLSearchParams({
    q: `${query} when:7d`,
    hl: "id",
    gl: "ID",
    ceid: "ID:id",
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`, { next: { revalidate: 1800 } });
  if (!res.ok) {
    throw new Error(`Google News RSS returned HTTP ${res.status}`);
  }

  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item;
  const itemList: NewsItem[] = Array.isArray(items) ? items : items ? [items] : [];

  const links: NewsLink[] = itemList.map((item) => {
    const { title, sourceName } = parseTitleAndSource(String(item.title));
    return {
      title,
      sourceName,
      url: String(item.link),
      publishedAt: String(item.pubDate),
    };
  });

  return links.sort((a, b) => outletRank(a.sourceName) - outletRank(b.sourceName)).slice(0, maxResults);
}
