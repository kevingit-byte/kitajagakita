# Kita Jaga Kita

Dasbor pemantauan bencana Indonesia secara langsung (live) - gempa bumi, karhutla,
gunung api, banjir, dan bencana lainnya. Dibangun dengan data terbuka gratis,
tanpa database, dan dirancang untuk dijalankan di tingkat gratis (free tier) Vercel.

> **Peringatan:** Dashboard ini bukan sistem peringatan dini resmi. Untuk keputusan
> keselamatan, selalu ikuti informasi resmi BMKG, BNPB, dan PVMBG serta arahan BPBD
> setempat.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- `react-leaflet` / Leaflet untuk peta, dengan basemap CARTO Dark Matter (gratis,
  tanpa API key)
- SWR untuk polling data di sisi klien
- Vitest untuk unit test
- Tanpa database - lihat "Desain Tanpa Database" di bawah

## Setup Lokal

```bash
git clone https://github.com/kevingit-byte/kitajagakita.git
cd kitajagakita
npm install
cp .env.example .env.local
# isi FIRMS_MAP_KEY di .env.local (lihat langkah di bawah)
npm run dev
```

Buka `http://localhost:3000`.

Perintah lain yang tersedia:

```bash
npm run test       # jalankan seluruh unit test (mesin status, skor komposit, dll)
npm run typecheck  # cek tipe TypeScript
npm run build       # build produksi
npm run lint        # linting Next.js
```

## Mendapatkan FIRMS_MAP_KEY (wajib untuk lapisan karhutla)

1. Buka <https://firms.modaps.eosdis.nasa.gov/api/map_key/>
2. Daftar dengan email - key dikirim gratis, tanpa biaya.
3. Salin key tersebut ke `FIRMS_MAP_KEY` di `.env.local` (lokal) atau di
   pengaturan environment variable Vercel (produksi - lihat di bawah).

Tanpa key ini, `/api/karhutla` akan mengembalikan galat yang jelas
(`FIRMS_MAP_KEY belum diset di environment`) dan lapisan karhutla akan kosong -
lapisan lain tetap berfungsi normal.

## Mendapatkan RELIEFWEB_APPNAME (opsional)

ReliefWeb API v2 mewajibkan `appname` yang telah disetujui sejak November 2025
(string sembarang akan ditolak dengan HTTP 403). Daftar di
<https://apidoc.reliefweb.int/parameters#appname>. Tanpa ini, `/api/lainnya` tetap
berfungsi menggunakan GDACS saja.

## Menghubungkan ke Vercel

1. Push repo ini ke GitHub (sudah dilakukan jika Anda membaca ini dari repo yang
   sama).
2. Di [vercel.com](https://vercel.com), pilih **Add New Project** → **Import Git
   Repository** → pilih repo ini.
3. Pastikan branch yang di-deploy adalah branch yang berisi kode terbaru (bukan
   `main` jika pekerjaan masih ada di branch fitur).
4. Di **Settings → Environment Variables**, tambahkan:
   - `FIRMS_MAP_KEY` (wajib untuk lapisan karhutla)
   - `RELIEFWEB_APPNAME` (opsional)
5. Deploy. Vercel otomatis mendeteksi Next.js dan menjalankan `next build`.
6. Redeploy setiap kali environment variable baru ditambahkan/diubah - Vercel
   tidak menerapkannya secara otomatis ke deployment yang sudah ada.

### Verifikasi setelah deploy

- `your-app.vercel.app/api/debug` - dump semua sumber data yang sudah
  dinormalisasi, plus status kesehatan tiap sumber (`sourceHealth`). Ini cara
  tercepat memastikan semua sumber benar-benar berjalan di produksi.
- `your-app.vercel.app/api/test-bmkg` dan `/api/test-magma` - uji konektivitas
  langsung ke BMKG dan MAGMA ESDM dari server produksi Vercel (relevan karena
  beberapa situs pemerintah Indonesia dilaporkan memblokir IP datacenter
  AWS/GCP - sudah dikonfirmasi TIDAK bermasalah untuk BMKG dan MAGMA ESDM per
  pengujian produksi).

## Desain Tanpa Database

Tidak ada database di v1. Riwayat yang diperlukan untuk mendeteksi status
(misalnya rangkaian gempa susulan, tren karhutla) didapat dengan meminta jendela
data multi-hari pada setiap fetch, lalu menghitung status di memori:

- USGS: selalu meminta jendela 30 hari untuk deteksi rangkaian gempa susulan.
- NASA FIRMS: selalu meminta jendela 3 hari untuk membandingkan jumlah deteksi
  antar hari.

Status dihitung ulang setiap kali cache di-refresh - stateless dan gratis.

## Caching

Setiap sumber punya `revalidate` sendiri di Route Handler-nya (lihat
`app/api/*/route.ts`), sesuai kebutuhan masing-masing:

| Sumber | Interval |
|---|---|
| Gempa (BMKG+USGS) | 2 menit |
| Karhutla (NASA FIRMS) | 15 menit |
| Gunung api (MAGMA ESDM) | 30 menit |
| Lainnya (GDACS/ReliefWeb) | 30 menit |
| Berita, AQI | 30 menit |

## Arsitektur

Semua fetch ke sumber eksternal terjadi di Next.js Route Handler
(`app/api/*/route.ts`) - tidak pernah langsung dari klien, karena sebagian besar
API pemerintah memblokir CORS. Klien memanggil route internal via SWR.

```
lib/sources/    - fetch + parse mentah per sumber (satu file per API)
lib/status/     - mesin status berbasis aturan (bukan AI), satu file per jenis
                  bahaya, plus unit test
lib/data/       - data referensi statis (koordinat gunung api & provinsi,
                  dikumpulkan sekali dari OpenStreetMap, bukan dipanggil saat
                  aplikasi berjalan)
app/api/        - Route Handler yang menggabungkan sources + status untuk
                  tiap kategori bahaya
components/     - UI (peta, filter, panel detail, ringkasan nasional, cek lokasi)
```

Lihat `/sumber-data` di aplikasi untuk daftar lengkap setiap API, operator,
interval refresh, dan lisensi/atribusinya.

## Keterbatasan yang Diketahui

Didokumentasikan secara jujur, bukan disembunyikan:

- **Status "mereda" gunung api tidak dapat dipastikan.** Aturan asli
  memerlukan "level diturunkan dalam 30 hari terakhir", tapi MAGMA ESDM hanya
  menyediakan snapshot saat ini tanpa riwayat, dan aplikasi ini sengaja tanpa
  database. Level II (Waspada) dilaporkan sebagai "tidak diketahui" alih-alih
  dipalsukan.
- **Provinsi ditentukan dari jarak terdekat ke titik kejadian**, bukan batas
  wilayah resmi (poligon provinsi tidak tersedia sebagai data gratis yang
  sudah diverifikasi dalam proyek ini) - kejadian di dekat perbatasan bisa
  masuk ke provinsi tetangga yang salah.
- **Modul ReliefWeb belum terverifikasi terhadap respons nyata** - appname
  belum tersedia saat pengembangan, jadi bentuk data diambil dari dokumentasi
  API publik, bukan sampel sungguhan seperti sumber lain di proyek ini.
- **Kluster karhutla adalah sinyal panas satelit, bukan konfirmasi kebakaran.**
  Lintasan satelit punya celah waktu dan tutupan awan dapat menyebabkan
  pembacaan "padam" yang keliru - lihat catatan ini juga di UI setiap kali
  status karhutla ditampilkan.

## Catatan Penting: Vercel Hobby Tier

Tingkat gratis (Hobby) Vercel **hanya untuk penggunaan non-komersial**. Jika
proyek ini nantinya dimonetisasi, perlu naik ke paket berbayar Vercel atau
pindah ke penyedia lain (mis. Cloudflare Pages) sesuai ketentuan layanan
masing-masing.
