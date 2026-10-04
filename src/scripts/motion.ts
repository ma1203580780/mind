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

  // The persistent header gets one moving rule; content never becomes a page snapshot.
  const nav = document.querySelector<HTMLElement>('#site-header nav');
  if (nav) {
    let marker = nav.querySelector<HTMLElement>('.nav-marker');
    const first = !marker;
    if (!marker) {
      marker = document.createElement('span');
      marker.className = 'nav-marker';
      marker.setAttribute('aria-hidden', 'true');
      nav.append(marker);
    }
    const align = () => {
      const selected = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!selected) return;
      const padding = parseFloat(getComputedStyle(selected).paddingLeft);
      marker!.style.width = `${selected.offsetWidth - padding * 2}px`;
      marker!.style.transform = `translateX(${selected.offsetLeft + padding}px)`;
    };
    align();
    if (first) { marker.getBoundingClientRect(); nav.classList.add('motion-nav'); }
    const resize = new ResizeObserver(align);
    resize.observe(nav);
    onCleanup(() => resize.disconnect());
  }

  const selectors = [
    '.daily-sidebar', '.news-card', '.recent-writing', '.year', '.blog-card',
    '.lab-project', '.discover-intro', '.explore-now', '.explore-build', '.explore-connect',
    '.network-heading', '.network-column', '.network-communities', '.network-contribute',
    '.connection-heading', '.connection-section', '.page-heading', '.page-head',
    '.discovery-intro', '.topic-tile', '.work-tile', '.about', '.stats-page', '.article-header',
  ].join(',');
  const targets = [...main.querySelectorAll<HTMLElement>(selectors)].filter(el => !el.parentElement?.closest(selectors));
  // New sections enter once as they become visible. Nothing is hidden before JS loads.
  if (!reducedMotion()) {
    let order = 0;
    const enter = (element: HTMLElement, delay = 0) => animateMotion(element, [
      {opacity: 0, translate: '0 14px'}, {opacity: 1, translate: '0 0'},
    ], {delay, fill: 'backwards'});
    const observer = new IntersectionObserver(entries => {
      let stagger = 0;
      for (const entry of entries) if (entry.isIntersecting) {
        enter(entry.target as HTMLElement, Math.min(stagger++ * 45, 135));
        observer.unobserve(entry.target);
      }
    }, {threshold: 0, rootMargin: '0px 0px -24px 0px'});
    for (const target of targets) {
      const rect = target.getBoundingClientRect();
      if (!rect.height) continue;
      if (rect.bottom > 0 && rect.top < innerHeight) enter(target, Math.min(order++ * 45, 180));
      else observer.observe(target);
    }
    // Search has its own layout animation; its atmosphere only fades on arrival.
    const search = main.querySelector('.search-canvas');
    if (search) animateMotion(search, [{opacity: 0}, {opacity: 1}], {duration: 420}, 'search-enter');
    onCleanup(() => observer.disconnect());
  }

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
