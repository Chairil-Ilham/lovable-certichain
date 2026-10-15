import { CircleHelp, Link2, Loader2, SearchX, ShieldCheck, ShieldOff, ShieldQuestion, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChainStatus, VerificationResult } from "@/lib/certichain/types";

const base = "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide whitespace-nowrap";

const STATUS = {
  VALID: { label: "VALID", cls: "border-success/30 bg-success-soft text-success", Icon: ShieldCheck },
  REVOKED: { label: "REVOKED", cls: "border-destructive/30 bg-destructive-soft text-destructive", Icon: ShieldOff },
  UNVERIFIED: { label: "UNVERIFIED", cls: "border-border bg-muted text-muted-foreground", Icon: ShieldQuestion },
  NOT_FOUND: { label: "NOT FOUND", cls: "border-warning/30 bg-warning-soft text-warning", Icon: SearchX },
} as const;

export function StatusBadge({ status, className }: { status: VerificationResult; className?: string }) {
  const s = STATUS[status];
  return (
    <span className={cn(base, s.cls, className)}>
      <s.Icon className="size-3.5" /> {s.label}
    </span>
  );
}

const CHAIN: Record<ChainStatus, { label: string; cls: string; Icon: typeof Link2 }> = {
  SIMULATED: { label: "Simulasi tercatat", cls: "border-highlight/40 bg-accent text-accent-foreground", Icon: Link2 },
  CONFIRMED: { label: "Terkonfirmasi", cls: "border-success/30 bg-success-soft text-success", Icon: Link2 },
  PENDING: { label: "Menunggu", cls: "border-warning/30 bg-warning-soft text-warning", Icon: Loader2 },
  NOT_REGISTERED: { label: "Belum tercatat", cls: "border-border bg-muted text-muted-foreground", Icon: CircleHelp },
  FAILED: { label: "Gagal", cls: "border-destructive/30 bg-destructive-soft text-destructive", Icon: TriangleAlert },
};

export function ChainBadge({ status }: { status: ChainStatus }) {
  const c = CHAIN[status];
  return (
    <span className={cn(base, "font-medium", c.cls)}>
      <c.Icon className={cn("size-3.5", status === "PENDING" && "animate-spin")} /> {c.label}
    </span>
  );
}
