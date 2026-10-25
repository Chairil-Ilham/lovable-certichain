import { useState, type ReactNode } from "react";
import { Link, useNavigate, type LinkProps } from "@tanstack/react-router";
import { LogOut, Menu, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DemoBanner, Logo } from "./brand";
import { PhantomWalletButton } from "./phantom-wallet-button";
import { SessionService } from "@/lib/certichain/session";
import { CertificateService } from "@/lib/certichain/certificate-service";
import { useSession } from "@/hooks/use-certichain";

export interface NavItem {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

function SideNav({ items, onNavigate, footer }: { items: NavItem[]; onNavigate?: () => void; footer?: ReactNode }) {
  const session = useSession();
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5">
        <Logo inverted />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((it) => (
          <Link
            key={String(it.to)}
            to={it.to}
            onClick={onNavigate}
            activeOptions={{ exact: !!it.exact }}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
          >
            <it.icon className="size-4" />
            {it.label}
          </Link>
        ))}
      </nav>
      {footer && <div className="px-3 pb-2">{footer}</div>}
      <div className="border-t border-sidebar-border p-4">
        <p className="text-sm font-medium text-sidebar-accent-foreground">{session?.name}</p>
        <p className="text-xs">{session?.role === "admin" ? "Administrator" : `Mahasiswa · ${session && "nim" in session ? session.nim : ""}`}</p>
        <button
          onClick={() => {
            void SessionService.signOut().then(() => {
              CertificateService.clear();
              navigate({ to: "/login", replace: true });
            });
          }}
          className="mt-3 flex items-center gap-2 text-xs font-medium hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-3.5" /> Keluar
        </button>
      </div>
    </div>
  );
}

export function DashboardShell({ items, children, footer }: { items: NavItem[]; children: ReactNode; footer?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 lg:block">
        <SideNav items={items} footer={footer} />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 border-none p-0">
          <SheetTitle className="sr-only">Navigasi</SheetTitle>
          <SideNav items={items} footer={footer} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="lg:pl-60">
        <DemoBanner />
        <div className="flex items-center gap-2 border-b px-4 py-2 sm:px-6">
          <Button variant="ghost" size="icon" aria-label="Buka menu" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu />
          </Button>
          <div className="lg:hidden"><Logo /></div>
          <div className="ml-auto"><PhantomWalletButton /></div>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-primary sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon }: { label: string; value: number | string; hint?: string; icon: LucideIcon }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label}
        <Icon className="size-4 text-highlight" />
      </div>
      <p className="mt-2 font-serif text-3xl font-semibold text-primary">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
