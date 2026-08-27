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
          Setiap kejadian punya dua nilai terpisah: <strong>intensitas</strong>, yaitu angka resmi apa adanya
          dari skala pemerintah (misalnya &quot;SIG III (BMKG)&quot; atau &quot;Level III Siaga (PVMBG)&quot;),
          dan <strong>tindakan</strong> (Normal, Waspada, Siaga, Awas) - satu-satunya nilai yang dibandingkan
          antar jenis bencana, karena angka mentah dari skala yang berbeda (magnitudo gempa, ISPU, level
          gunung api) tidak bisa dibandingkan langsung satu sama lain secara valid. Semua dihitung dari aturan
          tetap berdasarkan data - bukan dari kecerdasan buatan atau tebakan - dan setiap kejadian selalu
          menampilkan alasan status tersebut secara tertulis.
        </p>
      </div>

      <div>
        <h2 className="font-medium text-neutral-200 mb-1.5">Skala resmi yang digunakan</h2>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-neutral-200 font-medium">SIG-BMKG (gempa bumi)</p>
            <p className="text-neutral-400 leading-relaxed">
              Skala Intensitas Gempabumi I-V dari BMKG, hasil konversi laporan &quot;Dirasakan&quot; (MMI) per
              wilayah. Bersifat per lokasi, bukan per kejadian - satu gempa bisa SIG IV di satu kabupaten dan
              SIG II di kabupaten sebelahnya. Saat belum ada laporan dirasakan, aplikasi ini menampilkan
              &quot;Belum ada laporan dirasakan&quot;, bukan perkiraan dari magnitudo.
            </p>
            <a
              href="https://www.bmkg.go.id/gempabumi/skala-intensitas-gempabumi.bmkg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline text-xs"
            >
              Sumber resmi: BMKG →
            </a>
          </div>

          <div>
            <p className="text-neutral-200 font-medium">Level PVMBG (gunung api)</p>
            <p className="text-neutral-400 leading-relaxed">
              Level I (Normal) hingga IV (Awas) dari PVMBG/MAGMA ESDM, ditampilkan apa adanya tanpa konversi.
            </p>
            <a
              href="https://magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline text-xs"
            >
              Sumber resmi: MAGMA ESDM (PVMBG) →
            </a>
          </div>

          <div>
            <p className="text-neutral-200 font-medium">Kualitas udara (titik panas / karhutla)</p>
            <p className="text-neutral-400 leading-relaxed">
              Idealnya memakai ISPU (Indeks Standar Pencemar Udara) resmi dari KLHK. Namun tabel ambang batas
              resmi ISPU belum bisa diverifikasi langsung oleh aplikasi ini, sehingga yang ditampilkan saat
              ini adalah AQI standar AS/EPA (via Open-Meteo) dan selalu diberi label jujur sebagai AQI, bukan
              ISPU, agar tidak keliru dianggap sebagai standar resmi Indonesia.
            </p>
            <a
              href="https://ispu.kemenlh.go.id/webv5/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline text-xs"
            >
              Sumber resmi ISPU: KLHK →
            </a>
          </div>

          <div>
            <p className="text-neutral-200 font-medium">Peringatan dini (banjir &amp; cuaca ekstrem)</p>
            <p className="text-neutral-400 leading-relaxed">
              Idealnya memakai tingkat peringatan dini resmi BMKG (Waspada/Siaga/Awas). Aplikasi ini belum
              terhubung ke sumber tersebut, sehingga sementara memakai tingkat peringatan GDACS sebagai
              proksi - selalu diberi label jujur sebagai proksi GDACS, bukan BMKG.
            </p>
            <a
              href="https://data.bmkg.go.id/peringatan-dini-cuaca/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline text-xs"
            >
              Sumber resmi: BMKG →
            </a>
          </div>
        </div>
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
          <li>Kualitas udara ditampilkan sebagai AQI (AS/EPA), bukan ISPU resmi KLHK - lihat &quot;Skala resmi yang digunakan&quot; di atas.</li>
          <li>Peringatan banjir/cuaca memakai tingkat GDACS sebagai proksi, bukan peringatan dini resmi BMKG.</li>
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
