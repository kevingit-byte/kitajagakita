import type { SourceStatus } from "@/lib/hooks/useDisasterEvents";

export default function SourceStatusNotice({ sourceStatuses }: { sourceStatuses: SourceStatus[] }) {
  const failing = sourceStatuses.filter((s) => !s.loading && !s.ok);
  if (failing.length === 0) return null;

  return (
    <div className="px-3 py-1.5 bg-red-950 border-b border-red-900 text-[11px] sm:text-xs text-red-200">
      {failing.map((s) => (
        <div key={s.key} className="flex items-center gap-1.5">
          <span aria-hidden>⚠️</span>
          Data {s.label} tidak tersedia saat ini.
        </div>
      ))}
    </div>
  );
}
