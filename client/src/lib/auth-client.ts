import { createAuthClient } from "better-auth/react";

/**
 * Better Auth React Client
 *
 * Connects to the backend Better Auth instance.
 * Since Vite proxies /api → localhost:3000, we use relative baseURL.
 *
 * Provides:
 * - useSession() hook for teacher auth state
 * - signIn.email() / signUp.email() / signOut() methods
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_BASE || "",
});

// Destructured exports for convenience
export const {
  useSession,
  signIn,
  signUp,
  signOut,
} = authClient;
