export default function DisclaimerBanner() {
  return (
    <div className="w-full bg-amber-950 border-b border-amber-800 px-3 py-1.5 text-[11px] sm:text-xs text-amber-200 text-center leading-snug flex items-start gap-1.5 justify-center">
      <span aria-hidden className="shrink-0">
        ⚠️
      </span>
      <span>
        <strong className="text-amber-100">Peringatan:</strong> Dashboard ini bukan sistem peringatan dini
        resmi. Data diolah otomatis dari sumber terbuka dan dapat terlambat atau keliru. Untuk keputusan
        keselamatan, selalu ikuti informasi resmi BMKG, BNPB, dan PVMBG serta arahan BPBD setempat.
      </span>
    </div>
  );
}
