import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const viewport: Viewport = {
  themeColor: "#00F5FF",
};

export const metadata: Metadata = {
  title: "CosmoMosaic – Ghép tri thức, thắp sáng vũ trụ!",
  description:
    "Ứng dụng giáo dục kết hợp game vũ trụ neon cho học sinh tiểu học Việt Nam. Học mà chơi, chơi mà học!",
  keywords: ["giáo dục", "game học tập", "tiểu học", "Việt Nam", "CosmoMosaic"],
  manifest: "/manifest.json",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
