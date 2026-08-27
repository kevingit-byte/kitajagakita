export default function DisclaimerBanner() {
  return (
    <div className="w-full bg-amber-950 border-b border-amber-800 px-3 py-2 text-xs sm:text-sm text-amber-200 text-center">
      <strong className="text-amber-100">Peringatan:</strong> Dashboard ini bukan sistem peringatan dini
      resmi. Data diolah otomatis dari sumber terbuka dan dapat terlambat atau keliru. Untuk keputusan
      keselamatan, selalu ikuti informasi resmi BMKG, BNPB, dan PVMBG serta arahan BPBD setempat.
    </div>
  );
}
