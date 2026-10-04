import {onPageLoad} from './page-lifecycle';

const preference = matchMedia('(prefers-reduced-motion: reduce)');
const running = new Set<Animation>();
export const motionEase = 'cubic-bezier(.22, 1, .36, 1)';
export const reducedMotion = () => preference.matches;

/** Finite effects only. Navigation and a preference change cancel all work. */
export function animateMotion(element: Element, frames: Keyframe[], options: KeyframeAnimationOptions, name = 'reveal') {
  if (reducedMotion() || !element.animate) return null;
  const animation = element.animate(frames, {duration: 520, easing: motionEase, ...options});
  animation.id = `mind:${name}`;
  running.add(animation);
  const release = () => running.delete(animation);
  animation.finished.then(release, release);
  return animation;
}

const cancelAll = () => { for (const animation of running) animation.cancel(); running.clear(); };
document.addEventListener('astro:before-swap', cancelAll);
preference.addEventListener('change', () => { if (reducedMotion()) cancelAll(); });

onPageLoad((signal, onCleanup) => {
  const main = document.querySelector<HTMLElement>('#main');
  if (!main) return;

  // Older client sessions may still have the previous header underline.
  const nav = document.querySelector<HTMLElement>('#site-header nav');
  nav?.querySelector('.nav-marker')?.remove();
  nav?.classList.remove('motion-nav');

  // Content is readable immediately. Only deliberate actions receive motion.
  // Keep native details semantics and keyboard activation, with reversible height changes.
  const disclosures = new Map<HTMLDetailsElement, {open: boolean; animation: Animation}>();
  main.querySelectorAll<HTMLDetailsElement>('details.featured-rules, details.reader-provenance, .content-toolbar details, details.story-detail').forEach(details => {
    const summary = details.querySelector('summary');
    summary?.addEventListener('click', event => {
      if (reducedMotion()) return;
      event.preventDefault();
      const previous = disclosures.get(details);
      const open = !(previous?.open ?? details.open);
      const start = details.getBoundingClientRect().height;
      disclosures.delete(details);
      previous?.animation.cancel();
      details.open = open;
      const end = details.getBoundingClientRect().height;
      details.open = true;
      details.style.overflow = 'hidden';
      const animation = animateMotion(details, [{height: `${start}px`}, {height: `${end}px`}], {duration: 300}, 'disclosure');
      if (!animation) { details.open = open; details.style.removeProperty('overflow'); return; }
      disclosures.set(details, {open, animation});
      const finish = () => {
        if (disclosures.get(details)?.animation !== animation) return;
        details.open = open;
        details.style.removeProperty('overflow');
        disclosures.delete(details);
      };
      animation.finished.then(finish, finish);
    }, {signal});
  });
});
