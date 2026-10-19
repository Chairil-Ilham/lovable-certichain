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
- Data access goes through services in `src/lib/certichain/` (Certificate, Verification, Hash, Blockchain); UI never touches storage directly, so the demo localStorage store can be swapped for a database.
- `blockchainService` is an interface; the mock never fabricates tx hashes (only `SIMULASI-` ids) — swap in an ethers.js implementation for EVM.
- PDFs are generated deterministically (fixed creation date / file id) so their SHA-256 can be compared on upload.
- Dashboard routes use `ssr: false` because session and data live in browser storage.
- Phantom wallet uses the injected `window.phantom.solana` provider via `src/lib/certichain/phantom-wallet.ts` (connect/disconnect only, no signing/transactions) — avoids heavy web3 polyfills and keeps the wallet separate from the certificate services.
