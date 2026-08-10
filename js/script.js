/* =========================================================
   NEKOPIXEL // BEP-20 LAUNCHPAD — SCRIPT
   ========================================================= */

// Presale numbers driven from one source so the progress bar, % text,
// and the rest of the JS never drift out of sync with each other.
const PRESALE_RAISED = 340000;
const PRESALE_TARGET = 500000;
const progressPct = Math.round((PRESALE_RAISED / PRESALE_TARGET) * 100);

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

// Conversion rates for the "Buy" widget: how many NEKO per 1 unit of the selected currency
const rates = { BNB: 333333, USDT: 555 };

// Quick-amount preset buttons shown under the "You Pay" field, per payment method
const quickAmountPresets = {
  BNB:  [{ label: '0.5 BNB', value: 0.5 }, { label: '1 BNB', value: 1 }, { label: 'MAX', value: 3.25 }],
  USDT: [{ label: '100 USDT', value: 100 }, { label: '250 USDT', value: 250 }, { label: 'MAX', value: 1800 }],
};
let currentMethod = 'BNB';

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

// Switch between BNB / USDT as the payment method (called from the buy-tab onclick)
function setMethod(method, el){
  currentMethod = method;
  document.querySelectorAll('.buy-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('payUnit').textContent = method;
  document.getElementById('rateText').textContent = method === 'BNB' ? '1 BNB = 333,333 NEKO' : '1 USDT = 555 NEKO';
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
if (prefersReducedMotion) {
  revealEls.forEach(el => el.classList.add('in-view'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));
}

// Smooth scroll (Lenis) — falls back gracefully to the native
// `scroll-behavior:smooth` already set on <html> if the CDN script
// fails to load (e.g. offline) or the user prefers reduced motion.
window.addEventListener('load', () => {
  if (window.Lenis && !prefersReducedMotion) {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -70 });
        }
      });
    });
  }
});

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