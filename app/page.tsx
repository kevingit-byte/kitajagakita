export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>Kita Jaga Kita</h1>
      <p>Dasbor pemantauan bencana Indonesia — dalam pengembangan.</p>
      <p>
        Uji koneksi BMKG: <a href="/api/test-bmkg">/api/test-bmkg</a>
      </p>
    </main>
  );
}
