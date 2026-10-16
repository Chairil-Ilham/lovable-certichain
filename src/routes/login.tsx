import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, UserCog } from "lucide-react";
import { PublicLayout } from "@/components/certichain/public-layout";
import { DEMO_STUDENTS, SessionService } from "@/lib/certichain/session";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ peran: typeof s.peran === "string" ? s.peran : undefined }),
  head: () => ({
    meta: [
      { title: "Masuk — CertiChain" },
      { name: "description", content: "Masuk ke dashboard CertiChain dengan akun demo admin atau mahasiswa." },
      { property: "og:title", content: "Masuk — CertiChain" },
      { property: "og:description", content: "Akun demo admin dan mahasiswa untuk prototype CertiChain." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const card = "flex w-full items-center gap-3 rounded-lg border bg-background p-4 text-left transition-colors hover:border-highlight hover:bg-accent";
  return (
    <PublicLayout>
      <div className="mx-auto max-w-lg px-4 py-14">
        <h1 className="text-3xl font-semibold text-primary">Masuk dengan akun demo</h1>
        <p className="mt-2 text-sm text-muted-foreground">Prototype ini memakai akun demo tanpa kata sandi. Hak akses dibatasi sesuai peran.</p>
        <div className="mt-8 space-y-3">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Admin</p>
          <button className={card} onClick={() => { SessionService.signIn({ role: "admin", name: "Admin Demo" }); navigate({ to: "/admin" }); }}>
            <UserCog className="size-6 text-primary" />
            <span><span className="block font-medium">Admin Demo</span><span className="text-xs text-muted-foreground">Terbitkan, kelola, dan cabut sertifikat</span></span>
          </button>
          <p className="pt-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Mahasiswa</p>
          {DEMO_STUDENTS.map((s) => (
            <button key={s.nim} className={card} onClick={() => { SessionService.signIn({ role: "student", ...s }); navigate({ to: "/mahasiswa" }); }}>
              <GraduationCap className="size-6 text-primary" />
              <span><span className="block font-medium">{s.name}</span><span className="font-mono text-xs text-muted-foreground">{s.nim}</span></span>
            </button>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
