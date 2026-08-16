# Testnet presale backend

The website and presale API now run from one Node process. The browser never decides how many BATC a payment receives: it requests a five-minute server-signed quote, Phantom signs the exact testnet transaction, and the server verifies the confirmed transfer before recording the allocation.

## Configure

1. Copy `.env.example` to `.env` and load those values in your hosting environment.
2. Set `PRESALE_TREASURY_ADDRESS` to a dedicated Solana **testnet** treasury public key.
3. Set `PRESALE_QUOTE_SECRET` to a random server-only value of at least 32 characters.
4. Set `PYTH_SOL_USD_FEED_ID` and `PYTH_API_KEY` for live SOL/USD pricing. `SOL_USD_PRICE` is the explicit test-only fallback when Pyth is unavailable.
5. Optionally set `PRESALE_USDC_MINT` to your test USDC mint. The USDC tab stays disabled until it is set.

Do not add a treasury secret key. Phantom signs buyer payments; the server only needs the treasury public address.

## Run

```powershell
npm install
npm start
```

Open `http://localhost:3000`. Phantom injects its provider only on HTTPS, localhost, or `127.0.0.1`.

If the frontend is hosted separately, set the `presale-api-base` meta value in `index.html` to the HTTPS API origin and add the frontend origin to `PRESALE_ALLOWED_ORIGINS`.

## Data source

Confirmed allocations are persisted to `data/presale-ledger.json`. The API also reconciles the treasury's latest 100 confirmed testnet transactions and only imports payments carrying a valid server-signed `BATC-PRESALE-V1` memo. The progress card refreshes from `/api/presale/state` every 15 seconds and immediately after a verified purchase.

This is a testnet contribution and allocation system. It intentionally does not mint or distribute BATC. When the token launches, add a separately audited claim/distribution process against the verified allocation ledger.

Before any mainnet sale, replace the JSON ledger with a transactional durable database or an audited on-chain presale program, use a production RPC provider, add reservation/concurrency controls, and commission an independent security review. The current implementation is deliberately locked to testnet.
