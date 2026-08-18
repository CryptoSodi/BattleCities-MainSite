const { PublicKey } = require('@solana/web3.js');

const STAGES = Object.freeze([
  { id: 1, label: 'Stage 1', priceMicros: 5_000n, allocationMicros: 200_000_000_000n },
  { id: 2, label: 'Stage 2', priceMicros: 6_000n, allocationMicros: 150_000_000_000n },
  { id: 3, label: 'Stage 3', priceMicros: 7_500n, allocationMicros: 150_000_000_000n },
]);

function optionalPublicKey(value, name) {
  if (!value) return null;
  try {
    return new PublicKey(value);
  } catch {
    throw new Error(`${name} is not a valid Solana public key.`);
  }
}

function loadConfig(env = process.env) {
  const network = env.PRESALE_NETWORK || 'mainnet-beta';
  if (network !== 'mainnet-beta') throw new Error('PRESALE_NETWORK must be mainnet-beta.');
  const rpcUrl = env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

  const endAt = new Date(env.PRESALE_END_AT || '2026-09-13T00:00:00.000Z');
  if (Number.isNaN(endAt.getTime())) throw new Error('PRESALE_END_AT must be an ISO timestamp.');

  const fixedSolUsd = Number(env.SOL_USD_PRICE || 150);
  if (!Number.isFinite(fixedSolUsd) || fixedSolUsd <= 0) throw new Error('SOL_USD_PRICE must be positive.');

  return {
    network,
    rpcUrl,
    hasProductionRpc: Boolean(env.SOLANA_RPC_URL),
    treasury: optionalPublicKey(env.PRESALE_TREASURY_ADDRESS, 'PRESALE_TREASURY_ADDRESS'),
    usdcMint: optionalPublicKey(env.PRESALE_USDC_MINT, 'PRESALE_USDC_MINT'),
    quoteSecret: env.PRESALE_QUOTE_SECRET || '',
    endAt,
    stages: STAGES,
    fixedSolUsd,
    pythFeedId: env.PYTH_SOL_USD_FEED_ID || '',
    pythApiKey: env.PYTH_API_KEY || '',
    pythHermesUrl: env.PYTH_HERMES_URL || 'https://pyth.dourolabs.app/hermes',
    allowedOrigins: (env.PRESALE_ALLOWED_ORIGINS || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean),
    port: Number(env.PORT || 3000),
    ledgerPath: env.PRESALE_LEDGER_PATH || 'data/presale-ledger.json',
  };
}

module.exports = { STAGES, loadConfig };
