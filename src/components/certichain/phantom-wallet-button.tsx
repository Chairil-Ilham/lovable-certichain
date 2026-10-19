import { useEffect, useSyncExternalStore } from "react";
import { Check, Copy, ExternalLink, Loader2, Unplug, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PhantomWallet, shortAddress } from "@/lib/certichain/phantom-wallet";
import { cn } from "@/lib/utils";

export function PhantomWalletButton({ className }: { className?: string }) {
  const w = useSyncExternalStore(PhantomWallet.subscribe, PhantomWallet.getSnapshot, PhantomWallet.getServerSnapshot);
  useEffect(() => {
    // Phantom injects shortly after load; re-check once.
    PhantomWallet.init();
    const t = setTimeout(() => PhantomWallet.init(), 600);
    return () => clearTimeout(t);
  }, []);
  const connected = w.status === "connected" && w.address;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant={connected ? "outline" : "secondary"} className={cn("gap-1.5", className)}>
          <span className={cn("size-2 rounded-full", connected ? "bg-success" : "bg-muted-foreground/50")} aria-hidden />
          <Wallet className="size-4" />
          <span className="hidden sm:inline">{connected ? shortAddress(w.address!) : "Hubungkan Phantom"}</span>
          <span className="sm:hidden">{connected ? shortAddress(w.address!) : "Phantom"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(20rem,calc(100vw-2rem))] space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <p className="font-medium">Wallet Solana (Phantom)</p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              connected ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
            )}
          >
            {connected ? "Wallet Terhubung" : "Wallet Belum Terhubung"}
          </span>
        </div>

        {w.status === "unavailable" ? (
          <div className="space-y-2 rounded-md border border-warning/30 bg-warning-soft p-3 text-xs text-warning">
            <p className="font-semibold">Phantom tidak terdeteksi di browser ini.</p>
            <ol className="list-decimal space-y-0.5 pl-4">
              <li>Pasang ekstensi Phantom (Chrome, Firefox, Brave, Edge).</li>
              <li>Buat atau impor wallet di aplikasi Phantom, bukan di situs ini.</li>
              <li>Muat ulang halaman ini, lalu klik "Hubungkan Phantom".</li>
            </ol>
            <p>Di ponsel, buka situs ini lewat browser di dalam aplikasi Phantom.</p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <a href="https://phantom.com/download" target="_blank" rel="noreferrer">
                Unduh Phantom <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
        ) : connected ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Alamat publik</p>
            <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-2">
              <code className="flex-1 font-mono text-xs break-all">{w.address}</code>
              <button
                aria-label="Salin alamat"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  void navigator.clipboard.writeText(w.address!);
                  toast.success("Alamat disalin");
                }}
              >
                <Copy className="size-3.5" />
              </button>
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={() => void PhantomWallet.disconnect()}>
              <Unplug className="size-4" /> Putuskan Wallet
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button size="sm" className="w-full" disabled={w.status === "connecting"} onClick={() => void PhantomWallet.connect()}>
              {w.status === "connecting" ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
              {w.status === "connecting" ? "Menunggu persetujuan…" : "Hubungkan Phantom"}
            </Button>
            {w.error && <p className="text-xs text-destructive">{w.error}</p>}
          </div>
        )}

        <p className="flex gap-1.5 border-t pt-2 text-[11px] text-muted-foreground">
          <Check className="mt-0.5 size-3 shrink-0" />
          Hanya alamat publik yang dibaca. CertiChain tidak pernah meminta seed phrase, private key, tanda tangan, atau transaksi.
        </p>
      </PopoverContent>
    </Popover>
  );
}
