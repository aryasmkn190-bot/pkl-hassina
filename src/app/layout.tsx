import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";


/* ─────────────────────────────────────────────────────────
   Font
───────────────────────────────────────────────────────── */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

/* ─────────────────────────────────────────────────────────
   Metadata
───────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "PKL SMK HASSINA",
    template: "%s — PKL SMK HASSINA",
  },
  description:
    "Aplikasi Manajemen Praktek Kerja Industri SMK HASSINA. Kelola presensi, jurnal harian, dan monitoring PKL siswa secara digital.",
  applicationName: "PKL SMK HASSINA",
  keywords: [
    "PKL",
    "Praktek Kerja Industri",
    "SMK HASSINA",
    "presensi digital",
    "jurnal PKL",
    "monitoring siswa",
  ],
  authors: [{ name: "SMK HASSINA" }],
  creator: "SMK HASSINA",
  publisher: "SMK HASSINA",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  // Open Graph
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "PKL SMK HASSINA",
    title: "PKL SMK HASSINA — Aplikasi Manajemen Praktek Kerja Industri",
    description:
      "Kelola presensi, jurnal harian, dan monitoring PKL siswa SMK HASSINA secara digital.",
  },


  // Icons
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png",  sizes: "32x32",   type: "image/png" },
      { url: "/icons/icon-192x192.png",   sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png",   sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icons/favicon-32x32.png",
  },
};

/* ─────────────────────────────────────────────────────────
   Viewport
───────────────────────────────────────────────────────── */

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#1d4ed8" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  colorScheme: "light dark",
};

/* ─────────────────────────────────────────────────────────
   Root Layout
───────────────────────────────────────────────────────── */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={inter.className}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <Providers>
          {children}
        </Providers>
        {/* Unregister old PWA service worker & clear cache */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  regs.forEach(function(r) { r.unregister(); });
                });
                caches.keys().then(function(names) {
                  names.forEach(function(n) { caches.delete(n); });
                });
              }
            `,
          }}
        />
      </body>

    </html>
  );
}
