import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CosmoMosaic – Ghép tri thức, thắp sáng vũ trụ!",
  description:
    "Ứng dụng giáo dục kết hợp game vũ trụ neon cho học sinh tiểu học Việt Nam. Học mà chơi, chơi mà học!",
  keywords: ["giáo dục", "game học tập", "tiểu học", "Việt Nam", "CosmoMosaic"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
