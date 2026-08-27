"use client";

export type AppView = "beranda" | "sekitar" | "peta" | "indonesia" | "tentang";

const NAV_ITEMS: { value: AppView; label: string; icon: string }[] = [
  { value: "beranda", label: "Beranda", icon: "🏠" },
  { value: "sekitar", label: "Sekitar Saya", icon: "📍" },
  { value: "peta", label: "Peta", icon: "🗺️" },
  { value: "indonesia", label: "Indonesia", icon: "🇮🇩" },
  { value: "tentang", label: "Tentang", icon: "ℹ️" },
];

export default function BottomNav({ active, onChange }: { active: AppView; onChange: (view: AppView) => void }) {
  return (
    <nav
      className="border-t border-neutral-800 bg-neutral-950 flex shrink-0"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.value;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-14 text-[10px] font-medium transition-colors ${
              isActive ? "text-orange-400" : "text-neutral-500"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="text-lg leading-none" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
