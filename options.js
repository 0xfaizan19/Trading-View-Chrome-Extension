const IS_MAC = /mac|iphone|ipad/i.test(navigator.userAgentData?.platform || navigator.platform);
const MOD_ORDER = ['Ctrl', 'Alt', 'Shift', 'Meta'];

// TradingView's built-in shortcuts ("Mod" = ⌘ on Mac, Ctrl elsewhere). Binding
// one of these makes the extension take over that key on TradingView.
const TV_BUILTINS = {
  'Mod+KeyK': 'Quick search',
  'Slash': 'Open indicators',
  'Alt+KeyD': 'Data window',
  'Period': 'Load chart layout',
  'Mod+KeyS': 'Save chart layout',
  'Alt+Shift+KeyE': 'Switch sessions',
  'Mod+KeyZ': 'Undo',
  'Mod+KeyY': 'Redo',
  'Alt+Enter': 'Maximize chart',
  'Alt+KeyA': 'Add alert',
  'Alt+KeyG': 'Go to date',
  'Alt+KeyN': 'Add text note',
  'Alt+Mod+KeyS': 'Save chart image',
  'Shift+Mod+KeyS': 'Copy chart image',
  'Alt+KeyS': 'Copy chart image link',
  'Alt+KeyR': 'Reset chart view',
  'Alt+KeyI': 'Invert scale',
  'Alt+KeyL': 'Log scale',
  'Alt+KeyP': 'Percent scale',
  'Alt+Mod+KeyH': 'Hide all drawings',
  'Alt+KeyT': 'Trendline',
  'Alt+KeyH': 'Horizontal line',
  'Alt+KeyJ': 'Horizontal ray',
  'Alt+KeyV': 'Vertical line',
  'Alt+KeyC': 'Crossline',
  'Alt+KeyF': 'Fib retracement',
  'Alt+Shift+KeyR': 'Rectangle',
  'ArrowLeft': 'Move chart left',
  'ArrowRight': 'Move chart right',
  'Mod+ArrowUp': 'Zoom in',
  'Mod+ArrowDown': 'Zoom out',
  'Shift+ArrowDown': 'Replay play/pause',
  'Shift+ArrowRight': 'Replay step',
  'Tab': 'Next chart',
  'Shift+Tab': 'Previous chart',
  'Comma': 'Change interval',
  'Delete': 'Remove selected drawing',
  'Backspace': 'Remove selected drawing',
};

// Chrome keeps these for itself, so the page never sees them.
const BROWSER_RESERVED = ['Mod+KeyW', 'Mod+KeyT', 'Mod+KeyN', 'Mod+KeyQ', 'Mod+Shift+KeyT', 'Mod+Shift+KeyN', 'Mod+Shift+KeyW'];

const KEY_LABELS = {
  Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'",
  Backquote: '`', Comma: ',', Period: '.', Slash: '/', Space: 'Space', Enter: '↵', Tab: 'Tab',
  Backspace: '⌫', Delete: '⌦', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  Home: 'Home', End: 'End', PageUp: 'PgUp', PageDown: 'PgDn', IntlBackslash: '§',
};
const MAC_MOD_SYMBOLS = { Ctrl: '⌃', Alt: '⌥', Shift: '⇧', Meta: '⌘' };
const PC_MOD_NAMES = { Ctrl: 'Ctrl', Alt: 'Alt', Shift: 'Shift', Meta: 'Win' };

const toolNames = new Map(TVCS_TOOL_GROUPS.flatMap((g) => g.tools));
const builtins = new Map(Object.entries(TV_BUILTINS).map(([combo, action]) => [normalize(combo), action]));
const reserved = new Set(BROWSER_RESERVED.map(normalize));

const $ = (id) => document.getElementById(id);
let settings = structuredClone(TVCS_DEFAULTS);
let recordingTool = null;
let comboOwners = new Map(); // combo -> tool ids, rebuilt on each render

function normalize(combo) {
  const parts = combo.split('+');
  const code = parts.pop();
  const mods = parts.map((p) => (p === 'Mod' ? (IS_MAC ? 'Meta' : 'Ctrl') : p));
  return [...MOD_ORDER.filter((m) => mods.includes(m)), code].join('+');
}

function comboFromEvent(e) {
  if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key) || !e.code) return null;
  const mods = { Ctrl: e.ctrlKey, Alt: e.altKey, Shift: e.shiftKey, Meta: e.metaKey };
  return [...MOD_ORDER.filter((m) => mods[m]), e.code].join('+');
}

function keyLabel(code) {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
  return KEY_LABELS[code] || code;
}

function comboLabel(combo) {
  const parts = combo.split('+');
  const code = parts.pop();
  if (IS_MAC) return parts.map((m) => MAC_MOD_SYMBOLS[m]).join('') + keyLabel(code);
  return [...parts.map((m) => PC_MOD_NAMES[m]), keyLabel(code)].join('+');
}

// Warning to show next to a binding, or '' when the combo is free.
function comboNote(combo) {
  if (builtins.has(combo)) return 'Replaces TradingView: ' + builtins.get(combo);
  const parts = combo.split('+');
  const code = parts.pop();
  const onlyShift = parts.length === 0 || (parts.length === 1 && parts[0] === 'Shift');
  if (onlyShift && code.startsWith('Key')) return 'Stops this letter opening symbol search';
  if (parts.length === 0 && (code.startsWith('Digit') || code.startsWith('Numpad'))) return 'Stops this number changing the interval';
  return '';
}

function save() {
  chrome.storage.sync.set(settings);
}

let toastTimer;
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function render() {
  const query = $('filter').value.trim().toLowerCase();
  const onlyAssigned = $('onlyAssigned').checked;
  const container = $('groups');
  container.replaceChildren();
  comboOwners = new Map();
  for (const [tool, combo] of Object.entries(settings.bindings)) {
    comboOwners.set(combo, [...(comboOwners.get(combo) || []), tool]);
  }

  for (const group of TVCS_TOOL_GROUPS) {
    const tools = group.tools.filter(([id, name]) =>
      (!onlyAssigned || settings.bindings[id]) &&
      (!query || name.toLowerCase().includes(query) || group.name.toLowerCase().includes(query)));
    if (!tools.length) continue;

    const section = document.createElement('section');
    section.className = 'group';
    const heading = document.createElement('h2');
    heading.textContent = group.name;
    const rows = document.createElement('div');
    rows.className = 'rows';
    for (const [id, name] of tools) rows.append(renderRow(id, name));
    section.append(heading, rows);
    container.append(section);
  }

  if (!container.children.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = onlyAssigned && !query ? 'No shortcuts assigned yet.' : 'No tools match your search.';
    container.append(empty);
  }

  const count = Object.keys(settings.bindings).length;
  const clashes = [...comboOwners.values()].filter((tools) => tools.length > 1).length;
  $('summary').textContent = (count === 1 ? '1 shortcut assigned' : `${count} shortcuts assigned`) +
    (clashes ? ` · ${clashes === 1 ? '1 key is' : clashes + ' keys are'} used twice, fix the ones marked in red` : '');
  document.body.classList.toggle('disabled', !settings.enabled);
}

function renderRow(id, name) {
  const combo = settings.bindings[id];
  const row = document.createElement('div');
  row.className = 'row' + (combo ? ' assigned' : '');

  const label = document.createElement('span');
  label.className = 'name';
  label.textContent = name;
  row.append(label);

  const sharedWith = combo ? comboOwners.get(combo).filter((t) => t !== id) : [];
  const note = sharedWith.length
    ? 'Same key as ' + sharedWith.map((t) => toolNames.get(t)).join(', ')
    : combo && comboNote(combo);
  if (note) {
    const el = document.createElement('span');
    el.className = 'note' + (sharedWith.length ? ' conflict' : '');
    el.textContent = note;
    row.append(el);
  } else if (TVCS_BUILTIN_TOOL_KEYS[id]) {
    const hint = document.createElement('span');
    hint.className = 'hint';
    hint.textContent = 'TradingView: ' + comboLabel(normalize(TVCS_BUILTIN_TOOL_KEYS[id]));
    row.append(hint);
  }

  const key = document.createElement('button');
  key.type = 'button';
  key.className = 'key' + (combo ? ' set' : '') + (recordingTool === id ? ' recording' : '');
  key.textContent = recordingTool === id ? 'Press keys… (Esc cancels)' : combo ? comboLabel(combo) : 'Click to set';
  key.setAttribute('aria-label', `Shortcut for ${name}: ${combo ? comboLabel(combo) : 'none'}. Click to change.`);
  key.addEventListener('click', (e) => {
    e.stopPropagation();
    recordingTool = recordingTool === id ? null : id;
    render();
  });

  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'clear';
  clear.textContent = '×';
  clear.title = 'Remove shortcut';
  clear.setAttribute('aria-label', `Remove shortcut for ${name}`);
  clear.hidden = !combo;
  clear.addEventListener('click', () => {
    delete settings.bindings[id];
    save();
    render();
    toast(`Removed shortcut for ${name}`);
  });

  row.append(key, clear);
  return row;
}

function assign(toolId, combo) {
  const previousOwner = Object.keys(settings.bindings).find((t) => t !== toolId && settings.bindings[t] === combo);
  if (previousOwner) delete settings.bindings[previousOwner];
  settings.bindings[toolId] = combo;
  recordingTool = null;
  save();
  render();
  toast(previousOwner
    ? `${comboLabel(combo)} moved from ${toolNames.get(previousOwner)} to ${toolNames.get(toolId)}`
    : `${toolNames.get(toolId)} → ${comboLabel(combo)}`);
}

window.addEventListener('keydown', (e) => {
  if (!recordingTool) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.key === 'Escape') {
    recordingTool = null;
    render();
    return;
  }
  const combo = comboFromEvent(e);
  if (!combo) return; // wait for a non-modifier key
  if (reserved.has(combo)) {
    toast(`${comboLabel(combo)} is reserved by Chrome. Pick another key.`);
    return;
  }
  assign(recordingTool, combo);
}, true);

document.addEventListener('click', () => {
  if (recordingTool) {
    recordingTool = null;
    render();
  }
});

$('filter').addEventListener('input', render);
$('onlyAssigned').addEventListener('change', render);
$('enabled').addEventListener('change', (e) => {
  settings.enabled = e.target.checked;
  save();
  render();
});
$('toggleBack').addEventListener('change', (e) => {
  settings.toggleBack = e.target.checked;
  save();
});
$('reset').addEventListener('click', () => {
  if (!confirm('Replace all your shortcuts with the defaults?')) return;
  settings = structuredClone(TVCS_DEFAULTS);
  save();
  syncControls();
  render();
  toast('Shortcuts reset to defaults');
});

function syncControls() {
  $('enabled').checked = settings.enabled;
  $('toggleBack').checked = settings.toggleBack;
}

chrome.storage.sync.get(TVCS_DEFAULTS, (stored) => {
  settings = stored;
  syncControls();
  render();
});

// Keep several open copies of this page in step, so one can't overwrite
// another's changes with stale bindings.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  for (const [key, { newValue }] of Object.entries(changes)) {
    settings[key] = newValue ?? structuredClone(TVCS_DEFAULTS[key]);
  }
  syncControls();
  render();
});
