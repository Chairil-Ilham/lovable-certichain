import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useSessionState } from "@/hooks/use-certichain";

/** UI gate only — the database access rules are the real protection. */
export function RoleGate({ role, children }: { role: "admin" | "student"; children: ReactNode }) {
  const { ready, session } = useSessionState();
  if (!ready)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Memeriksa sesi…
      </div>
    );
  if (session?.role !== role) return <Navigate to="/login" />;
  return <>{children}</>;
}
