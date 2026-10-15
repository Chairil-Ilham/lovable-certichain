import { useEffect, useSyncExternalStore } from "react";
import { CertificateService } from "@/lib/certichain/certificate-service";
import { SessionService } from "@/lib/certichain/session";

export function useCertificates() {
  const state = useSyncExternalStore(
    CertificateService.subscribe,
    CertificateService.getSnapshot,
    CertificateService.getServerSnapshot,
  );
  useEffect(() => {
    void CertificateService.init();
  }, []);
  return state;
}

export function useSession() {
  return useSyncExternalStore(SessionService.subscribe, SessionService.getSnapshot, SessionService.getServerSnapshot);
}
