/* =========================================================
   BATTLE CITIES // SOLANA TOKEN SITE — SCRIPT
   ========================================================= */

// Presale figures are loaded from the backend. Confirmed Solana transactions,
// rather than browser constants, are the source of truth.
const PRESALE_API_BASE = document.querySelector('meta[name="presale-api-base"]')?.content?.replace(/\/$/, '') || '';
let presaleState = null;
let presaleRefreshTimer = null;

// DEPLOYMENT HANDOFF STORYBOARD
// 0ms    reset any cached animation state
// 0ms    close the doors and reveal the deployment overlay
// 1080ms arrive at the requested game or site route
const DEPLOYMENT_TIMING = {
  handoff: 1080,
};

let deploymentInProgress = false;
let deploymentTimer = null;

function resetDeployment(){
  const overlay = document.getElementById('deploymentOverlay');
  if (deploymentTimer) window.clearTimeout(deploymentTimer);
  deploymentTimer = null;
  deploymentInProgress = false;
  if (!overlay) return;
  overlay.classList.remove('is-active');
  overlay.setAttribute('aria-hidden', 'true');
}

// Reusable game/page handoff. Add data-deployment-url to any future route that
// should show the elevator deployment sequence before navigation.
function beginDeployment(event){
  event.preventDefault();
  if (deploymentInProgress) return;
  const destination = event.currentTarget.dataset.deploymentUrl || event.currentTarget.href;
  const overlay = document.getElementById('deploymentOverlay');
  const sector = event.currentTarget.dataset.deploymentSector || '01';
  const sectorLabel = document.getElementById('deploymentSector');
  if (!overlay || !destination) {
    window.location.assign(destination);
    return;
  }
  sectorLabel.textContent = `SECTOR ${sector.padStart(2, '0')}`;
  deploymentInProgress = true;
  overlay.setAttribute('aria-hidden', 'false');

  // The site can return from the game through the browser's back-forward
  // cache. Removing the class and forcing one layout read resets every CSS
  // keyframe so the same transition plays on every Play click.
  overlay.classList.remove('is-active');
  void overlay.offsetWidth;
  overlay.classList.add('is-active');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  deploymentTimer = window.setTimeout(
    () => window.location.assign(destination),
    reducedMotion ? 0 : DEPLOYMENT_TIMING.handoff
  );
}

document.querySelectorAll('[data-deployment-url]').forEach(link => {
  link.addEventListener('click', beginDeployment);
});

// pageshow also fires when restoring this page from bfcache after the user
// returns from the game. The animation must be idle before its next replay.
window.addEventListener('pageshow', resetDeployment);

// Public game presence: authenticated players send heartbeats in the game;
// this website only reads the aggregate count and never sends credentials.
async function updatePresence(){
  const onlineCount = document.getElementById('online-count');
  const inGameCount = document.getElementById('in-game-count');
  if (!onlineCount || !inGameCount) return;
  try {
    const response = await fetch('https://api.battlecities.com/api/presence', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Presence request failed: ${response.status}`);
    const presence = await response.json();
    onlineCount.textContent = Number.isFinite(presence.online) ? presence.online : '--';
    inGameCount.textContent = Number.isFinite(presence.inGame) ? presence.inGame : '--';
  } catch (error) {
    // Retain the last known values rather than making the navigation jump on a transient failure.
    console.warn('Unable to update game presence.', error);
  }
}

updatePresence();
setInterval(updatePresence, 30000);

// Authenticated website presence: visitors outside gameplay are online but not
// in-game. The API session determines whether this heartbeat is accepted.
const PRESENCE_ENDPOINT = 'https://api.battlecities.com/api/presence';
const websitePresencePayload = JSON.stringify({ inGame: false, gameMode: null });

async function sendWebsitePresence(){
  try {
    const response = await fetch(PRESENCE_ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: websitePresencePayload,
    });
    // A visitor without an authenticated game/API session is expected to be rejected.
    if (!response.ok && response.status !== 401) {
      throw new Error(`Presence heartbeat failed: ${response.status}`);
    }
  } catch (error) {
    console.warn('Unable to send website presence heartbeat.', error);
  }
}

function clearWebsitePresence(){
  // keepalive allows the request to complete while the page is closing.
  fetch(PRESENCE_ENDPOINT, {
    method: 'DELETE',
    credentials: 'include',
    keepalive: true,
  }).catch(() => {});
}

sendWebsitePresence();
setInterval(sendWebsitePresence, 30000);
window.addEventListener('pagehide', clearWebsitePresence);

// Token allocation breakdown used to render the allocation bars below
const allocations = [
  { name: "Public Sale", pct: 39 },
  { name: "Ecosystem & Rewards", pct: 20 },
  { name: "Liquidity & Staking", pct: 15 },
  { name: "Marketing", pct: 10 },
  { name: "Team", pct: 10 },
  { name: "Treasury", pct: 5 },
  { name: "Private Presale", pct: 1 },
];

// Build the allocation bar list dynamically from the array above
const list = document.getElementById('alloc-list');
allocations.forEach(a => {
  const item = document.createElement('div');
  item.className = 'alloc-item';
  item.innerHTML = `
    <div class="alloc-top"><span class="name">${a.name}</span><span class="pct">${a.pct}%</span></div>
    <div class="alloc-track"><div class="alloc-fill" style="width:0%" data-pct="${a.pct}"></div></div>`;
  list.appendChild(item);
});

// Animate the allocation fills in on load (width:0 -> actual %) using the CSS transition
requestAnimationFrame(() => {
  document.querySelectorAll('.alloc-fill').forEach(el => {
    el.style.width = el.dataset.pct + '%';
  });
});

// Build the segmented presale progress bar and update its lit segments in place.
const track = document.getElementById('progress-track');
const totalSeg = 40;
for(let i=0;i<totalSeg;i++){
  const s = document.createElement('div');
  s.className = 'seg';
  track.appendChild(s);
}

function renderProgress(percent){
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  const onSeg = Math.round(totalSeg * safePercent / 100);
  [...track.children].forEach((segment, index) => segment.classList.toggle('on', index < onSeg));
  document.getElementById('progress-pct').textContent = String(Math.round(safePercent));
}

// Fixed target timestamp so the countdown counts down to the same moment
// for every visitor instead of resetting on every page load.
let endDate = new Date('2026-09-13T00:00:00Z');
function updateCountdown(){
  const now = new Date();
  let diff = Math.max(0, endDate - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  document.getElementById('cd-d').textContent = String(d).padStart(2,'0');
  document.getElementById('cd-h').textContent = String(h).padStart(2,'0');
  document.getElementById('cd-m').textContent = String(m).padStart(2,'0');
  document.getElementById('cd-s').textContent = String(s).padStart(2,'0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

let currentMethod = 'SOL';
let phantomProvider = null;
let connectedWallet = null;
let pendingQuote = null;
let walletConnectionInFlight = false;
let boundPhantomProvider = null;

const quickAmountPresets = {
  SOL: [{ label: '0.5 SOL', value: 0.5 }, { label: '1 SOL', value: 1 }, { label: 'MAX', value: 'max' }],
  USDC: [{ label: '100 USDC', value: 100 }, { label: '250 USDC', value: 250 }],
};

// Fixed SOL price for each public presale stage. Quotes reference a stage ID,
// so the review dialog can always show the exact stage price before signing.
const stagePricesSol = Object.freeze({
  1: '0.00004',
  2: '0.000066667',
  3: '0.00008',
});

function safeNumber(value){
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatFiat(value){
  const number = safeNumber(value);
  if (number === null) return '--';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Object.is(number, -0) ? 0 : number);
}

function formatSol(value){
  const number = safeNumber(value);
  if (number === null) return '--';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 9 }).format(Object.is(number, -0) ? 0 : number);
}

function formatTokenAmount(value, detailed = false){
  const number = safeNumber(value);
  if (number === null) return '--';
  if (number === 0) return '0';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: detailed ? 6 : 2,
    notation: !detailed && Math.abs(number) >= 1000000 ? 'compact' : 'standard',
  }).format(number);
}

function formatQuoteTokenPrice(quote){
  const stagePrice = stagePricesSol[quote.stageId];
  if (stagePrice) return `${formatSol(stagePrice)} SOL`;

  const payAmount = safeNumber(quote.payAmount);
  const batcAmount = safeNumber(quote.batcAmount);
  return payAmount !== null && batcAmount > 0
    ? `${formatSol(payAmount / batcAmount)} SOL`
    : '--';
}

function truncateAddress(address, chars = 4){
  return address ? `${address.slice(0, chars)}...${address.slice(-chars)}` : '--';
}

function setPurchaseStatus(message = '', type = 'info', link = null, linkLabel = 'View transaction ↗'){
  const status = document.getElementById('purchase-status');
  status.className = `purchase-status ${message ? `is-${type}` : ''}`;
  status.replaceChildren();
  if (!message) return;
  const text = document.createElement('span');
  text.textContent = message;
  status.appendChild(text);
  if (link) {
    const anchor = document.createElement('a');
    anchor.href = link;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    anchor.textContent = linkLabel;
    status.appendChild(anchor);
  }
}

async function apiRequest(path, options = {}){
  const response = await fetch(`${PRESALE_API_BASE}${path}`, {
    cache: 'no-store',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

function renderStage(stage){
  const row = document.querySelector(`[data-stage-id="${stage.id}"]`);
  if (!row) return;
  row.classList.toggle('active', stage.status === 'active');
  row.classList.toggle('sold-out', stage.status === 'sold-out');
  row.querySelector('[data-stage-price]').textContent = `${formatSol(stage.priceSol)} SOL`;
  row.querySelector('[data-stage-sold]').textContent = formatTokenAmount(stage.soldBatc);
  const allocation = safeNumber(stage.allocationBatc) || 0;
  const sold = safeNumber(stage.soldBatc) || 0;
  row.querySelector('[data-stage-remaining]').textContent = formatTokenAmount(Math.max(0, allocation - sold));
  const icon = stage.status === 'active' ? 'flame' : stage.status === 'sold-out' ? 'check' : 'lock';
  row.querySelector('.tag').innerHTML = `<svg data-lucide="${icon}" class="icon"></svg>${stage.label}`;
}

function renderPresaleState(state){
  presaleState = state;
  endDate = new Date(state.endAt);
  updateCountdown();
  const activeStage = state.stages.find(stage => stage.id === state.currentStageId) || null;
  const allocation = safeNumber(activeStage?.allocationBatc) || 0;
  const soldInStage = safeNumber(activeStage?.soldBatc) || 0;
  const available = Math.max(0, allocation - soldInStage);
  document.getElementById('available-batc').textContent = `${formatTokenAmount(available, true)} BATC`;
  document.getElementById('stage-allocation').textContent = activeStage
    ? `${activeStage.label} allocation: ${formatTokenAmount(allocation, true)} BATC`
    : 'All presale stages are sold out';
  document.getElementById('participant-count').textContent = formatTokenAmount(state.participants, true);
  document.getElementById('total-sold').textContent = `${formatTokenAmount(state.soldBatc, true)} BATC`;
  const totalAvailable = state.stages.reduce((sum, stage) => {
    const stageAllocation = safeNumber(stage.allocationBatc) || 0;
    const stageSold = safeNumber(stage.soldBatc) || 0;
    return sum + Math.max(0, stageAllocation - stageSold);
  }, 0);
  document.getElementById('total-available').textContent = `${formatTokenAmount(totalAvailable, true)} BATC`;
  const progress = allocation > 0 ? soldInStage / allocation * 100 : 0;
  renderProgress(progress);
  document.getElementById('hero-presale-sold').textContent = `${Math.round(progress)}%`;
  state.stages.forEach(renderStage);

  const currentPrice = `${formatSol(state.currentPriceSol)} SOL`;
  document.getElementById('token-price').textContent = currentPrice;
  document.getElementById('hero-current-price').textContent = currentPrice;
  updateRateText();
  calc();

  const button = document.getElementById('buy-button');
  button.disabled = !state.configured || state.ended;
  if (!state.configured) {
    setPurchaseStatus('Testnet treasury is not configured. Add the server environment values to enable payments.', 'warning');
  } else if (state.ended) {
    setPurchaseStatus('The presale is closed.', 'warning');
  }
  if (window.lucide) lucide.createIcons();
}

async function refreshPresaleState({ quiet = false } = {}){
  try {
    const state = await apiRequest('/api/presale/state');
    renderPresaleState(state);
    if (state.chainStatus === 'degraded') {
      setPurchaseStatus('Testnet RPC is temporarily unavailable. Showing the last verified totals.', 'warning');
    } else if (!quiet && state.configured && !state.ended) {
      setPurchaseStatus('Live testnet data loaded.', 'success');
    }
  } catch (error) {
    if (!quiet) setPurchaseStatus(`${error.message} Retry in a moment.`, 'error');
  }
}

function updateRateText(){
  const price = safeNumber(presaleState?.currentPriceSol);
  const rate = price ? 1 / price : null;
  document.getElementById('rateText').textContent = rate === null
    ? 'Rate unavailable'
    : `1 SOL = ${formatTokenAmount(rate, true)} BATC`;
  document.getElementById('rateText').title = presaleState?.priceSource || '';
}

function renderQuickAmounts(){
  const wrap = document.getElementById('quickAmounts');
  wrap.innerHTML = '';
  quickAmountPresets[currentMethod].forEach(preset => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quick-amt';
    btn.textContent = preset.label;
    btn.onclick = async () => {
      try {
        let value = preset.value;
        if (value === 'max') {
          if (!connectedWallet) throw new Error('Connect Phantom to load your testnet balance.');
          const connection = new solanaWeb3.Connection(presaleState.rpcUrl, 'confirmed');
          const lamports = await connection.getBalance(new solanaWeb3.PublicKey(connectedWallet), 'confirmed');
          const walletMax = Math.max(0, (lamports - 10000000) / solanaWeb3.LAMPORTS_PER_SOL);
          const saleMax = safeNumber(presaleState?.maxPaySol) || 0;
          value = Math.min(walletMax, saleMax).toFixed(9).replace(/\.?(0+)$/, '');
        }
        document.getElementById('payAmount').value = value;
        wrap.querySelectorAll('.quick-amt').forEach(button => button.classList.remove('active'));
        btn.classList.add('active');
        calc();
      } catch (error) {
        setPurchaseStatus(error.message, 'warning');
      }
    };
    wrap.appendChild(btn);
  });
}

function setMethod(method, el){
  if (el.disabled) return;
  currentMethod = method;
  document.querySelectorAll('.buy-tab').forEach(tab => {
    const selected = tab === el;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
  });
  document.getElementById('payUnit').textContent = method;
  updateRateText();
  renderQuickAmounts();
  calc();
}

// COUNT UP/DOWN ANIMATION — the "You Receive" figure eases from its old
// value to the new target instead of snapping, so typing feels responsive
// rather than just re-rendering a number.
let displayedReceive = 0;
let receiveAnimId = null;
function animateReceiveTo(target){
  const el = document.getElementById('receiveAmount');
  const start = displayedReceive;
  const delta = target - start;
  if (receiveAnimId) cancelAnimationFrame(receiveAnimId);
  if (Math.abs(delta) < 0.005) {
    displayedReceive = target;
    el.value = target > 0 ? target.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '';
    return;
  }
  const duration = 280;
  const startTime = performance.now();
  function frame(now){
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    const value = start + delta * eased;
    el.value = value > 0 ? value.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '';
    if (t < 1) {
      receiveAnimId = requestAnimationFrame(frame);
    } else {
      displayedReceive = target;
      receiveAnimId = null;
    }
  }
  receiveAnimId = requestAnimationFrame(frame);
}

// Recalculate "You Receive" based on the current "You Pay" input + selected rate,
// and briefly flash the input box border to give feedback that the value changed
function calc(){
  const payInput = document.getElementById('payAmount');
  let pay = parseFloat(payInput.value) || 0;
  const maxPay = safeNumber(presaleState?.maxPaySol) || 0;
  if (maxPay > 0 && pay > maxPay) {
    pay = maxPay;
    payInput.value = formatSol(maxPay);
  }
  const price = safeNumber(presaleState?.currentPriceSol);
  const target = price ? pay / price : 0;
  animateReceiveTo(target);
  const box = document.getElementById('payBox');
  box.classList.add('pulse-in');
  clearTimeout(box._pulseTimer);
  box._pulseTimer = setTimeout(() => box.classList.remove('pulse-in'), 400);
}

// Triggered on every keystroke in the "You Pay" field
function onPayAmountInput(){
  // Typing a custom amount should deselect any preset button
  document.querySelectorAll('.quick-amt').forEach(b => b.classList.remove('active'));
  calc();
}

function updateWalletUi(publicKey){
  connectedWallet = publicKey?.toString?.() || null;
  const line = document.getElementById('wallet-line');
  line.hidden = !connectedWallet;
  document.getElementById('wallet-address').textContent = truncateAddress(connectedWallet);
  document.getElementById('wallet-address').title = connectedWallet || '';
  document.getElementById('buy-button-label').textContent = connectedWallet ? 'Review Purchase' : 'Connect Phantom';
}

function resetWalletConnection(){
  connectedWallet = null;
  pendingQuote = null;
  updateWalletUi(null);
  const button = document.getElementById('buy-button');
  button.disabled = !presaleState?.configured || presaleState?.ended;
  button.removeAttribute('aria-busy');
}

function getPhantomProvider(){
  const provider = window.phantom?.solana;
  return provider?.isPhantom ? provider : null;
}

function bindPhantomEvents(provider){
  if (!provider || boundPhantomProvider === provider) return;
  boundPhantomProvider = provider;
  provider.on('connect', publicKey => updateWalletUi(publicKey || provider.publicKey));
  provider.on('disconnect', resetWalletConnection);
  provider.on('accountChanged', publicKey => {
    if (publicKey) {
      updateWalletUi(publicKey);
    } else {
      resetWalletConnection();
    }
  });
}

async function connectWallet(){
  if (!presaleState?.configured || presaleState?.ended) return;
  if (walletConnectionInFlight) return;
  const button = document.getElementById('buy-button');
  try {
    if (!connectedWallet) {
      phantomProvider = getPhantomProvider() || phantomProvider;
      if (!phantomProvider) {
        setPurchaseStatus('Phantom is not installed. Install it, then return to continue.', 'warning', 'https://phantom.com/', 'Install Phantom ↗');
        return;
      }
      bindPhantomEvents(phantomProvider);
      walletConnectionInFlight = true;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      document.getElementById('buy-button-label').textContent = 'Connecting…';
      const response = await phantomProvider.connect();
      const publicKey = response?.publicKey || phantomProvider.publicKey;
      if (!publicKey) throw new Error('Phantom did not return a wallet address. Unlock Phantom and try again.');
      updateWalletUi(publicKey);
      setPurchaseStatus('Phantom connected to the testnet purchase flow.', 'success');
      return;
    }
    await reviewPurchase();
  } catch (error) {
    if (error.code !== 4001) setPurchaseStatus(error.message || 'Could not connect Phantom.', 'error');
  } finally {
    walletConnectionInFlight = false;
    button.disabled = !presaleState?.configured || presaleState?.ended;
    button.removeAttribute('aria-busy');
    if (connectedWallet) document.getElementById('buy-button-label').textContent = 'Review Purchase';
  }
}

async function reviewPurchase(){
  const payAmount = document.getElementById('payAmount').value.trim();
  if (!payAmount || Number(payAmount) <= 0) {
    setPurchaseStatus('Enter the amount you want to pay first.', 'warning');
    document.getElementById('payAmount').focus();
    return;
  }
  setPurchaseStatus('Creating a verified five-minute quote…', 'info');
  pendingQuote = await apiRequest('/api/presale/quote', {
    method: 'POST',
    body: JSON.stringify({ wallet: connectedWallet, method: currentMethod, payAmount }),
  });
  document.getElementById('confirm-pay').textContent = `${pendingQuote.payAmount} ${pendingQuote.method}`;
  document.getElementById('confirm-receive').textContent = `${formatTokenAmount(pendingQuote.batcAmount, true)} BATC`;
  document.getElementById('confirm-price').textContent = formatQuoteTokenPrice(pendingQuote);
  document.getElementById('confirm-stage').textContent = pendingQuote.stageLabel;
  document.getElementById('confirm-treasury').textContent = truncateAddress(pendingQuote.treasury, 6);
  document.getElementById('confirm-treasury').title = pendingQuote.treasury;
  document.getElementById('purchase-dialog').showModal();
  setPurchaseStatus('Review the exact testnet transfer before signing.', 'info');
}

async function submitPurchase(){
  if (!pendingQuote || !phantomProvider) return;
  const confirmButton = document.getElementById('confirm-purchase');
  confirmButton.disabled = true;
  confirmButton.setAttribute('aria-busy', 'true');
  confirmButton.textContent = 'Waiting for Phantom…';
  try {
    const bytes = Uint8Array.from(atob(pendingQuote.transaction), character => character.charCodeAt(0));
    const transaction = solanaWeb3.Transaction.from(bytes);
    const connection = new solanaWeb3.Connection(presaleState.rpcUrl, 'confirmed');
    const simulation = await connection.simulateTransaction(transaction);
    if (simulation.value.err) throw new Error('The testnet transaction did not pass simulation. Check your balance and try again.');

    const { signature } = await phantomProvider.signAndSendTransaction(transaction);
    document.getElementById('purchase-dialog').close();
    const explorer = `https://explorer.solana.com/tx/${signature}?cluster=testnet`;
    setPurchaseStatus('Transaction submitted. Waiting for testnet confirmation…', 'info', explorer);
    await connection.confirmTransaction({
      signature,
      blockhash: pendingQuote.blockhash,
      lastValidBlockHeight: pendingQuote.lastValidBlockHeight,
    }, 'confirmed');
    await apiRequest('/api/presale/verify', {
      method: 'POST',
      body: JSON.stringify({ signature, quoteToken: pendingQuote.quoteToken }),
    });
    document.getElementById('payAmount').value = '';
    animateReceiveTo(0);
    pendingQuote = null;
    await refreshPresaleState({ quiet: true });
    setPurchaseStatus('Payment confirmed. Your BATC allocation is recorded.', 'success', explorer);
  } catch (error) {
    if (error.code === 4001) {
      setPurchaseStatus('Transaction cancelled. No payment was sent.', 'info');
    } else {
      setPurchaseStatus(error.message || 'The transaction could not be completed.', 'error');
    }
  } finally {
    confirmButton.disabled = false;
    confirmButton.removeAttribute('aria-busy');
    confirmButton.textContent = 'Confirm in Phantom';
  }
}

document.getElementById('confirm-purchase').addEventListener('click', submitPurchase);
document.getElementById('copy-wallet').addEventListener('click', async () => {
  if (!connectedWallet) return;
  await navigator.clipboard.writeText(connectedWallet);
  setPurchaseStatus('Wallet address copied.', 'success');
});
document.getElementById('confirm-treasury').addEventListener('click', async () => {
  if (!pendingQuote?.treasury) return;
  await navigator.clipboard.writeText(pendingQuote.treasury);
  document.getElementById('confirm-treasury').textContent = 'Copied';
  window.setTimeout(() => {
    if (pendingQuote) document.getElementById('confirm-treasury').textContent = truncateAddress(pendingQuote.treasury, 6);
  }, 1200);
});
document.getElementById('disconnect-wallet').addEventListener('click', async () => {
  const provider = phantomProvider;
  const disconnectButton = document.getElementById('disconnect-wallet');
  disconnectButton.disabled = true;
  try {
    await provider?.disconnect();
  } catch (error) {
    console.warn('Unable to disconnect Phantom.', error);
  } finally {
    resetWalletConnection();
    phantomProvider = null;
    disconnectButton.disabled = false;
    setPurchaseStatus('Phantom disconnected. You can connect again whenever you are ready.', 'info');
  }
});

renderQuickAmounts();
refreshPresaleState();
presaleRefreshTimer = window.setInterval(() => refreshPresaleState({ quiet: true }), 15000);

window.addEventListener('load', async () => {
  phantomProvider = getPhantomProvider();
  if (!phantomProvider) return;
  bindPhantomEvents(phantomProvider);
  try {
    const response = await phantomProvider.connect({ onlyIfTrusted: true });
    updateWalletUi(response.publicKey);
  } catch {}
});

// Notify-me form — front-end only for this static demo. Wire this up to
// a real mailing-list endpoint (Mailchimp, backend API, etc.) to actually
// store submitted addresses.
function subscribeEmail(event){
  event.preventDefault();
  const input = document.getElementById('notifyEmail');
  const status = document.getElementById('notifyStatus');
  const email = input.value.trim();
  if(!email) return false;
  status.innerHTML = `You're on the list — we'll email <b style="color:var(--white)">${email}</b> at launch.`;
  input.value = '';
  return false;
}

// Initialize Lucide icons once the DOM (and again once all assets) has loaded
window.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
});
window.addEventListener('load', () => {
  if (window.lucide) lucide.createIcons();
});

// Bottom nav active-state tracking (Android-app style tab highlight).
// Uses IntersectionObserver to highlight whichever tracked section is
// currently in view as the user scrolls.
const bnItems = document.querySelectorAll('.bn-item');
const trackedSections = ['hero', 'tokenomics', 'timeline'];
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      bnItems.forEach(item => {
        if (item.classList.contains('bn-cta')) return;
        item.classList.toggle('active', item.dataset.section === id);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

trackedSections.forEach(id => {
  const el = document.getElementById(id);
  if (el) observer.observe(el);
});

// Scroll-reveal: fade/slide elements in the first time they enter view.
// Skipped entirely (all elements shown immediately) if the user prefers reduced motion.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealEls = document.querySelectorAll('.reveal');
function enableNativeReveals(){
  const revealElement = (el) => {
    el.classList.add('in-view');
    revealObserver.unobserve(el);
  };
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) revealElement(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  let revealFrame = null;
  const revealSkippedSections = () => {
    revealFrame = null;
    revealEls.forEach(el => {
      if (el.classList.contains('in-view')) return;
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.9) revealElement(el);
    });
  };
  const queueRevealCheck = () => {
    if (revealFrame !== null) return;
    revealFrame = requestAnimationFrame(revealSkippedSections);
  };
  window.addEventListener('scroll', queueRevealCheck, { passive: true });
  window.addEventListener('resize', queueRevealCheck);
  queueRevealCheck();
}

// ScrollTrigger observes the actual scroll position instead of relying only
// on intersection events, so momentum scrolling cannot strand a section at
// opacity: 0. The native path keeps the site usable if the CDN is unavailable.
window.addEventListener('load', () => {
  if (prefersReducedMotion) {
    revealEls.forEach(el => el.classList.add('in-view'));
    return;
  }
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    revealEls.forEach((el) => {
      // CSS transitions and JS tweening fight each other during fast scrolls.
      // Let GSAP own the reveal until it completes, then restore the CSS state.
      el.style.transition = 'none';
      gsap.fromTo(el, { y: 14, autoAlpha: 0 }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.28,
        ease: 'power2.out',
        onComplete: () => {
          el.classList.add('in-view');
          el.style.transition = '';
          gsap.set(el, { clearProps: 'transform,opacity,visibility' });
        },
        scrollTrigger: { trigger: el, start: 'top 88%', once: true, fastScrollEnd: true }
      });
    });
    ScrollTrigger.refresh();
    return;
  }
  enableNativeReveals();
}, { once: true });

// FAQ accordion — only one answer open at a time. The `name` attribute on
// each <details> already does this natively in modern browsers; this
// listener is a fallback so it also works on older ones.
document.querySelectorAll('.faq-item').forEach(item => {
  item.addEventListener('toggle', () => {
    if (item.open) {
      document.querySelectorAll('.faq-item').forEach(other => {
        if (other !== item) other.open = false;
      });
    }
  });
});

// Cherry community chat. The app secret never reaches this client: the
// authenticated BattleCities API mints a wallet-bound, five-minute token.
const CHERRY_APP_ID = '148185d2-9181-4e2f-9e4d-47e5b5c12f2a';
const CHERRY_ROOM_ID = 'ffd51288-710c-4558-83dc-d5fe9b04451d';
const CHERRY_EMBED_URL = 'https://embed.cherry.fun';
const CHERRY_SESSION_ENDPOINT = 'https://api.battlecities.com/api/session';
const CHERRY_TOKEN_ENDPOINT = 'https://api.battlecities.com/api/cherry-embed-token';

let cherryChat = null;
let cherryWalletProvider = null;
let cherryWalletAddress = '';
let cherryChatVisible = false;
let cherryChatReady = false;

function setCherryChatVisibility(visible, moveFocus = true){
  const controls = document.getElementById('cherryChatControls');
  const launcher = document.getElementById('cherryChatLauncher');
  const closeButton = document.getElementById('cherryChatClose');
  cherryChatVisible = visible;
  controls?.classList.toggle('is-open', visible);
  launcher?.setAttribute('aria-expanded', String(visible));
  if (launcher) launcher.hidden = visible;
  if (closeButton) closeButton.hidden = !visible;
  if (moveFocus) (visible ? closeButton : launcher)?.focus();
}

function setCherryStatus(message = '', isError = false, retry = null){
  const status = document.getElementById('cherryChatStatus');
  const text = document.getElementById('cherryChatStatusText');
  const retryButton = document.getElementById('cherryChatRetry');
  if (!status || !text || !retryButton) return;

  status.hidden = message === '';
  status.classList.toggle('is-error', isError);
  text.textContent = message;
  retryButton.hidden = typeof retry !== 'function';
  retryButton.onclick = typeof retry === 'function' ? retry : null;
}

function getCherryWalletProvider(){
  return window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null);
}

function cherrySignatureToBase64(signature){
  let binary = '';
  signature.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

async function authenticateCherryWallet(provider, walletAddress){
  const challengeResponse = await fetch(CHERRY_SESSION_ENDPOINT, {
    method: 'PUT',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  });
  const challenge = await challengeResponse.json().catch(() => ({}));
  if (
    !challengeResponse.ok ||
    typeof challenge.nonce !== 'string' ||
    typeof challenge.message !== 'string'
  ) {
    throw new Error(challenge.error || 'Could not create the Battle Cities wallet challenge.');
  }

  const signed = await provider.signMessage(
    new TextEncoder().encode(challenge.message),
    'utf8',
  );
  const signature = signed instanceof Uint8Array ? signed : signed?.signature;
  if (!(signature instanceof Uint8Array) || signature.length !== 64) {
    throw new Error('Phantom returned an invalid signature.');
  }

  const sessionResponse = await fetch(CHERRY_SESSION_ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'wallet',
      walletAddress,
      nonce: challenge.nonce,
      message: challenge.message,
      signature: cherrySignatureToBase64(signature),
    }),
  });
  const session = await sessionResponse.json().catch(() => ({}));
  if (!sessionResponse.ok) {
    throw new Error(session.error || 'Could not authenticate the Battle Cities wallet session.');
  }
}

async function requestCherryToken(walletAddress){
  const response = await fetch(CHERRY_TOKEN_ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.token !== 'string') {
    if (response.status === 401) throw new Error('Sign in to Battle Cities before joining chat.');
    if (response.status === 403) throw new Error('Use the same Solana wallet linked to your Battle Cities account.');
    throw new Error(result.error || 'Chat authentication is unavailable. Try again shortly.');
  }
  return result.token;
}

async function connectCherryWallet(){
  const provider = getCherryWalletProvider();
  if (!provider) {
    throw new Error('Install or open Phantom to join the chat.');
  }

  setCherryStatus('CONNECTING WALLET // STAND BY');
  const connection = await provider.connect();
  const walletAddress = connection?.publicKey?.toString() || provider.publicKey?.toString();
  if (!walletAddress) throw new Error('The wallet did not return an address.');

  await authenticateCherryWallet(provider, walletAddress);
  const token = await requestCherryToken(walletAddress);
  cherryWalletProvider = provider;
  cherryWalletAddress = walletAddress;
  cherryChat.setToken(token);
  cherryChat.setWalletAddress(walletAddress);
  setCherryStatus('');
}

async function signCherryChallenge(message){
  if (!cherryWalletProvider || !cherryWalletAddress) {
    throw new Error('Connect your wallet before signing the chat challenge.');
  }
  const signed = await cherryWalletProvider.signMessage(message, 'utf8');
  return signed?.signature || signed;
}

async function handleCherryWalletRequest(){
  try {
    await connectCherryWallet();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to connect chat.';
    setCherryStatus(message, true, handleCherryWalletRequest);
  }
}

async function initializeCherryChat(){
  const launcher = document.getElementById('cherryChatLauncher');
  if (!launcher || cherryChatReady) return;

  launcher.disabled = true;
  launcher.setAttribute('aria-busy', 'true');
  setCherryStatus('LOADING COMMUNITY CHANNEL');

  try {
    const CherryEmbed = window.CherryEmbedSDK?.CherryEmbed;
    if (typeof CherryEmbed !== 'function') throw new Error('Chat service failed to load.');

    cherryChat = new CherryEmbed({
      appId: CHERRY_APP_ID,
      embedUrl: CHERRY_EMBED_URL,
      roomId: CHERRY_ROOM_ID,
      mode: 'single',
      position: 'floating-right',
      // Cherry applies this state synchronously as it creates the iframe. It
      // prevents the panel from painting during SDK startup; `show()` runs
      // only after the visitor presses the site-native chat button.
      collapsed: true,
      theme: {
        mode: 'dark',
        primaryColor: '#FFB30F',
        backgroundColor: '#06090B',
      },
      signChallengeHandler: signCherryChallenge,
    });

    cherryChat.on('walletConnectRequested', handleCherryWalletRequest);
    cherryChat.on('authStateChange', (authenticated) => {
      launcher.classList.toggle('is-authenticated', authenticated === true);
      launcher.setAttribute(
        'aria-label',
        authenticated ? 'Toggle authenticated Battle Cities community chat' : 'Toggle Battle Cities community chat',
      );
    });

    await cherryChat.mount();
    // Keep the embedded panel closed until the visitor explicitly opens it.
    cherryChat.hide();
    // Cherry uses the maximum z-index; moving host controls to the end keeps
    // the close button above the iframe when the full panel is open.
    document.body.appendChild(document.getElementById('cherryChatControls'));
    setCherryChatVisibility(false, false);
    cherryChatReady = true;
    launcher.disabled = false;
    launcher.setAttribute('aria-busy', 'false');
    launcher.classList.add('is-ready');
    setCherryStatus('');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load community chat.';
    launcher.disabled = false;
    launcher.setAttribute('aria-busy', 'false');
    setCherryStatus(message, true, initializeCherryChat);
  }
}

document.getElementById('cherryChatLauncher')?.addEventListener('click', async () => {
  if (!cherryChatReady) {
    await initializeCherryChat();
    return;
  }
  cherryChat.show();
  setCherryChatVisibility(true);
});

document.getElementById('cherryChatClose')?.addEventListener('click', () => {
  if (!cherryChatReady) return;
  cherryChat.hide();
  setCherryChatVisibility(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !cherryChatReady || !cherryChatVisible) return;
  cherryChat.hide();
  setCherryChatVisibility(false);
});

window.addEventListener('load', initializeCherryChat, { once: true });
