import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: {
    default: "ระบบจัดการวิทยานิพนธ์",
    template: "%s · ระบบจัดการวิทยานิพนธ์",
  },
  description: "ระบบยื่น ติดตาม และลงนามเอกสารวิทยานิพนธ์ออนไลน์ คณะวิศวกรรมศาสตร์",
  applicationName: "ระบบจัดการวิทยานิพนธ์",
  openGraph: {
    title: "ระบบจัดการวิทยานิพนธ์",
    description: "ยื่น ติดตาม และลงนามเอกสารวิทยานิพนธ์ออนไลน์",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
