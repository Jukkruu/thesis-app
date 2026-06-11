"use client";

import { SessionProvider } from "next-auth/react";
import { AppProvider } from "@/context/AppContext";
import { ToastProvider } from "@/context/ToastContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppProvider>
        <ToastProvider>{children}</ToastProvider>
      </AppProvider>
    </SessionProvider>
  );
}
