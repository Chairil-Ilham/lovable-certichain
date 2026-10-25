<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## CertiChain architecture
- Data access goes through services in `src/lib/certichain/` (Certificate, Verification, Hash, Blockchain); UI never touches storage directly. Certificates, the simulated registry, roles and student links live in Lovable Cloud tables protected by RLS (admin via `has_role`, students via `current_student_nim()`); anon can read only `chain_registry`.
- Public verification runs in `verification.functions.ts` (server fn, privileged read) and returns only masked/public fields — never expose names/NIM to anon via table policies.
- QR/PDF use the fixed `PUBLIC_APP_URL` so PDF bytes (document hash) are identical on every device; changing it invalidates stored document hashes.
- `blockchainService` is an interface; the mock never fabricates tx hashes (only `SIMULASI-` ids) — swap in an ethers.js implementation for EVM.
- PDFs are generated deterministically (fixed creation date / file id) so their SHA-256 can be compared on upload.
- Dashboard and login routes use `ssr: false` because the auth session lives in browser storage; `RoleGate` is UX only, RLS is the real check.
- Phantom wallet uses the injected `window.phantom.solana` provider via `src/lib/certichain/phantom-wallet.ts` (connect/disconnect only, no signing/transactions) — avoids heavy web3 polyfills and keeps the wallet separate from the certificate services.
