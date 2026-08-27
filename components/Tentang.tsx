import Link from "next/link";

export default function Tentang() {
  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 text-sm">
      <div>
        <h1 className="text-lg font-semibold flex items-center gap-1.5">
          <span aria-hidden>ℹ️</span> Tentang Kita Jaga Kita
        </h1>
        <p className="text-neutral-400 mt-2 leading-relaxed">
          Kita Jaga Kita mengumpulkan data gempa bumi, karhutla, gunung api, banjir, dan bencana lain dari
          berbagai sumber terbuka Indonesia dan internasional, lalu menampilkannya dalam bentuk yang mudah
          dipahami - bukan hanya angka dan koordinat teknis.
        </p>
      </div>

      <div className="bg-amber-950/40 border border-amber-900/60 rounded-lg p-3">
        <p className="text-amber-200 text-xs leading-relaxed">
          <strong>Penting:</strong> Dashboard ini bukan sistem peringatan dini resmi. Data diolah otomatis dan
          dapat terlambat atau keliru. Untuk keputusan keselamatan, selalu ikuti informasi resmi BMKG, BNPB,
          dan PVMBG serta arahan BPBD setempat.
        </p>
      </div>

      <div>
        <h2 className="font-medium text-neutral-200 mb-1.5">Bagaimana status ditentukan?</h2>
        <p className="text-neutral-400 leading-relaxed">
          Setiap status (Normal, Waspada, Siaga, Perlu Perhatian) dihitung dari aturan tetap berdasarkan data
          - bukan dari kecerdasan buatan atau tebakan. Misalnya, gempa dinilai dari kekuatan dan kedalamannya;
          karhutla dari jumlah titik panas yang meningkat atau menurun; gunung api dari level resmi PVMBG.
          Setiap kejadian selalu menampilkan alasan status tersebut secara tertulis.
        </p>
      </div>

      <div>
        <h2 className="font-medium text-neutral-200 mb-1.5">Seberapa sering data diperbarui?</h2>
        <ul className="text-neutral-400 leading-relaxed list-disc list-inside">
          <li>Gempa bumi: setiap 2 menit</li>
          <li>Karhutla: setiap 15 menit</li>
          <li>Gunung api, banjir, dan lainnya: setiap 30 menit</li>
        </ul>
      </div>

      <div>
        <h2 className="font-medium text-neutral-200 mb-1.5">Keterbatasan</h2>
        <ul className="text-neutral-400 leading-relaxed list-disc list-inside">
          <li>Titik panas karhutla adalah sinyal satelit, bukan konfirmasi kebakaran di lapangan.</li>
          <li>Wilayah/provinsi ditentukan dari jarak terdekat ke titik kejadian, bukan batas administratif resmi.</li>
          <li>Status &quot;mereda&quot; gunung api tidak selalu dapat dipastikan tanpa data riwayat.</li>
        </ul>
      </div>

      <Link
        href="/sumber-data"
        className="text-blue-400 underline text-sm flex items-center gap-1.5 border-t border-neutral-800 pt-4"
      >
        Lihat semua sumber data, operator, dan lisensi →
      </Link>
    </div>
  );
}
