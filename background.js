class BasicColorTheme {
  constructor(
      frame,
      tabBackgroundText,
      selectedTabLightenAmount,
      urlBarLightenAmount,
      toolbarLightenAmount,
  ) {
    this.frame = frame;
    this.tabBackgroundText = tabBackgroundText;
    this.selectedTabLightenAmount = selectedTabLightenAmount;
    this.urlBarLightenAmount = urlBarLightenAmount;
    this.toolbarLightenAmount = toolbarLightenAmount;
    this.usage = 0;
    this.lastUsed = Math.random();
  }

  get browserThemeObject() {
    const urlBarColor = lightenHexColor(this.frame, this.urlBarLightenAmount);
    const selectedTabColor = lightenHexColor(
        this.frame,
        this.selectedTabLightenAmount,
    );
    const toolbarColor = lightenHexColor(this.frame, this.toolbarLightenAmount);

    return {
      colors: {
        frame: this.frame,
        toolbar: toolbarColor,
        tab_selected: selectedTabColor,
        tab_background_text: this.tabBackgroundText,
        tab_line: 'transparent',
        toolbar_field: urlBarColor,
        toolbar_field_focus: urlBarColor,
        toolbar_field_text: this.tabBackgroundText,
        toolbar_field_text_focus: this.tabBackgroundText,
      },
    };
  }
}

class LightColorTheme extends BasicColorTheme {
  constructor(
      frame,
      tabBackgroundText = '#111',
      selectedTabLightenAmount = 0.6,
      urlBarLightenAmount = 1,
      toolbarLightenAmount = 0.3,
  ) {
    super(
        frame,
        tabBackgroundText,
        selectedTabLightenAmount,
        urlBarLightenAmount,
        toolbarLightenAmount,
    );
  }
}

class DarkColorTheme extends BasicColorTheme {
  constructor(
      frame,
      tabBackgroundText = '#f5f5f5',
      selectedTabLightenAmount = 0.3,
      urlBarLightenAmount = 0.08,
      toolbarLightenAmount = 0.12,
  ) {
    super(
        frame,
        tabBackgroundText,
        selectedTabLightenAmount,
        urlBarLightenAmount,
        toolbarLightenAmount,
    );
  }
}

function lightenHexColor(hexColor, amount) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const lightenChannel = (channel) =>
      Math.round(channel + (255 - channel) * amount);
  const toHex = (value) => value.toString(16).padStart(2, '0');

  return `#${toHex(lightenChannel(r))}${toHex(lightenChannel(g))}${
      toHex(lightenChannel(b))}`;
}

function createThemePair(lightTheme, darkTheme) {
  return {
    light: lightTheme,
    dark: darkTheme,
    usage: 0,
    lastUsed: Math.random()
  };
}

const THEME_PAIRS = [
  createThemePair(
      new LightColorTheme('#f2a3a3'), new DarkColorTheme('#2a2a40')),
  createThemePair(
      new LightColorTheme('#f2bf8a'), new DarkColorTheme('#3d2525')),
  createThemePair(
      new LightColorTheme('#f2df8a'), new DarkColorTheme('#2a3d29')),
  createThemePair(
      new LightColorTheme('#d6e38f'), new DarkColorTheme('#1d443d')),
  createThemePair(
      new LightColorTheme('#9fd9a3'), new DarkColorTheme('#223f52')),
  createThemePair(
      new LightColorTheme('#8fd9c6'), new DarkColorTheme('#24305b')),
  createThemePair(
      new LightColorTheme('#8fd9e2'), new DarkColorTheme('#39286b')),
  createThemePair(
      new LightColorTheme('#9fc4e8'), new DarkColorTheme('#502563')),
  createThemePair(
      new LightColorTheme('#a7b0f0'), new DarkColorTheme('#61274a')),
  createThemePair(
      new LightColorTheme('#c2a3e8'), new DarkColorTheme('#612a2c')),
  createThemePair(
      new LightColorTheme('#e3a3e8'), new DarkColorTheme('#304522')),
  createThemePair(
      new LightColorTheme('#e8a3c5'), new DarkColorTheme('#1d1d1d')),
];

const THEME_PAIR_BY_FRAME = new Map();
for (const themePair of THEME_PAIRS) {
  THEME_PAIR_BY_FRAME.set(themePair.light.frame, themePair);
  THEME_PAIR_BY_FRAME.set(themePair.dark.frame, themePair);
}

const MODE_STORAGE_KEY = 'colorMode';
const MODE_LIGHT = 'light';
const MODE_DARK = 'dark';

let themePairOfWindowID = new Map();
let currentMode = MODE_LIGHT;
const modeStateReady = loadModeState();

async function loadModeState() {
  const stored = await browser.storage.local.get(MODE_STORAGE_KEY);
  const savedMode = stored[MODE_STORAGE_KEY];
  if (savedMode === MODE_LIGHT || savedMode === MODE_DARK) {
    currentMode = savedMode;
  }
}

function getThemeForMode(themePair, mode) {
  if (mode === MODE_DARK) {
    return themePair.dark;
  }
  return themePair.light;
}

function getNextThemePair() {
  const sortedThemePairs = [...THEME_PAIRS];
  sortedThemePairs.sort((a, b) => {
    if (a.usage == b.usage) {
      return a.lastUsed > b.lastUsed;
    }
    return a.usage > b.usage;
  });
  return sortedThemePairs[0];
}

function applyThemePair(windowId, themePair, shouldCountUsage = true) {
  const selectedTheme = getThemeForMode(themePair, currentMode);
  browser.theme.update(windowId, selectedTheme.browserThemeObject);
  themePairOfWindowID.set(windowId, themePair);

  if (shouldCountUsage) {
    themePair.usage += 1;
    themePair.lastUsed = Date.now();
  }
}

async function applyThemesToAllWindows() {
  await modeStateReady;

  for (const window of await browser.windows.getAll()) {
    applyThemePair(window.id, getNextThemePair());
  }
}

async function reapplyCurrentModeToAllWindows() {
  await modeStateReady;

  for (const window of await browser.windows.getAll()) {
    const themePair = themePairOfWindowID.get(window.id);
    if (themePair) {
      applyThemePair(window.id, themePair, false);
    } else {
      applyThemePair(window.id, getNextThemePair());
    }
  }
}

function freeTheme(windowId) {
  const themePair = themePairOfWindowID.get(windowId);
  themePair.usage -= 1;
  themePairOfWindowID.delete(windowId);
}

browser.windows.onCreated.addListener(async (window) => {
  await modeStateReady;
  applyThemePair(window.id, getNextThemePair());
});

browser.windows.onRemoved.addListener(freeTheme);
browser.runtime.onStartup.addListener(applyThemesToAllWindows);
browser.runtime.onInstalled.addListener(applyThemesToAllWindows);

browser.runtime.onMessage.addListener(async (message) => {
  await modeStateReady;

  if (message.action === 'getColorMode') {
    return {mode: currentMode};
  }

  if (message.action === 'setColorMode') {
    const requestedMode = message.mode === MODE_DARK ? MODE_DARK : MODE_LIGHT;
    const didModeChange = requestedMode !== currentMode;
    currentMode = requestedMode;
    await browser.storage.local.set({[MODE_STORAGE_KEY]: currentMode});

    if (didModeChange) {
      await reapplyCurrentModeToAllWindows();
    }
    return {mode: currentMode};
  }

  if (message.action === 'setWindowColor') {
    const {color} = message;
    let window = await browser.windows.getCurrent();
    let themePair = THEME_PAIR_BY_FRAME.get(color);
    freeTheme(window.id);
    applyThemePair(window.id, themePair);
  }
});
