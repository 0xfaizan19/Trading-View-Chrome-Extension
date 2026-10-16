importScripts('tools.js');

// Clicking the toolbar icon opens the shortcut editor; so does a fresh install.
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

// Chrome only runs content scripts on pages loaded after the extension is
// installed or reloaded, so add them to TradingView tabs that are already open.
async function injectIntoOpenTabs() {
  const tabs = await chrome.tabs.query({ url: 'https://*.tradingview.com/*' });
  for (const tab of tabs) {
    const target = { tabId: tab.id };
    try {
      await chrome.scripting.executeScript({ target, files: ['tools.js', 'bridge.js'] });
      await chrome.scripting.executeScript({ target, files: ['page.js'], world: 'MAIN' });
    } catch {
      // Discarded tab, error page, or a page still loading (it gets the scripts normally).
    }
  }
}

// Saved bindings replace the defaults wholesale, so a default added in an
// update never shows up for someone who has already saved shortcuts. Give
// each one its default key once (if that key is free) and remember it, so
// removing it later sticks.
async function addNewDefaults() {
  const { bindings, seenDefaults = [] } = await chrome.storage.sync.get(['bindings', 'seenDefaults']);
  const update = { seenDefaults: [...new Set([...seenDefaults, ...TVCS_ADDED_DEFAULTS])] };
  if (bindings) {
    const taken = new Set(Object.values(bindings));
    for (const id of TVCS_ADDED_DEFAULTS) {
      const combo = TVCS_DEFAULTS.bindings[id];
      if (seenDefaults.includes(id) || bindings[id] || taken.has(combo)) continue;
      bindings[id] = combo;
      taken.add(combo);
      update.bindings = bindings;
    }
  }
  await chrome.storage.sync.set(update);
}

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason !== 'install' && reason !== 'update') return;
  addNewDefaults();
  injectIntoOpenTabs();
  if (reason === 'install') chrome.runtime.openOptionsPage();
});
