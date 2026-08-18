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
  revealDuration: 600,
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.style.setProperty('--wp-reveal-duration', `${TIMING.revealDuration}ms`);

const revealTargets = document.querySelectorAll(
  '.wp-brief, .wp-formula, .wp-feature-grid article, .wp-reward-card, .wp-powerup-grid article, .tokenomics .pixel-frame, .tokenomics .alloc-list, .whitepaper-roadmap .timeline-list',
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
