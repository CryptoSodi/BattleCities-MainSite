const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PresaleService,
  decimalString,
  parseDecimalToAtomic,
  signPayload,
  verifyToken,
} = require('../server/presale-service');
const { loadConfig } = require('../server/config');

test('decimal payment amounts convert to exact atomic units', () => {
  assert.equal(parseDecimalToAtomic('0.005', 9), 5_000_000n);
  assert.equal(parseDecimalToAtomic('100.25', 6), 100_250_000n);
  assert.throws(() => parseDecimalToAtomic('0.0000000001', 9), /no more than 9/);
  assert.throws(() => parseDecimalToAtomic('-1', 9), /valid positive/);
});

test('atomic values render without scientific notation', () => {
  assert.equal(decimalString(5_000n, 6), '0.005');
  assert.equal(decimalString(200_000_000_000n, 6), '200000');
  assert.equal(decimalString(0n, 6), '0');
});

test('quote tokens detect tampering', () => {
  const secret = 'test-secret-that-is-at-least-32-characters';
  const payload = { id: 'quote-1', wallet: 'wallet', paymentAtomic: '1000' };
  const token = signPayload(payload, secret);
  assert.deepEqual(verifyToken(token, secret), payload);
  assert.throws(() => verifyToken(`${token.slice(0, -1)}x`, secret), /signature is invalid/);
});

test('SOL quotes are derived from the active stage and signed by the backend', async () => {
  const secret = 'test-secret-that-is-at-least-32-characters';
  const config = loadConfig({
    PRESALE_NETWORK: 'mainnet-beta',
    SOLANA_RPC_URL: 'https://mainnet.example.invalid',
    PRESALE_TREASURY_ADDRESS: '2nr1bHFT86W9tGnyvmYW4vcHKsQB3sVQfnddasz4kExM',
    PRESALE_QUOTE_SECRET: secret,
    PRESALE_END_AT: '2099-01-01T00:00:00.000Z',
    SOL_USD_PRICE: '150',
  });
  const store = { list: () => [], findBySignature: () => null, add: value => value };
  const service = new PresaleService(config, store);
  service.reconcileRecent = async () => {};
  service.getSolUsdPrice = async () => ({ value: 150, source: 'test', fetchedAt: Date.now() });
  service.connection.getLatestBlockhash = async () => ({
    blockhash: '11111111111111111111111111111111',
    lastValidBlockHeight: 123,
  });

  const quote = await service.createQuote({
    wallet: '8pM1DN3RiT8vbom5u1sNryaNTMFLx8zK8e8HcN5j8QR4',
    method: 'SOL',
    payAmount: '1',
  });
  const payload = verifyToken(quote.quoteToken, secret);
  assert.equal(quote.usdAmount, '150');
  assert.equal(quote.batcAmount, '30000');
  assert.equal(quote.tokenPriceUsd, '0.005');
  assert.equal(payload.paymentAtomic, '1000000000');
  assert.equal(payload.stageId, 1);
  assert.ok(Buffer.from(quote.transaction, 'base64').length > 0);

  const state = await service.state();
  const activeStage = state.stages.find(stage => stage.id === state.currentStageId);
  assert.equal(state.currentStageId, 1);
  assert.equal(state.currentPriceSol, activeStage.priceSol);
  assert.equal(Number(state.currentPriceSol) * 150, 0.005);
});
