"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth/client";

export function AppAuthUIProvider({ children }: { children: React.ReactNode }) {
  return (
    <NeonAuthUIProvider authClient={authClient}>{children}</NeonAuthUIProvider>
  );
}
