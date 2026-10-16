// Runs in the extension's isolated world. It reads settings from
// chrome.storage and hands them to page.js, which runs in the page's own world
// (where window.TradingViewApi lives) and can't use chrome.* APIs.
(() => {
  function sendSettings() {
    try {
      chrome.storage.sync.get(TVCS_DEFAULTS, (settings) => {
        document.dispatchEvent(new CustomEvent('tvcs:settings', { detail: JSON.stringify(settings) }));
      });
    } catch {
      // The extension was reloaded or removed while this tab stayed open.
    }
  }

  document.addEventListener('tvcs:hello', sendSettings);
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area === 'sync') sendSettings();
  });
  sendSettings();
})();
