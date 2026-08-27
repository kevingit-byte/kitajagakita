"use client";

import type { DisasterEvent } from "@/lib/types";
import { DISASTER_TYPE_LABEL, DISASTER_TYPE_ICON } from "@/lib/labels";
import { levelFromTindakan } from "@/lib/human-severity";
import { formatRelativeTime, shortPlaceName, keyStatLine } from "@/lib/format";

export default function EventCard({ event, onSelect }: { event: DisasterEvent; onSelect: (event: DisasterEvent) => void }) {
  const level = levelFromTindakan(event.tindakan, event.status);
  const place = shortPlaceName(event);

  return (
    <button
      onClick={() => onSelect(event)}
      className="w-full text-left p-3 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span aria-hidden>{level.icon}</span>
          <span className="font-medium text-sm truncate">
            {DISASTER_TYPE_LABEL[event.type]} — {place}
          </span>
        </div>
        <span aria-hidden className="text-lg shrink-0">
          {DISASTER_TYPE_ICON[event.type]}
        </span>
      </div>

      <div className="text-xs text-neutral-400 mt-1">
        {keyStatLine(event)} · 🕐 {formatRelativeTime(event.occurredAt)}
      </div>

      <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2">{event.statusReason}</p>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-neutral-600">Sumber: {event.sourceName}</span>
        <span className="text-[11px] text-blue-400">Lihat detail →</span>
      </div>
    </button>
  );
}
