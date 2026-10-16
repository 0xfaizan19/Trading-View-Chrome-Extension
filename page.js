// Runs in the page's world on tradingview.com. It listens for your shortcuts
// and switches the drawing tool through TradingView's own chart API.
(() => {
  // Already running in this tab (background.js re-injects on install/update):
  // the existing copy picks up settings from the new bridge, so just ask for them.
  if (window.__tvcsShortcutsLoaded) {
    document.dispatchEvent(new CustomEvent('tvcs:hello'));
    return;
  }
  window.__tvcsShortcutsLoaded = true;

  const CURSOR_TOOLS = ['cursor', 'dot', 'arrow_cursor'];
  let settings = null;
  let comboToTool = new Map();
  let lastCursor = 'cursor';
  const swallowed = new Set(); // codes whose keypress/keyup should also be hidden from TradingView

  document.addEventListener('tvcs:settings', (e) => {
    try {
      settings = JSON.parse(e.detail);
    } catch {
      return;
    }
    comboToTool = new Map(Object.entries(settings.bindings || {}).map(([tool, combo]) => [combo, tool]));
  });
  document.dispatchEvent(new CustomEvent('tvcs:hello'));

  function comboFromEvent(e) {
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key) || !e.code) return null;
    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Meta');
    parts.push(e.code);
    return parts.join('+');
  }

  function isTyping(e) {
    const el = e.composedPath()[0];
    if (!(el instanceof Element)) return false;
    if (el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
    if (el.tagName === 'INPUT') {
      return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color'].includes((el.type || 'text').toLowerCase());
    }
    return !!el.closest('[role="textbox"], [contenteditable=""], [contenteditable="true"]');
  }

  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)));
  let watchlistBusy = false;

  // Collapses every watchlist section, or expands them all if none is open.
  // The watchlist only renders the rows in view, so walk it a screen at a
  // time, clicking the arrow of each matching section header. The pinned copy
  // of the current header at the top of the list is skipped, so that section
  // isn't toggled twice.
  async function toggleWatchlistSections() {
    const wrap = document.querySelector('[data-name="symbol-list-wrap"]');
    if (!wrap || watchlistBusy) return;
    const headers = () => [...wrap.querySelectorAll('[data-collapsed]')].filter((h) => !h.closest('[class*="sticky"]'));
    const visible = headers();
    if (!visible.length) return;
    const from = visible.some((h) => h.dataset.collapsed === 'false') ? 'false' : 'true';
    const list = wrap.querySelector('[class*="listContainer"]');
    const startTop = list ? list.scrollTop : 0;

    watchlistBusy = true;
    try {
      if (list) list.scrollTop = 0;
      await nextFrame();
      for (let step = 0; step < 200; step++) {
        const pending = headers().filter((h) => h.dataset.collapsed === from);
        if (pending.length) {
          pending.forEach((h) => h.querySelector('[class*="expandHandle"]')?.click());
        } else if (list && list.scrollTop + list.clientHeight < list.scrollHeight - 1) {
          list.scrollTop += list.clientHeight;
        } else {
          break;
        }
        await nextFrame();
      }
      if (list) list.scrollTop = from === 'false' ? 0 : startTop;
    } finally {
      watchlistBusy = false;
    }
  }

  const ACTIONS = { collapse_watchlist_sections: toggleWatchlistSections };

  function onKeyDown(e) {
    if (!settings || !settings.enabled || e.isComposing) return;
    const combo = comboFromEvent(e);
    const tool = combo && comboToTool.get(combo);
    if (!tool || isTyping(e)) return;
    const action = ACTIONS[tool];
    const api = window.TradingViewApi;
    if (!action && (!api || typeof api.selectLineTool !== 'function')) return; // not a chart page

    e.preventDefault();
    e.stopImmediatePropagation();
    swallowed.add(e.code);
    if (e.repeat) return;
    if (action) {
      action().catch((err) => console.warn('[TradingView Custom Shortcuts]', err));
      return;
    }

    let current = null;
    try {
      current = api.selectedLineTool();
    } catch {
      // TradingView throws for tools it doesn't expose by name.
    }
    if (CURSOR_TOOLS.includes(current)) lastCursor = current;
    const next = settings.toggleBack && current === tool ? lastCursor : tool;
    Promise.resolve(api.selectLineTool(next)).catch((err) => console.warn('[TradingView Custom Shortcuts]', err));
  }

  function onKeyFollowUp(e) {
    if (!swallowed.has(e.code)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.type === 'keyup') swallowed.delete(e.code);
  }

  // Capture on window at document_start, so these run before TradingView's own
  // key handlers and can stop, for example, a plain letter opening symbol search.
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keypress', onKeyFollowUp, true);
  window.addEventListener('keyup', onKeyFollowUp, true);
  window.addEventListener('blur', () => swallowed.clear());
})();
