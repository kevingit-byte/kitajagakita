"use client";

import useSWR from "swr";
import type { DisasterEvent } from "../types";

type SourceResponse = {
  events: DisasterEvent[];
  error?: string;
  warning?: string;
};

async function fetchSource(url: string): Promise<SourceResponse> {
  const res = await fetch(url);
  const data = (await res.json()) as SourceResponse;
  // Routes return 200 with events:[] plus an `error` field on partial
  // failure, and non-2xx with the same shape on total failure - either way
  // `events` is always an array, so the UI never has to special-case this.
  return data;
}

/**
 * Poll intervals mirror each route's own `revalidate` window (gempa 2min,
 * karhutla 15min, gunungapi 30min, lainnya 30min) - polling faster than the
 * server-side cache refreshes would just re-fetch the same cached response.
 */
const SOURCES = [
  { key: "gempa", url: "/api/gempa", intervalMs: 2 * 60 * 1000 },
  { key: "karhutla", url: "/api/karhutla", intervalMs: 15 * 60 * 1000 },
  { key: "gunungapi", url: "/api/gunungapi", intervalMs: 30 * 60 * 1000 },
  { key: "lainnya", url: "/api/lainnya", intervalMs: 30 * 60 * 1000 },
] as const;

export type SourceStatus = {
  key: string;
  label: string;
  ok: boolean;
  error?: string;
  loading: boolean;
};

const SOURCE_LABELS: Record<string, string> = {
  gempa: "BMKG (gempa)",
  karhutla: "NASA FIRMS (karhutla)",
  gunungapi: "MAGMA ESDM (gunung api)",
  lainnya: "GDACS/ReliefWeb (lainnya)",
};

export function useDisasterEvents(): {
  events: DisasterEvent[];
  isLoading: boolean;
  sourceStatuses: SourceStatus[];
} {
  // Hooks must run unconditionally in the same order every render, so each
  // of the 4 sources gets its own useSWR call rather than a dynamic loop.
  const gempa = useSWR(SOURCES[0].url, fetchSource, { refreshInterval: SOURCES[0].intervalMs });
  const karhutla = useSWR(SOURCES[1].url, fetchSource, { refreshInterval: SOURCES[1].intervalMs });
  const gunungapi = useSWR(SOURCES[2].url, fetchSource, { refreshInterval: SOURCES[2].intervalMs });
  const lainnya = useSWR(SOURCES[3].url, fetchSource, { refreshInterval: SOURCES[3].intervalMs });

  const results = [
    { key: "gempa", swr: gempa },
    { key: "karhutla", swr: karhutla },
    { key: "gunungapi", swr: gunungapi },
    { key: "lainnya", swr: lainnya },
  ];

  const events = results.flatMap((r) => r.swr.data?.events ?? []);
  const isLoading = results.every((r) => r.swr.isLoading);

  const sourceStatuses: SourceStatus[] = results.map((r) => ({
    key: r.key,
    label: SOURCE_LABELS[r.key],
    ok: !r.swr.error && !r.swr.data?.error,
    error: r.swr.error ? String(r.swr.error) : r.swr.data?.error,
    loading: r.swr.isLoading,
  }));

  return { events, isLoading, sourceStatuses };
}
