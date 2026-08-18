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
