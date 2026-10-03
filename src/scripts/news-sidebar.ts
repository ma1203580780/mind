/** Reveal ten more archive days without adding a nested scroll container. */
export function initDateExpansion(list: HTMLElement | null, signal: AbortSignal) {
  const more = list?.querySelector<HTMLButtonElement>('[data-date-more]');
  if (!list || !more) return;
  const dates = [...list.querySelectorAll<HTMLAnchorElement>('[data-date-item]')];
  more.hidden = !dates.some(date => date.hidden);
  more.addEventListener('click', () => {
    const next = dates.filter(date => date.hidden).slice(0, 10);
    next.forEach(date => { date.hidden = false; });
    // Keep keyboard users at the newly revealed dates when the ellipsis moves.
    next[0]?.focus({preventScroll:true});
    more.hidden = !dates.some(date => date.hidden);
  }, {signal});
}
