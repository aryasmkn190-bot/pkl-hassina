import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "PKL HASSINA — Monitoring Kehadiran & Jurnal",
  description: "Aplikasi monitoring kehadiran dan pengisian jurnal PKL/Magang SMK HASSINA — portal.smkhassina.sch.id",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-[#eff6ff] text-[#111827]"><Providers>{children}</Providers></body>
    </html>
  );
}
