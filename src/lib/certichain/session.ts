import { supabase } from "@/integrations/supabase/client";
import type { Session } from "./types";

/**
 * Session backed by Lovable Cloud auth. The role is read from the
 * database (user_roles), never from browser storage, and every write is
 * re-checked by database access rules.
 */
export interface SessionState {
  ready: boolean;
  session: Session | null;
  /** Signed in but no role assigned yet. */
  pendingEmail?: string | undefined;
}

let state: SessionState = { ready: false, session: null };
const SERVER_STATE: SessionState = { ready: false, session: null };
const listeners = new Set<() => void>();
let started = false;

function emit(next: SessionState) {
  state = next;
  listeners.forEach((l) => l());
}

async function resolve(userId: string | undefined, email: string | undefined) {
  if (!userId) return emit({ ready: true, session: null });
  const [{ data: roles }, { data: student }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("student_accounts").select("nim, display_name").eq("user_id", userId).maybeSingle(),
  ]);
  const name = email ?? "Pengguna";
  if (roles?.some((r) => r.role === "admin")) return emit({ ready: true, session: { role: "admin", name, userId } });
  if (student) return emit({ ready: true, session: { role: "student", name: student.display_name, nim: student.nim, userId } });
  emit({ ready: true, session: null, pendingEmail: email ?? "" });
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  supabase.auth.onAuthStateChange((event, s) => {
    if (event === "TOKEN_REFRESHED") return;
    // Defer DB calls out of the auth callback.
    setTimeout(() => void resolve(s?.user.id, s?.user.email), 0);
  });
}

export const SessionService = {
  subscribe(l: () => void) {
    start();
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot: () => state,
  getServerSnapshot: () => SERVER_STATE,
  async signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message === "Invalid login credentials" ? "Email atau kata sandi salah." : error.message);
  },
  async signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/login" } });
    if (error) throw new Error(error.message);
  },
  async signOut() {
    await supabase.auth.signOut();
  },
};
