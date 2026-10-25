import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicLayout } from "@/components/certichain/public-layout";
import { useSessionState } from "@/hooks/use-certichain";
import { SessionService } from "@/lib/certichain/session";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Masuk — CertiChain" },
      { name: "description", content: "Masuk ke dashboard CertiChain sebagai admin penerbit atau mahasiswa." },
      { property: "og:title", content: "Masuk — CertiChain" },
      { property: "og:description", content: "Login admin dan mahasiswa untuk prototype CertiChain." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { ready, session, pendingEmail } = useSessionState();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (session?.role === "admin") navigate({ to: "/admin", replace: true });
    else if (session?.role === "student") navigate({ to: "/mahasiswa", replace: true });
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Email tidak valid.");
      return;
    }
    if (password.length < 8) {
      toast.error("Kata sandi minimal 8 karakter.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "in") await SessionService.signIn(email.trim(), password);
      else {
        await SessionService.signUp(email.trim(), password);
        setSent(true);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-14">
        <h1 className="text-3xl font-semibold text-primary">{mode === "in" ? "Masuk" : "Daftar akun"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Akses dashboard ditentukan oleh peran yang diberikan penerbit. Verifikasi sertifikat tidak perlu login.</p>

        {ready && pendingEmail !== undefined && !session && (
          <div className="mt-6 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
            <p className="font-medium">Akun {pendingEmail} belum memiliki akses.</p>
            <p className="mt-1 text-muted-foreground">Minta admin penerbit memberikan peran admin atau menautkan NIM mahasiswa Anda.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void SessionService.signOut()}>Keluar</Button>
          </div>
        )}

        {sent ? (
          <p className="mt-8 rounded-lg border bg-card p-5 text-sm">Cek email Anda untuk mengonfirmasi pendaftaran, lalu kembali ke halaman ini untuk masuk.</p>
        ) : (
          <form onSubmit={submit} noValidate className="mt-8 space-y-4 rounded-lg border bg-card p-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Kata sandi</Label>
              <Input id="password" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : mode === "in" ? <LogIn /> : <UserPlus />}
              {mode === "in" ? "Masuk" : "Daftar"}
            </Button>
            <button type="button" className="w-full text-center text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
              {mode === "in" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
            </button>
          </form>
        )}
      </div>
    </PublicLayout>
  );
}
