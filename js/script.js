/* =========================================================
   BATTLE CITIES // SOLANA TOKEN SITE — SCRIPT
   ========================================================= */

// Presale numbers driven from one source so the progress bar, % text,
// and the rest of the JS never drift out of sync with each other.
const PRESALE_RAISED = 340000;
const PRESALE_TARGET = 500000;
const progressPct = Math.round((PRESALE_RAISED / PRESALE_TARGET) * 100);

// Reusable game/page handoff. Add data-deployment-url to any future route that
// should show the elevator deployment sequence before navigation.
function beginDeployment(event){
  event.preventDefault();
  const destination = event.currentTarget.dataset.deploymentUrl || event.currentTarget.href;
  const overlay = document.getElementById('deploymentOverlay');
  const sector = event.currentTarget.dataset.deploymentSector || '01';
  const sectorLabel = document.getElementById('deploymentSector');
  if (!overlay || !destination) {
    window.location.assign(destination);
    return;
  }
  sectorLabel.textContent = `SECTOR ${sector.padStart(2, '0')}`;
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('is-active');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.setTimeout(() => window.location.assign(destination), reducedMotion ? 0 : 1080);
}

document.querySelectorAll('[data-deployment-url]').forEach(link => {
  link.addEventListener('click', beginDeployment);
});

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
const endDate = new Date('2026-07-11T00:00:00Z');
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
const rates = { SOL: 83333, USDC: 555 };

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
  document.getElementById('rateText').textContent = method === 'SOL' ? '1 SOL = 83,333 BATC' : '1 USDC = 555 BATC';
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
