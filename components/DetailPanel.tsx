"use client";

import useSWR from "swr";
import type { DisasterEvent, NewsLink } from "@/lib/types";
import { DISASTER_TYPE_LABEL, DISASTER_TYPE_ICON, STATUS_LABEL } from "@/lib/labels";

type NewsResponse = { news: NewsLink[]; query: string | null; note?: string; error?: string };

async function fetchNews(url: string): Promise<NewsResponse> {
  const res = await fetch(url);
  return res.json();
}

function buildNewsUrl(event: DisasterEvent): string {
  const params = new URLSearchParams({ type: event.type });

  const raw = event.raw as Record<string, unknown>;
  if (event.type === "gempa" && typeof raw.wilayah === "string") {
    params.set("wilayah", raw.wilayah);
  }
  if (event.type === "gunungapi") {
    // MAGMA's MagmaVolcano uses `name`; the GVP fallback source uses `volcanoName`.
    const name = (typeof raw.name === "string" && raw.name) || (typeof raw.volcanoName === "string" && raw.volcanoName);
    if (name) params.set("volcanoName", name);
  }
  if (event.province) params.set("province", event.province);
  params.set("lat", String(event.lat));
  params.set("lon", String(event.lon));

  return `/api/news?${params.toString()}`;
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  aktif: "bg-red-900 text-red-200",
  mereda: "bg-amber-900 text-amber-200",
  selesai: "bg-neutral-800 text-neutral-400",
  "tidak-diketahui": "bg-neutral-800 text-neutral-500",
};

const SEVERITY_BADGE_CLASS: Record<number, string> = {
  1: "bg-emerald-950 text-emerald-300",
  2: "bg-yellow-950 text-yellow-300",
  3: "bg-orange-950 text-orange-300",
  4: "bg-red-950 text-red-300",
  5: "bg-red-950 text-red-200 ring-1 ring-red-700",
};

export default function DetailPanel({ event, onClose }: { event: DisasterEvent; onClose: () => void }) {
  const { data: newsData, isLoading: newsLoading } = useSWR(buildNewsUrl(event), fetchNews);

  return (
    <div className="panel-slide-in absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-96 bg-neutral-900 border-t sm:border-t-0 sm:border-l border-neutral-800 flex flex-col max-h-[70vh] sm:max-h-none shadow-2xl">
      <div className="flex items-start justify-between p-4 border-b border-neutral-800">
        <div>
          <h2 className="font-semibold text-lg leading-tight">{event.title}</h2>
          <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
            <span aria-hidden>{DISASTER_TYPE_ICON[event.type]}</span>
            {DISASTER_TYPE_LABEL[event.type]}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Tutup panel detail"
          className="text-neutral-500 hover:text-neutral-300 text-sm shrink-0 ml-2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-800 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="overflow-y-auto p-4 flex flex-col gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE_CLASS[event.status]}`}>
            {STATUS_LABEL[event.status]}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_BADGE_CLASS[event.severity]}`}>
            {event.severityLabel}
          </span>
        </div>

        <div>
          <div className="text-neutral-500 text-xs mb-1">Mengapa status ini?</div>
          <p className="text-neutral-200">{event.statusReason}</p>
        </div>

        <div className="text-xs text-neutral-500 flex flex-col gap-0.5">
          <span>Terjadi: {new Date(event.occurredAt).toLocaleString("id-ID")}</span>
          <span>Diperbarui: {new Date(event.lastUpdatedAt).toLocaleString("id-ID")}</span>
          {event.province && <span>Provinsi: {event.province}</span>}
        </div>

        <div className="text-xs text-neutral-500 border-t border-neutral-800 pt-3">
          Sumber:{" "}
          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
            {event.sourceName}
          </a>
        </div>

        <div className="border-t border-neutral-800 pt-3">
          <div className="text-neutral-300 font-medium mb-1">Berita terkait</div>
          <p className="text-neutral-500 text-xs mb-2">
            Laporan eksternal dari media, belum diverifikasi oleh dashboard ini.
          </p>

          {newsLoading && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-neutral-800 animate-pulse" />
              ))}
            </div>
          )}

          {!newsLoading && newsData?.news && newsData.news.length === 0 && (
            <p className="text-neutral-500 text-xs">
              {newsData.note ?? newsData.error ?? "Tidak ada berita terkait ditemukan."}
            </p>
          )}

          {!newsLoading && newsData?.news && newsData.news.length > 0 && (
            <ul className="flex flex-col gap-2">
              {newsData.news.map((link, i) => (
                <li key={i} className="text-xs">
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                    {link.title}
                  </a>
                  <div className="text-neutral-500">
                    {link.sourceName} - {new Date(link.publishedAt).toLocaleDateString("id-ID")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
