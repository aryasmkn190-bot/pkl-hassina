import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { InstallPrompt } from "@/components/InstallPrompt";

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

  // PWA
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PKL HASSINA",
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
        {/* PWA — iOS Safari specific */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PKL HASSINA" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Splash screens — iOS */}
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash-2048x2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash-1668x2224.png"
          media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash-1536x2048.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash-1125x2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash-1242x2208.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash-640x1136.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
        />
      </head>
      <body
        className={inter.className}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <Providers>
          {children}
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
