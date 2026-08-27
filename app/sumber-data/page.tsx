import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sumber Data - Kita Jaga Kita",
};

type SourceEntry = {
  name: string;
  operator: string;
  usedFor: string;
  refreshInterval: string;
  license: string;
  url: string;
};

const SOURCES: SourceEntry[] = [
  {
    name: "BMKG - autogempa, gempaterkini, gempadirasakan",
    operator: "Badan Meteorologi, Klimatologi, dan Geofisika (BMKG), Republik Indonesia",
    usedFor: "Data gempa bumi Indonesia (sumber utama tampilan), termasuk potensi tsunami dan intensitas guncangan (MMI)",
    refreshInterval: "2 menit",
    license: "Data terbuka pemerintah Indonesia. Wajib mencantumkan atribusi BMKG.",
    url: "https://data.bmkg.go.id/",
  },
  {
    name: "USGS Earthquake Catalog",
    operator: "United States Geological Survey (USGS)",
    usedFor: "Riwayat gempa 30 hari untuk mendeteksi rangkaian gempa susulan (tidak ditampilkan langsung ke pengguna)",
    refreshInterval: "2 menit",
    license: "Domain publik (data pemerintah AS).",
    url: "https://earthquake.usgs.gov/",
  },
  {
    name: "NASA FIRMS (VIIRS NOAA-20, VIIRS SNPP, MODIS)",
    operator: "NASA / University of Maryland",
    usedFor: "Titik panas (hotspot) untuk deteksi karhutla",
    refreshInterval: "15 menit",
    license: "Data terbuka NASA. Wajib mencantumkan atribusi NASA FIRMS sesuai pedoman sitasi resmi.",
    url: "https://firms.modaps.eosdis.nasa.gov/",
  },
  {
    name: "MAGMA ESDM (tingkat-aktivitas)",
    operator: "Pusat Vulkanologi dan Mitigasi Bencana Geologi (PVMBG), Kementerian ESDM",
    usedFor: "Tingkat aktivitas gunung api Indonesia (Level I-IV) - sumber utama",
    refreshInterval: "30 menit",
    license: "Data terbuka pemerintah Indonesia. Wajib mencantumkan atribusi PVMBG/Badan Geologi.",
    url: "https://magma.esdm.go.id/",
  },
  {
    name: "Smithsonian Global Volcanism Program - Weekly Volcanic Activity Report",
    operator: "Smithsonian Institution",
    usedFor: "Cadangan saat MAGMA ESDM tidak dapat diakses",
    refreshInterval: "30 menit",
    license: "Data terbuka untuk penggunaan non-komersial dengan atribusi.",
    url: "https://volcano.si.edu/",
  },
  {
    name: "GDACS (Global Disaster Alert and Coordination System)",
    operator: "Komisi Eropa (Joint Research Centre) bersama PBB",
    usedFor: "Banjir, siklon tropis, dan bencana multi-jenis lain dengan skor keparahan",
    refreshInterval: "30 menit",
    license: "Data terbuka untuk kemanusiaan.",
    url: "https://www.gdacs.org/",
  },
  {
    name: "ReliefWeb API",
    operator: "PBB - OCHA (Office for the Coordination of Humanitarian Affairs)",
    usedFor: "Rekaman bencana terverifikasi sebagai lapisan pelengkap (opsional, memerlukan appname terdaftar)",
    refreshInterval: "30 menit",
    license: "Data terbuka kemanusiaan. Memerlukan appname yang disetujui ReliefWeb sejak November 2025.",
    url: "https://reliefweb.int/",
  },
  {
    name: "Google News RSS",
    operator: "Google",
    usedFor: "Tautan berita terkait tiap kejadian (tidak diringkas atau ditafsirkan oleh dashboard ini)",
    refreshInterval: "30 menit",
    license: "Feed publik Google News.",
    url: "https://news.google.com/",
  },
  {
    name: "Open-Meteo Air Quality API",
    operator: "Open-Meteo (open source)",
    usedFor: "Kualitas udara (PM2.5, PM10, AQI) untuk kota terdampak dan penilaian keselamatan lokasi",
    refreshInterval: "30 menit",
    license: "CC BY 4.0 - gratis untuk penggunaan non-komersial dan komersial dengan atribusi.",
    url: "https://open-meteo.com/",
  },
  {
    name: "OpenStreetMap Nominatim",
    operator: "OpenStreetMap Foundation",
    usedFor: "Geocoding terbalik untuk memberi nama lokasi pada klaster karhutla (hanya saat panel detail dibuka)",
    refreshInterval: "Sesuai permintaan (di-cache 24 jam per titik)",
    license: "Open Database License (ODbL). Wajib atribusi © OpenStreetMap contributors.",
    url: "https://nominatim.org/",
  },
  {
    name: "OpenStreetMap Overpass API",
    operator: "OpenStreetMap Foundation",
    usedFor: "Koordinat gunung api dan provinsi (dikumpulkan sekali saat pengembangan, disimpan statis - bukan dipanggil saat aplikasi berjalan)",
    refreshInterval: "Tidak berlaku (data statis)",
    license: "Open Database License (ODbL). Wajib atribusi © OpenStreetMap contributors.",
    url: "https://overpass-api.de/",
  },
  {
    name: "CARTO Dark Matter (basemap peta)",
    operator: "CARTO",
    usedFor: "Peta dasar (basemap) untuk seluruh tampilan peta",
    refreshInterval: "Tidak berlaku (ubin peta statis)",
    license: "Gratis untuk penggunaan non-komersial dengan atribusi CARTO dan OpenStreetMap.",
    url: "https://carto.com/",
  },
];

export default function SumberDataPage() {
  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100 p-4 sm:p-8 max-w-4xl mx-auto">
      <Link href="/" className="text-xs text-blue-400 underline">
        ← Kembali ke dashboard
      </Link>

      <h1 className="text-xl sm:text-2xl font-semibold mt-3 mb-2">Sumber Data</h1>
      <p className="text-sm text-neutral-400 mb-6">
        Semua data pada dashboard ini diambil dari sumber terbuka (open data) dan gratis. Berikut daftar
        lengkap setiap sumber, operatornya, seberapa sering datanya diperbarui, dan ketentuan lisensi/atribusi
        yang berlaku.
      </p>

      <div className="flex flex-col gap-3">
        {SOURCES.map((source) => (
          <div key={source.name} className="p-3 sm:p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 className="font-medium text-sm sm:text-base">{source.name}</h2>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 underline shrink-0"
              >
                Situs resmi ↗
              </a>
            </div>
            <dl className="mt-2 grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-neutral-500">Operator</dt>
              <dd className="text-neutral-300">{source.operator}</dd>
              <dt className="text-neutral-500">Digunakan untuk</dt>
              <dd className="text-neutral-300">{source.usedFor}</dd>
              <dt className="text-neutral-500">Interval refresh</dt>
              <dd className="text-neutral-300">{source.refreshInterval}</dd>
              <dt className="text-neutral-500">Lisensi/Atribusi</dt>
              <dd className="text-neutral-300">{source.license}</dd>
            </dl>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-600 mt-6 border-t border-neutral-800 pt-4">
        Dashboard ini tidak dikelola atau didukung secara resmi oleh BMKG, BNPB, PVMBG, NASA, USGS, atau
        instansi manapun yang disebutkan di atas. Semua data diolah otomatis dan dapat mengandung
        keterlambatan atau kesalahan.
      </p>
    </main>
  );
}
