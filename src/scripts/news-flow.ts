export interface NewsFlowController {
  refresh: () => void;
  destroy: () => void;
}

const flows = new WeakMap<HTMLElement, NewsFlowController>();

/** Enhance a normal chronological grid without moving or reordering its DOM.
 *  `cardSelector` says which children are the cards to pack — the news grid uses
 *  `.news-card`, the blog archive uses `.blog-card`. */
export function initNewsFlow(grid: HTMLElement, cardSelector = '.news-card'): NewsFlowController {
  const existing = flows.get(grid);
  if (existing) return existing;

  // A normal grid is the readable fallback for older browsers and no-JS visits.
  if (typeof ResizeObserver === 'undefined' || typeof MutationObserver === 'undefined') {
    return { refresh: () => {}, destroy: () => {} };
  }

  const cards = new Set<HTMLElement>();
  const pending = new Set<HTMLElement>();
  let frame = 0;
  let stopped = false;
  let measureAll = true;
  let containerWidth = grid.getBoundingClientRect().width;

  function schedule(all = false) {
    if (stopped) return;
    measureAll ||= all;
    if (!frame) frame = requestAnimationFrame(layout);
  }

  function layout() {
    frame = 0;
    if (stopped) return;

    const style = getComputedStyle(grid);
    const row = Number.parseFloat(style.gridAutoRows);
    const gap = Number.parseFloat(style.rowGap) || 0;
    if (!Number.isFinite(row) || row <= 0) return;

    const targets = measureAll ? [...cards] : [...pending];
    measureAll = false;
    pending.clear();

    // Read natural sizes together, then write only changed spans. Each card is
    // fit-content/align-self:start, so allocating rows never stretches the card
    // and cannot repeatedly trigger its ResizeObserver.
    const measurements: Array<[HTMLElement, number]> = [];
    for (const card of targets) {
      if (!cards.has(card) || card.hidden || !card.isConnected) continue;
      const height = card.getBoundingClientRect().height;
      if (height <= 0) continue;
      measurements.push([card, Math.max(1, Math.ceil((height + gap) / (row + gap)))]);
    }
    for (const [card, span] of measurements) {
      const value = `span ${span}`;
      if (card.style.gridRowEnd !== value) card.style.gridRowEnd = value;
    }
  }

  const resize = new ResizeObserver(entries => {
    for (const entry of entries) {
      if (entry.target === grid) {
        // Our own row allocation changes grid height. Only width changes need
        // a container remeasure, which prevents an observer feedback loop.
        const width = entry.contentRect.width;
        if (Math.abs(width - containerWidth) > 0.5) {
          containerWidth = width;
          schedule(true);
        }
      } else {
        pending.add(entry.target as HTMLElement);
        schedule();
      }
    }
  });

  function reconcile() {
    const current = new Set<HTMLElement>();
    for (const child of grid.children) {
      if (child instanceof HTMLElement && child.matches(cardSelector)) current.add(child);
    }
    for (const card of cards) {
      if (!current.has(card)) {
        resize.unobserve(card);
        cards.delete(card);
        pending.delete(card);
        card.style.removeProperty('grid-row-end');
      }
    }
    for (const card of current) {
      if (!cards.has(card)) {
        cards.add(card);
        resize.observe(card);
      }
    }
  }

  const mutations = new MutationObserver(records => {
    let changedChildren = false;
    for (const record of records) {
      if (record.target === grid) {
        if (record.type === 'childList') changedChildren = true;
        schedule(true);
      } else if (record.target instanceof Element) {
        const card = record.target.closest<HTMLElement>(cardSelector);
        if (card && cards.has(card)) {
          pending.add(card);
          schedule();
        }
      }
    }
    if (changedChildren) reconcile();
  });

  grid.classList.add('masonry-ready');
  reconcile();
  resize.observe(grid);
  mutations.observe(grid, {
    subtree: true,
    childList: true,
    attributes: true,
    // Filters and failed-image hiding are observed, but our own style writes
    // and filter animations are intentionally not.
    attributeFilter: ['hidden', 'data-view'],
  });
  layout();

  const controller: NewsFlowController = {
    refresh: () => schedule(true),
    destroy: () => {
      stopped = true;
      if (frame) cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      grid.classList.remove('masonry-ready');
      for (const card of cards) card.style.removeProperty('grid-row-end');
      cards.clear();
      pending.clear();
      flows.delete(grid);
    },
  };
  flows.set(grid, controller);
  return controller;
}
