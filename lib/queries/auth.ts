import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, clearToken, setToken } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  hasActiveSubscription?: boolean;
  status?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export function useMe() {
  return useQuery<User>({
    queryKey: ["me"],
    queryFn: () => apiFetch<User>("/auth/me"),
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      apiFetch<AuthResponse>("/auth/login", { method: "POST", body }),
    onSuccess: ({ token, user }) => {
      setToken(token);
      qc.setQueryData(["me"], user);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string; name: string }) =>
      apiFetch<AuthResponse>("/auth/register", { method: "POST", body }),
    onSuccess: ({ token, user }) => {
      setToken(token);
      qc.setQueryData(["me"], user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/auth/logout", { method: "POST" }),
    onSettled: () => {
      clearToken();
      qc.clear();
    },
  });
}
