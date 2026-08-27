export default function DisclaimerBanner() {
  return (
    <div className="w-full bg-neutral-900 border-b border-neutral-800 px-3 py-1.5 text-[11px] text-neutral-400 text-center leading-snug flex items-start gap-1.5 justify-center">
      <span aria-hidden className="shrink-0">
        ℹ️
      </span>
      <span>
        Dashboard ini <strong className="text-neutral-300">bukan sistem peringatan dini resmi</strong>. Data
        diolah otomatis dan dapat terlambat atau keliru — selalu ikuti informasi resmi BMKG, BNPB, PVMBG, dan
        BPBD setempat.
      </span>
    </div>
  );
}
