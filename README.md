# Trading View Chrome Extension

A Chrome extension that lets you assign your own keyboard shortcuts to any TradingView drawing tool, plus a shortcut that collapses every section in your watchlist. It only runs on `tradingview.com` and has no access to any other site.

This is an unofficial, independent project. It isn't made by or affiliated with TradingView.

## Install

1. Download this repository: click the green **Code** button above, then **Download ZIP**, and unzip it. (Or `git clone` it.)
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and choose the unzipped folder (the one that contains `manifest.json`).
5. The settings page opens. TradingView tabs that are already open get the shortcuts automatically. If one doesn't respond, reload that tab.

After you edit any of these files, or download a newer version, click the reload icon on the extension's card in `chrome://extensions`.

## Use

- Click the extension's toolbar icon to open the settings page.
- Click a key box next to a tool and press the keys you want. Press Esc to cancel, or click × to remove a shortcut.
- Changes apply to open TradingView tabs right away.
- If "Pressing a shortcut again goes back to the cursor" is on, pressing the same shortcut again switches back to your cursor.

Defaults: ⌥1 Trendline, ⌥2 Price range, ⌥3 Horizontal ray, ⌥W Collapse all watchlist sections. (⌥ is Option on a Mac and Alt on Windows.)

### Watchlist

**Collapse all sections** (default ⌥W) closes every section in your watchlist. If they're all closed already, it opens them all again. Change its key in the Watchlist group at the top of the settings page.

## Notes

- You can reuse TradingView's own keys. For example, binding ⌥H to another tool replaces TradingView's Horizontal line shortcut. The settings page warns you when a key clashes.
- A plain letter such as `Q` works too. That letter then stops opening symbol search, but other letters still open it.
- Shortcuts are ignored while you're typing in a text box, such as symbol search or the Pine editor.
- The extension switches tools using TradingView's own chart code (`TradingViewApi.selectLineTool`). If a TradingView update breaks it, that's the place to look.
- Collapse all sections clicks the arrow on each section header in the watchlist (`[data-name="symbol-list-wrap"] [data-collapsed]` in `page.js`). If TradingView changes its watchlist, look there.
- After updating the extension, reload any open TradingView tabs so they pick up the new code.
- Shortcuts are saved with Chrome sync, so they follow your Chrome profile.

## License

MIT. See [LICENSE](LICENSE).
