import { useEffect, useSyncExternalStore } from "react";
import { CertificateService } from "@/lib/certichain/certificate-service";
import { SessionService } from "@/lib/certichain/session";

export function useCertificates() {
  const state = useSyncExternalStore(
    CertificateService.subscribe,
    CertificateService.getSnapshot,
    CertificateService.getServerSnapshot,
  );
  const { session } = useSessionState();
  const uid = session?.userId;
  useEffect(() => {
    if (uid) void CertificateService.load(uid);
  }, [uid]);
  return state;
}

export function useSessionState() {
  return useSyncExternalStore(SessionService.subscribe, SessionService.getSnapshot, SessionService.getServerSnapshot);
}

export function useSession() {
  return useSessionState().session;
}
