import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DemoBanner, Logo } from "./brand";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DemoBanner />
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 text-sm sm:gap-4">
            <Link to="/" className="hidden px-2 py-1 text-muted-foreground hover:text-foreground sm:inline">Beranda</Link>
            <a href="/#cara-kerja" className="hidden px-2 py-1 text-muted-foreground hover:text-foreground sm:inline">Cara Kerja</a>
            <Link to="/verifikasi" className="px-2 py-1 text-muted-foreground hover:text-foreground">Verifikasi</Link>
            <Button asChild size="sm"><Link to="/login">Login</Link></Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>© 2026 CertiChain — prototype proyek mahasiswa. Identitas kampus dan data bersifat fiktif.</p>
          <p>Data pribadi disimpan off-chain; hanya hash yang dicatat.</p>
        </div>
      </footer>
    </div>
  );
}
