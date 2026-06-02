import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "ระบบจัดการวิทยานิพนธ์",
  description: "Thesis Management System — Mockup",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-gray-50 antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
