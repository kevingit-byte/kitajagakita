import type { DisasterType } from "./types";

export type GuidanceStep = { icon: string; text: string };

/**
 * General public-safety guidance per hazard type, based on standard
 * practice commonly published by BMKG/BNPB/PVMBG - not fetched from any
 * API, and not a substitute for official, situation-specific instructions.
 * Deliberately generic ("what to do about an earthquake" in general, not
 * "what to do about this specific M5.7 in Ruteng") since the app has no
 * way to verify locally-specific evacuation routes or shelter locations.
 */
export const GUIDANCE: Record<DisasterType, GuidanceStep[]> = {
  gempa: [
    { icon: "🏠", text: "Tetap di tempat yang aman. Jika di dalam ruangan, berlindung di bawah meja yang kokoh." },
    { icon: "🚪", text: "Jauhi jendela kaca, lemari, dan benda yang mudah jatuh." },
    { icon: "🏃", text: "Jika di luar ruangan, menjauh dari bangunan, tiang, dan pohon." },
    { icon: "📱", text: "Pantau informasi resmi BMKG untuk potensi gempa susulan atau tsunami." },
    { icon: "🚨", text: "Jika berada di pesisir dan gempa dirasakan kuat, segera ke tempat lebih tinggi tanpa menunggu peringatan resmi." },
  ],
  karhutla: [
    { icon: "😷", text: "Gunakan masker (idealnya N95) saat kualitas udara memburuk, terutama di luar ruangan." },
    { icon: "🏠", text: "Kurangi aktivitas di luar ruangan, tutup jendela dan pintu saat asap tebal." },
    { icon: "👶", text: "Kelompok rentan (anak-anak, lansia, ibu hamil, penderita gangguan pernapasan) sebaiknya lebih waspada." },
    { icon: "📱", text: "Pantau indeks kualitas udara (AQI) di wilayah kamu secara berkala." },
    { icon: "🚨", text: "Jika titik api mendekati permukiman, ikuti arahan evakuasi dari BPBD setempat." },
  ],
  gunungapi: [
    { icon: "📏", text: "Patuhi radius jarak aman yang ditetapkan PVMBG untuk gunung api tersebut." },
    { icon: "😷", text: "Siapkan masker untuk melindungi diri dari abu vulkanik." },
    { icon: "🥽", text: "Lindungi mata dari abu vulkanik, hindari penggunaan lensa kontak." },
    { icon: "📱", text: "Pantau perkembangan status level (Normal/Waspada/Siaga/Awas) dari MAGMA ESDM/PVMBG." },
    { icon: "🚨", text: "Jika diperintahkan evakuasi, ikuti jalur dan titik kumpul resmi dari BPBD setempat." },
  ],
  banjir: [
    { icon: "⬆️", text: "Pindahkan barang berharga dan dokumen penting ke tempat yang lebih tinggi." },
    { icon: "🔌", text: "Matikan aliran listrik di rumah jika air mulai naik." },
    { icon: "🚫", text: "Hindari berjalan atau berkendara melewati genangan/arus air, meski terlihat dangkal." },
    { icon: "📱", text: "Pantau informasi ketinggian air dan prakiraan cuaca dari BMKG/BPBD." },
    { icon: "🚨", text: "Jika diminta mengungsi, segera menuju titik evakuasi terdekat yang ditentukan." },
  ],
  longsor: [
    { icon: "🏃", text: "Jika mendengar suara gemuruh atau retakan tanah baru, segera menjauh dari lereng." },
    { icon: "🌧️", text: "Waspada lebih tinggi saat/setelah hujan deras berkepanjangan di area rawan longsor." },
    { icon: "👀", text: "Perhatikan tanda-tanda: retakan tanah, pohon miring, air keruh tiba-tiba di sekitar lereng." },
    { icon: "📱", text: "Pantau peringatan dini cuaca ekstrem dan status kerawanan wilayah dari BMKG/BPBD." },
    { icon: "🚨", text: "Jika diperintahkan evakuasi, ikuti jalur resmi dan jangan kembali sebelum dinyatakan aman." },
  ],
  cuaca: [
    { icon: "🏠", text: "Kurangi aktivitas di luar ruangan saat cuaca ekstrem (angin kencang, hujan lebat, petir)." },
    { icon: "🌳", text: "Jauhi pohon besar, papan reklame, dan bangunan yang berisiko roboh saat angin kencang." },
    { icon: "🚗", text: "Jika berkendara, kurangi kecepatan dan waspada jarak pandang yang terbatas." },
    { icon: "📱", text: "Pantau prakiraan dan peringatan dini cuaca dari BMKG secara berkala." },
    { icon: "🚨", text: "Segera berlindung di bangunan kokoh jika cuaca ekstrem sedang berlangsung." },
  ],
  lainnya: [
    { icon: "📱", text: "Pantau informasi resmi dari BNPB dan BPBD setempat untuk perkembangan situasi." },
    { icon: "🎒", text: "Siapkan tas siaga bencana berisi dokumen penting, obat-obatan, dan kebutuhan dasar." },
    { icon: "🚨", text: "Ikuti arahan resmi jika diminta evakuasi atau tindakan pencegahan lainnya." },
  ],
};

export const OFFICIAL_SOURCES_URL = "/sumber-data";
