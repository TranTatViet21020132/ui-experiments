import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
}

// Login mutation
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      credentials: LoginCredentials
    ): Promise<LoginResponse> => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate any auth-related queries if you have them
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      // Redirect to calendar page
      router.push("/");
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
    },
  });
}

// Logout mutation
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ success: boolean }> => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      return response.json();
    },
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
      // Redirect to login page
      router.push("/login");
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
    },
  });
}
