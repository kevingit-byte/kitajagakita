export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>Kita Jaga Kita</h1>
      <p>Dasbor pemantauan bencana Indonesia — dalam pengembangan.</p>
      <p>
        Uji koneksi BMKG: <a href="/api/test-bmkg">/api/test-bmkg</a>
      </p>
      <p>
        Uji koneksi MAGMA ESDM: <a href="/api/test-magma">/api/test-magma</a>
      </p>
      <p>
        Data gabungan (semua sumber, dinormalisasi): <a href="/api/debug">/api/debug</a>
      </p>
    </main>
  );
}
