/* ─────────────────────────────────────────────────────────
 * WHITEPAPER MOTION STORYBOARD
 *
 * Navigation and primary actions stay visible immediately.
 * Secondary cards reveal once when they enter the viewport.
 *
 *    0ms   static shell and hero actions available
 *  600ms   secondary content fades up on first viewport entry
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  revealDuration: 350,
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.style.setProperty('--wp-reveal-duration', `${TIMING.revealDuration}ms`);

const deploymentOverlay = document.getElementById('deploymentOverlay');
const hasDeploymentArrival = document.documentElement.classList.contains('deployment-arrival');
const DEPLOYMENT_ARRIVAL_KEY = 'battlecities:deployment-arrival';
const PAGE_HANDOFF_DURATION = 500;
let pageDeploymentInProgress = false;
let pageDeploymentTimer = null;

function finishDeploymentArrival() {
  deploymentOverlay?.classList.remove('is-arriving');
  deploymentOverlay?.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('deployment-arrival');
}

if (hasDeploymentArrival) {
  try { window.sessionStorage.removeItem(DEPLOYMENT_ARRIVAL_KEY); } catch {}
  if (reducedMotion || !deploymentOverlay) {
    finishDeploymentArrival();
  } else {
    deploymentOverlay.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      deploymentOverlay.classList.add('is-arriving');
      window.setTimeout(finishDeploymentArrival, 500);
    });
  }
}

function beginPageDeployment(event) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (pageDeploymentInProgress) return;

  const destination = event.currentTarget.dataset.deploymentUrl || event.currentTarget.href;
  const arrival = event.currentTarget.dataset.deploymentArrival || '';
  const deploymentLabel = event.currentTarget.dataset.deploymentLabel || 'MAIN SITE';
  if (!deploymentOverlay || !destination) {
    window.location.assign(destination);
    return;
  }

  pageDeploymentInProgress = true;
  document.getElementById('deploymentEyebrow').textContent = 'DEPLOYING // BATTLEFIELD SEQUENCE';
  document.getElementById('deploymentTitle').textContent = 'RETURNING TO BATTLEFIELD';
  document.getElementById('deploymentSector').textContent = deploymentLabel;
  document.getElementById('deploymentStatus').textContent = 'SYSTEMS ONLINE // ARMOR READY';
  try { window.sessionStorage.setItem(DEPLOYMENT_ARRIVAL_KEY, arrival); } catch {}

  deploymentOverlay.setAttribute('aria-hidden', 'false');
  deploymentOverlay.classList.remove('is-arriving', 'is-departing');
  document.documentElement.classList.remove('deployment-arrival');
  void deploymentOverlay.offsetWidth;
  deploymentOverlay.classList.add('is-departing');
  pageDeploymentTimer = window.setTimeout(
    () => window.location.assign(destination),
    reducedMotion ? 0 : PAGE_HANDOFF_DURATION
  );
}

document.querySelectorAll('[data-deployment-url]').forEach(link => {
  link.addEventListener('click', beginPageDeployment);
});

const scrollTopButton = document.getElementById('wpScrollTop');
if (scrollTopButton) {
  const updateScrollTopButton = () => {
    const isVisible = window.scrollY > 520;
    scrollTopButton.classList.toggle('is-visible', isVisible);
    scrollTopButton.setAttribute('aria-hidden', String(!isVisible));
    scrollTopButton.tabIndex = isVisible ? 0 : -1;
  };

  scrollTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });
  window.addEventListener('scroll', updateScrollTopButton, { passive: true });
  updateScrollTopButton();
}

const mobileNavItems = document.querySelectorAll('.whitepaper-page .bottom-nav [data-section]');
if (mobileNavItems.length && 'IntersectionObserver' in window) {
  const mobileSections = document.querySelectorAll('#tokenomics, #roadmap');
  const mobileNavObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      mobileNavItems.forEach(item => item.classList.toggle('active', item.dataset.section === entry.target.id));
    });
  }, { threshold: 0.3 });
  mobileSections.forEach(section => mobileNavObserver.observe(section));
}

window.addEventListener('pageshow', () => {
  if (document.documentElement.classList.contains('deployment-arrival')) return;
  if (pageDeploymentTimer) window.clearTimeout(pageDeploymentTimer);
  pageDeploymentTimer = null;
  pageDeploymentInProgress = false;
  deploymentOverlay?.classList.remove('is-departing');
  deploymentOverlay?.setAttribute('aria-hidden', 'true');
});

const revealTargets = document.querySelectorAll(
  '.wp-hero-brand, .wp-kicker, .wp-hero h1, .wp-lede, .wp-actions, .wp-brief, .wp-section .sec-tag, .wp-section h2, .wp-section-intro, .wp-toc-grid, .wp-formula, .wp-feature-grid article, .wp-table-wrap, .wp-note, .wp-powerups-head, .wp-powerup-grid article, .wp-economy-flow, .wp-reward-card, .wp-disclaimer, .tokenomics .pixel-frame, .tokenomics .alloc-list, .whitepaper-roadmap .timeline-list, .wp-disclosure-grid',
);

revealTargets.forEach(target => target.classList.add('reveal'));

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealTargets.forEach(target => target.classList.add('in-view'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealTargets.forEach(target => revealObserver.observe(target));
}
