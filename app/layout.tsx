import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kita Jaga Kita",
  description: "Dasbor pemantauan bencana Indonesia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
