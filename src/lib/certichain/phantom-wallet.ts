/**
 * Phantom (Solana) wallet connection only.
 * Uses Phantom's injected provider (window.phantom.solana) — no signing,
 * no transactions, no seed phrase / private key ever touched or stored.
 * Only the public address is held in memory.
 */
export interface PhantomPublicKey {
  toString(): string;
}
export interface PhantomProvider {
  isPhantom?: boolean;
  publicKey: PhantomPublicKey | null;
  isConnected: boolean;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PhantomPublicKey }>;
  disconnect(): Promise<void>;
  on(event: "connect" | "disconnect" | "accountChanged", handler: (arg?: PhantomPublicKey | null) => void): void;
  removeListener?(event: string, handler: (...a: unknown[]) => void): void;
}

declare global {
  interface Window {
    phantom?: { solana?: PhantomProvider };
    solana?: PhantomProvider;
  }
}

export type WalletState = {
  status: "unavailable" | "disconnected" | "connecting" | "connected";
  address: string | null;
  error: string | null;
};

let state: WalletState = { status: "disconnected", address: null, error: null };
const listeners = new Set<() => void>();
let wired = false;

function set(p: Partial<WalletState>) {
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}

export function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const p = window.phantom?.solana ?? window.solana;
  return p?.isPhantom ? p : null;
}

function wire(p: PhantomProvider) {
  if (wired) return;
  wired = true;
  p.on("connect", (pk) => set({ status: "connected", address: pk?.toString() ?? p.publicKey?.toString() ?? null, error: null }));
  p.on("disconnect", () => set({ status: "disconnected", address: null }));
  p.on("accountChanged", (pk) => {
    if (pk) set({ status: "connected", address: pk.toString() });
    else set({ status: "disconnected", address: null });
  });
}

export const PhantomWallet = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot: () => state,
  getServerSnapshot: () => state,
  /** Detect provider after hydration; silently reconnect only if the user already trusted this site. */
  init() {
    const p = getPhantomProvider();
    if (!p) {
      set({ status: "unavailable" });
      return;
    }
    wire(p);
    if (p.isConnected && p.publicKey) {
      set({ status: "connected", address: p.publicKey.toString() });
      return;
    }
    if (state.status === "unavailable") set({ status: "disconnected" });
    p.connect({ onlyIfTrusted: true })
      .then((r) => set({ status: "connected", address: r.publicKey.toString(), error: null }))
      .catch(() => {});
  },
  async connect() {
    const p = getPhantomProvider();
    if (!p) {
      set({ status: "unavailable" });
      return;
    }
    wire(p);
    set({ status: "connecting", error: null });
    try {
      const r = await p.connect();
      set({ status: "connected", address: r.publicKey.toString(), error: null });
    } catch (e) {
      const code = (e as { code?: number })?.code;
      set({
        status: "disconnected",
        address: null,
        error: code === 4001 ? "Permintaan koneksi ditolak di Phantom." : "Gagal menghubungkan Phantom. Coba lagi.",
      });
    }
  },
  async disconnect() {
    const p = getPhantomProvider();
    try {
      await p?.disconnect();
    } finally {
      set({ status: p ? "disconnected" : "unavailable", address: null, error: null });
    }
  },
};

export function shortAddress(a: string) {
  return a.length > 10 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a;
}
