/* eslint-disable turbo/no-undeclared-env-vars */
import { cookies } from "next/headers";

export interface AuthCredentials {
  username: string;
  password: string;
}

// Validate credentials against environment variables
export function validateCredentials(credentials: AuthCredentials): boolean {
  const validUsername = process.env.AUTH_USERNAME;
  const validPassword = process.env.AUTH_PASSWORD;

  if (!validUsername || !validPassword) {
    throw new Error(
      "AUTH_USERNAME and AUTH_PASSWORD must be set in environment variables"
    );
  }

  return (
    credentials.username === validUsername &&
    credentials.password === validPassword
  );
}

// Generate a simple random token (not JWT)
export function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Set auth token in cookies
export async function setAuthToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

// Remove auth token from cookies
export async function removeAuthToken() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");
  return !!token;
}
