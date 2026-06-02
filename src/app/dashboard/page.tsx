"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { ROLE_ROUTES } from "@/lib/roleRoutes";

export default function DashboardRedirect() {
  const { user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace(ROLE_ROUTES[user.role]);
    else router.replace("/login");
  }, [user, router]);

  return null;
}
