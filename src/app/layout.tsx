import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ToastProvider } from "@/context/ToastContext";

export const metadata: Metadata = {
  title: "ระบบจัดการวิทยานิพนธ์",
  description: "Thesis Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <AppProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
