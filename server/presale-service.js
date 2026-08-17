const crypto = require('node:crypto');
const {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} = require('@solana/web3.js');

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const MEMO_PREFIX = 'BATC-PRESALE-V1:';
const TOKEN_SCALE = 1_000_000n;
const USD_SCALE = 1_000_000n;
const QUOTE_TTL_MS = 5 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 60 * 1000;

function parseDecimalToAtomic(value, decimals) {
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error('Payment amount is required.');
  const normalized = String(value).trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) throw new Error('Enter a valid positive payment amount.');
  const [whole, fraction = ''] = normalized.split('.');
  if (fraction.length > decimals) throw new Error(`Use no more than ${decimals} decimal places.`);
  const atomic = BigInt(whole) * 10n ** BigInt(decimals)
    + BigInt((fraction + '0'.repeat(decimals)).slice(0, decimals));
  if (atomic <= 0n) throw new Error('Payment amount must be greater than zero.');
  return atomic;
}

function decimalString(value, decimals) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const divisor = 10n ** BigInt(decimals);
  const whole = absolute / divisor;
  const fraction = (absolute % divisor).toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function signPayload(payload, secret) {
  const encoded = base64Url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyToken(token, secret) {
  const [encoded, suppliedSignature] = String(token || '').split('.');
  if (!encoded || !suppliedSignature) throw new Error('Invalid quote token.');
  const expectedSignature = crypto.createHmac('sha256', secret).update(encoded).digest();
  const supplied = Buffer.from(suppliedSignature, 'base64url');
  if (supplied.length !== expectedSignature.length || !crypto.timingSafeEqual(supplied, expectedSignature)) {
    throw new Error('Quote signature is invalid.');
  }
  return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
}

function withTimeout(promise, milliseconds, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), milliseconds);
    }),
  ]).finally(() => clearTimeout(timer));
}

function associatedTokenAddress(mint, owner) {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

function createAssociatedTokenAccountInstruction(payer, address, owner, mint) {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: address, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.alloc(0),
  });
}

function createTransferCheckedInstruction(source, mint, destination, owner, amount, decimals) {
  const data = Buffer.alloc(10);
  data.writeUInt8(12, 0);
  data.writeBigUInt64LE(amount, 1);
  data.writeUInt8(decimals, 9);
  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    data,
  });
}

class PresaleService {
  constructor(config, store) {
    this.config = config;
    this.store = store;
    this.connection = new Connection(config.rpcUrl, {
      commitment: 'confirmed',
      fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(8000) }),
    });
    this.priceCache = null;
    this.reconcilePromise = null;
    this.lastReconciledAt = 0;
  }

  isConfigured() {
    return Boolean(this.config.treasury && this.config.quoteSecret.length >= 32);
  }

  async getSolUsdPrice() {
    const now = Date.now();
    if (this.priceCache && now - this.priceCache.fetchedAt < 30_000) return this.priceCache;

    if (this.config.pythFeedId) {
      try {
        const endpoint = new URL(`${this.config.pythHermesUrl.replace(/\/$/, '')}/v2/updates/price/latest`);
        endpoint.searchParams.append('ids[]', this.config.pythFeedId.replace(/^0x/, ''));
        const headers = this.config.pythApiKey ? { Authorization: `Bearer ${this.config.pythApiKey}` } : {};
        const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error(`Pyth returned ${response.status}.`);
        const body = await response.json();
        const parsed = body.parsed?.[0]?.price;
        const value = Number(parsed?.price) * (10 ** Number(parsed?.expo));
        if (!Number.isFinite(value) || value <= 0) throw new Error('Pyth returned an invalid SOL price.');
        this.priceCache = { value, source: 'Pyth SOL/USD', publishTime: parsed.publish_time, fetchedAt: now };
        return this.priceCache;
      } catch (error) {
        console.warn('Pyth price lookup failed; using the configured test price.', error.message);
      }
    }

    this.priceCache = { value: this.config.fixedSolUsd, source: 'Configured test rate', publishTime: null, fetchedAt: now };
    return this.priceCache;
  }

  aggregate() {
    const records = this.store.list();
    const totals = new Map(this.config.stages.map(stage => [stage.id, { soldMicros: 0n, raisedMicros: 0n }]));
    for (const record of records) {
      const total = totals.get(record.stageId);
      if (!total) continue;
      total.soldMicros += BigInt(record.tokenMicros);
      total.raisedMicros += BigInt(record.usdMicros);
    }
    return { records, totals };
  }

  currentStage(totals) {
    return this.config.stages.find(stage => totals.get(stage.id).soldMicros < stage.allocationMicros) || null;
  }

  async state({ reconcile = true } = {}) {
    let chainStatus = this.isConfigured() ? 'live' : 'unconfigured';
    if (reconcile && this.isConfigured()) {
      try {
        await withTimeout(this.reconcileRecent(), 6000, 'Solana testnet RPC timed out.');
      } catch (error) {
        chainStatus = 'degraded';
        console.warn('Testnet reconciliation is temporarily unavailable.', error.message);
      }
    }
    const { records, totals } = this.aggregate();
    const current = this.currentStage(totals);
    const solPrice = await this.getSolUsdPrice();
    const totalRaisedMicros = [...totals.values()].reduce((sum, value) => sum + value.raisedMicros, 0n);
    const totalSoldMicros = [...totals.values()].reduce((sum, value) => sum + value.soldMicros, 0n);
    const targetMicros = this.config.stages.reduce(
      (sum, stage) => sum + (stage.priceMicros * stage.allocationMicros / TOKEN_SCALE),
      0n,
    );
    const priceSol = stage => (Number(stage.priceMicros) / Number(USD_SCALE) / solPrice.value).toString();

    return {
      configured: this.isConfigured(),
      chainStatus,
      network: this.config.network,
      rpcUrl: this.config.rpcUrl,
      treasury: this.config.treasury?.toBase58() || null,
      endAt: this.config.endAt.toISOString(),
      ended: Date.now() >= this.config.endAt.getTime() || !current,
      raisedUsd: decimalString(totalRaisedMicros, 6),
      targetUsd: decimalString(targetMicros, 6),
      soldBatc: decimalString(totalSoldMicros, 6),
      participants: new Set(records.map(record => record.wallet)).size,
      currentStageId: current?.id || null,
      currentPriceUsd: current ? decimalString(current.priceMicros, 6) : null,
      currentPriceSol: current ? priceSol(current) : null,
      solUsdPrice: String(solPrice.value),
      priceSource: solPrice.source,
      paymentMethods: { SOL: true, USDC: Boolean(this.config.usdcMint) },
      stages: this.config.stages.map(stage => {
        const stageTotal = totals.get(stage.id);
        const sold = stageTotal.soldMicros > stage.allocationMicros ? stage.allocationMicros : stageTotal.soldMicros;
        return {
          id: stage.id,
          label: stage.label,
          priceUsd: decimalString(stage.priceMicros, 6),
          priceSol: priceSol(stage),
          allocationBatc: decimalString(stage.allocationMicros, 6),
          soldBatc: decimalString(sold, 6),
          raisedUsd: decimalString(stageTotal.raisedMicros, 6),
          status: sold >= stage.allocationMicros ? 'sold-out' : stage.id === current?.id ? 'active' : 'upcoming',
        };
      }),
      updatedAt: new Date().toISOString(),
    };
  }

  async createQuote({ wallet, method, payAmount }) {
    if (!this.isConfigured()) throw new Error('Presale backend is not configured yet.');
    if (Date.now() >= this.config.endAt.getTime()) throw new Error('The presale has ended.');

    const buyer = new PublicKey(wallet);
    const normalizedMethod = String(method || '').toUpperCase();
    if (!['SOL', 'USDC'].includes(normalizedMethod)) throw new Error('Unsupported payment method.');
    if (normalizedMethod === 'USDC' && !this.config.usdcMint) throw new Error('Test USDC payments are not configured yet.');

    await withTimeout(this.reconcileRecent(), 6000, 'Solana testnet RPC timed out.');
    const { totals } = this.aggregate();
    const stage = this.currentStage(totals);
    if (!stage) throw new Error('All presale stages are sold out.');

    const paymentAtomic = parseDecimalToAtomic(payAmount, normalizedMethod === 'SOL' ? 9 : 6);
    if (paymentAtomic > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Payment amount is too large.');
    const solPrice = await this.getSolUsdPrice();
    const solUsdMicros = BigInt(Math.round(solPrice.value * 1_000_000));
    const usdMicros = normalizedMethod === 'SOL'
      ? paymentAtomic * solUsdMicros / BigInt(LAMPORTS_PER_SOL)
      : paymentAtomic;
    const tokenMicros = usdMicros * TOKEN_SCALE / stage.priceMicros;
    if (tokenMicros <= 0n) throw new Error('Payment is too small for the current stage.');

    const remaining = stage.allocationMicros - totals.get(stage.id).soldMicros;
    if (tokenMicros > remaining) {
      throw new Error(`Only ${decimalString(remaining, 6)} BATC remain in ${stage.label}.`);
    }

    const now = Date.now();
    const payload = {
      v: 1,
      id: crypto.randomUUID(),
      wallet: buyer.toBase58(),
      method: normalizedMethod,
      paymentAtomic: paymentAtomic.toString(),
      usdMicros: usdMicros.toString(),
      tokenMicros: tokenMicros.toString(),
      stageId: stage.id,
      issuedAt: now,
      expiresAt: now + QUOTE_TTL_MS,
    };
    const quoteToken = signPayload(payload, this.config.quoteSecret);
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
    const transaction = new Transaction({ feePayer: buyer, recentBlockhash: blockhash });

    if (normalizedMethod === 'SOL') {
      transaction.add(SystemProgram.transfer({
        fromPubkey: buyer,
        toPubkey: this.config.treasury,
        lamports: Number(paymentAtomic),
      }));
    } else {
      const source = associatedTokenAddress(this.config.usdcMint, buyer);
      const destination = associatedTokenAddress(this.config.usdcMint, this.config.treasury);
      if (!await this.connection.getAccountInfo(destination, 'confirmed')) {
        transaction.add(createAssociatedTokenAccountInstruction(buyer, destination, this.config.treasury, this.config.usdcMint));
      }
      transaction.add(createTransferCheckedInstruction(source, this.config.usdcMint, destination, buyer, paymentAtomic, 6));
    }

    transaction.add(new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [],
      data: Buffer.from(`${MEMO_PREFIX}${quoteToken}`, 'utf8'),
    }));

    return {
      quoteToken,
      transaction: transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64'),
      blockhash,
      lastValidBlockHeight,
      expiresAt: new Date(payload.expiresAt).toISOString(),
      stageId: stage.id,
      stageLabel: stage.label,
      method: normalizedMethod,
      payAmount: decimalString(paymentAtomic, normalizedMethod === 'SOL' ? 9 : 6),
      usdAmount: decimalString(usdMicros, 6),
      batcAmount: decimalString(tokenMicros, 6),
      tokenPriceUsd: decimalString(stage.priceMicros, 6),
      treasury: this.config.treasury.toBase58(),
      network: this.config.network,
      priceSource: normalizedMethod === 'SOL' ? solPrice.source : 'USDC nominal value',
    };
  }

  memoFromTransaction(transaction) {
    for (const instruction of transaction.transaction.message.instructions) {
      const programId = instruction.programId?.toBase58?.() || '';
      if (programId !== MEMO_PROGRAM_ID.toBase58()) continue;
      if (typeof instruction.parsed === 'string') return instruction.parsed;
      if (typeof instruction.parsed === 'object' && typeof instruction.parsed?.info === 'string') return instruction.parsed.info;
    }
    return null;
  }

  paymentMatches(transaction, payload) {
    if (transaction.meta?.err) return false;
    const signerKeys = transaction.transaction.message.accountKeys
      .filter(key => key.signer)
      .map(key => key.pubkey.toBase58());
    if (!signerKeys.includes(payload.wallet)) return false;

    const instructions = transaction.transaction.message.instructions;
    if (payload.method === 'SOL') {
      return instructions.some(instruction => {
        const parsed = instruction.parsed;
        return instruction.program === 'system'
          && parsed?.type === 'transfer'
          && parsed.info?.source === payload.wallet
          && parsed.info?.destination === this.config.treasury.toBase58()
          && BigInt(parsed.info?.lamports || 0) === BigInt(payload.paymentAtomic);
      });
    }

    if (!this.config.usdcMint) return false;
    const expectedDestination = associatedTokenAddress(this.config.usdcMint, this.config.treasury).toBase58();
    return instructions.some(instruction => {
      const parsed = instruction.parsed;
      return instruction.program === 'spl-token'
        && parsed?.type === 'transferChecked'
        && parsed.info?.authority === payload.wallet
        && parsed.info?.destination === expectedDestination
        && parsed.info?.mint === this.config.usdcMint.toBase58()
        && BigInt(parsed.info?.tokenAmount?.amount || 0) === BigInt(payload.paymentAtomic);
    });
  }

  recordFromTransaction(signature, transaction, payload) {
    const memo = this.memoFromTransaction(transaction);
    if (memo !== `${MEMO_PREFIX}${signPayload(payload, this.config.quoteSecret)}`) {
      throw new Error('The transaction is missing its verified presale memo.');
    }
    if (!this.paymentMatches(transaction, payload)) throw new Error('The confirmed payment does not match the presale quote.');
    if (transaction.blockTime && transaction.blockTime * 1000 > payload.expiresAt + MAX_CLOCK_SKEW_MS) {
      throw new Error('The payment was confirmed after its quote expired.');
    }
    return {
      signature,
      quoteId: payload.id,
      wallet: payload.wallet,
      method: payload.method,
      paymentAtomic: payload.paymentAtomic,
      usdMicros: payload.usdMicros,
      tokenMicros: payload.tokenMicros,
      stageId: payload.stageId,
      confirmedAt: transaction.blockTime ? new Date(transaction.blockTime * 1000).toISOString() : new Date().toISOString(),
      slot: transaction.slot,
    };
  }

  async verifyPurchase({ signature, quoteToken }) {
    if (!this.isConfigured()) throw new Error('Presale backend is not configured yet.');
    if (!/^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(String(signature || ''))) throw new Error('Invalid transaction signature.');
    const existing = this.store.findBySignature(signature);
    if (existing) return { purchase: existing, state: await this.state({ reconcile: false }) };

    const payload = verifyToken(quoteToken, this.config.quoteSecret);
    const transaction = await this.connection.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    if (!transaction) throw new Error('Transaction is not confirmed on Solana testnet yet.');
    const record = this.store.add(this.recordFromTransaction(signature, transaction, payload));
    return { purchase: record, state: await this.state({ reconcile: false }) };
  }

  async reconcileRecent() {
    if (!this.isConfigured()) return;
    if (Date.now() - this.lastReconciledAt < 30_000) return;
    if (this.reconcilePromise) return this.reconcilePromise;
    this.reconcilePromise = (async () => {
      try {
        const signatures = await this.connection.getSignaturesForAddress(this.config.treasury, { limit: 100 }, 'confirmed');
        for (const item of signatures.reverse()) {
          if (item.err || this.store.findBySignature(item.signature)) continue;
          const transaction = await this.connection.getParsedTransaction(item.signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          });
          if (!transaction) continue;
          const memo = this.memoFromTransaction(transaction);
          if (!memo?.startsWith(MEMO_PREFIX)) continue;
          try {
            const quoteToken = memo.slice(MEMO_PREFIX.length);
            const payload = verifyToken(quoteToken, this.config.quoteSecret);
            this.store.add(this.recordFromTransaction(item.signature, transaction, payload));
          } catch (error) {
            console.warn(`Ignored invalid presale transaction ${item.signature}:`, error.message);
          }
        }
      } finally {
        this.lastReconciledAt = Date.now();
        this.reconcilePromise = null;
      }
    })();
    return this.reconcilePromise;
  }
}

module.exports = {
  PresaleService,
  decimalString,
  parseDecimalToAtomic,
  signPayload,
  verifyToken,
};
