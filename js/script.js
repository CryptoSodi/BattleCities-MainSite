/* =========================================================
   BATTLE CITIES // SOLANA TOKEN SITE — SCRIPT
   ========================================================= */

// Presale numbers driven from one source so the progress bar, % text,
// and the rest of the JS never drift out of sync with each other.
const PRESALE_RAISED = 340000;
const PRESALE_TARGET = 500000;
const progressPct = Math.round((PRESALE_RAISED / PRESALE_TARGET) * 100);

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
  { name: "Presale", pct: 40 },
  { name: "Liquidity Pool", pct: 25 },
  { name: "Team (Locked 12 Months)", pct: 15 },
  { name: "Marketing", pct: 10 },
  { name: "Ekosistem & Rewards", pct: 7 },
  { name: "Advisor", pct: 3 },
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

// Build the segmented presale progress bar (40 segments, lit up proportionally to progressPct)
const track = document.getElementById('progress-track');
const totalSeg = 40, onSeg = Math.round(totalSeg * (progressPct / 100));
for(let i=0;i<totalSeg;i++){
  const s = document.createElement('div');
  s.className = 'seg' + (i < onSeg ? ' on' : '');
  track.appendChild(s);
}
document.getElementById('progress-pct').textContent = progressPct;

// Fixed target timestamp so the countdown counts down to the same moment
// for every visitor instead of resetting on every page load.
const endDate = new Date('2026-09-13T00:00:00Z');
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

// Conversion rates for the demo "Buy" widget: how many BATC per payment unit.
const rates = { SOL: 125000, USDC: 833 };

// Quick-amount preset buttons shown under the "You Pay" field, per payment method
const quickAmountPresets = {
  SOL:  [{ label: '0.5 SOL', value: 0.5 }, { label: '1 SOL', value: 1 }, { label: 'MAX', value: 3.25 }],
  USDC: [{ label: '100 USDC', value: 100 }, { label: '250 USDC', value: 250 }, { label: 'MAX', value: 1800 }],
};
let currentMethod = 'SOL';

// Render the quick-amount buttons for the currently selected payment method
function renderQuickAmounts(){
  const wrap = document.getElementById('quickAmounts');
  wrap.innerHTML = '';
  quickAmountPresets[currentMethod].forEach(preset => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quick-amt';
    btn.textContent = preset.label;
    btn.onclick = () => {
      document.getElementById('payAmount').value = preset.value;
      wrap.querySelectorAll('.quick-amt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      calc();
    };
    wrap.appendChild(btn);
  });
}

// Switch between SOL / USDC as the payment method (called from the buy-tab onclick)
function setMethod(method, el){
  currentMethod = method;
  document.querySelectorAll('.buy-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('payUnit').textContent = method;
  document.getElementById('rateText').textContent = method === 'SOL' ? '1 SOL = 125,000 BATC' : '1 USDC = 833 BATC';
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
  const duration = 350;
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
  const pay = parseFloat(document.getElementById('payAmount').value) || 0;
  const target = pay * rates[currentMethod];
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

// Initial render of the quick-amount buttons on page load
renderQuickAmounts();

// Placeholder for the "Connect Wallet & Buy" button — this is a static demo,
// so there is no real Web3/wallet integration wired up here
function connectWallet(){
  alert('The wallet-connect feature requires backend / Web3 provider integration (e.g. MetaMask, WalletConnect), which is not included in this static demo.');
}

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
