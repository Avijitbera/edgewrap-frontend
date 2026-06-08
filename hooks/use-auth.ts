"use client";

import { getToken, clearToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useAuth() {
  const router = useRouter();

  const isAuthenticated = useCallback((): boolean => {
    return !!getToken();
  }, []);

  const logout = useCallback(() => {
    clearToken();
    router.push("/login");
  }, [router]);

  return { isAuthenticated, logout, getToken };
}
