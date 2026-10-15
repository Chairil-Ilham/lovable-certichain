import { Link } from "@tanstack/react-router";
import { FlaskConical, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { blockchainService } from "@/lib/certichain/blockchain-service";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className={cn("grid size-8 place-items-center rounded-md", inverted ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-primary text-primary-foreground")}>
        <ShieldCheck className="size-5" />
      </span>
      <span className={cn("font-serif text-lg font-semibold", inverted ? "text-sidebar-accent-foreground" : "text-primary")}>CertiChain</span>
    </Link>
  );
}

export function DemoBanner({ className }: { className?: string }) {
  if (blockchainService.mode !== "demo") return null;
  return (
    <div className={cn("flex items-center justify-center gap-2 border-b border-warning/30 bg-warning-soft px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-warning", className)}>
      <FlaskConical className="size-3.5 shrink-0" />
      {blockchainService.label}
    </div>
  );
}
