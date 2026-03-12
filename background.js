class BasicColorTheme {
    constructor(frame, tabBackgroundText, selectedTabLightenAmount, urlBarLightenAmount, toolbarLightenAmount) {
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
        const selectedTabColor = lightenHexColor(this.frame, this.selectedTabLightenAmount);
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
            }
        };
    }
}

class LightColorTheme extends BasicColorTheme {
    constructor(frame, tabBackgroundText = '#111', selectedTabLightenAmount = 0.60, urlBarLightenAmount = 1, toolbarLightenAmount = 0.3) {
        super(frame, tabBackgroundText, selectedTabLightenAmount, urlBarLightenAmount, toolbarLightenAmount);
    }
}

class DarkColorTheme extends BasicColorTheme {
    constructor(frame, tabBackgroundText = '#f5f5f5', selectedTabLightenAmount = 0.30, urlBarLightenAmount = 0.08, toolbarLightenAmount = 0.12) {
        super(frame, tabBackgroundText, selectedTabLightenAmount, urlBarLightenAmount, toolbarLightenAmount);
    }
}

function lightenHexColor(hexColor, amount) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    const lightenChannel = (channel) => Math.round(channel + (255 - channel) * amount);
    const toHex = (value) => value.toString(16).padStart(2, '0');

    return `#${toHex(lightenChannel(r))}${toHex(lightenChannel(g))}${toHex(lightenChannel(b))}`;
}


const LIGHT_THEMES = [
    new LightColorTheme('#f2a3a3'),
    new LightColorTheme('#f2bf8a'),
    new LightColorTheme('#f2df8a'),
    new LightColorTheme('#d6e38f'),
    new LightColorTheme('#9fd9a3'),
    new LightColorTheme('#8fd9c6'),
    new LightColorTheme('#8fd9e2'),
    new LightColorTheme('#9fc4e8'),
    new LightColorTheme('#a7b0f0'),
    new LightColorTheme('#c2a3e8'),
    new LightColorTheme('#e3a3e8'),
    new LightColorTheme('#e8a3c5')
];

const DARK_THEMES = [
    new DarkColorTheme('#2a2a40'),
    new DarkColorTheme('#3d2525'),
    new DarkColorTheme('#2a3d29'),
    new DarkColorTheme('#1d443d'),
    new DarkColorTheme('#223f52'),
    new DarkColorTheme('#24305b'),
    new DarkColorTheme('#39286b'),
    new DarkColorTheme('#502563'),
    new DarkColorTheme('#61274a'),
    new DarkColorTheme('#612a2c'),
    new DarkColorTheme('#304522'),
    new DarkColorTheme('#1d1d1d'),
];

const ALL_THEMES = [...LIGHT_THEMES, ...DARK_THEMES];

const MODE_STORAGE_KEY = 'colorMode';
const MODE_LIGHT = 'light';
const MODE_DARK = 'dark';

let themeOfWindowID = new Map();
let currentMode = MODE_LIGHT;
const modeStateReady = loadModeState();

async function loadModeState() {
    const stored = await browser.storage.local.get(MODE_STORAGE_KEY);
    const savedMode = stored[MODE_STORAGE_KEY];
    if (savedMode === MODE_LIGHT || savedMode === MODE_DARK) {
        currentMode = savedMode;
    }
}

function getThemesForCurrentMode() {
    if (currentMode === MODE_DARK) {
        return DARK_THEMES;
    }
    return LIGHT_THEMES;
}

function getNextTheme() {
    const sortedThemes = [...getThemesForCurrentMode()];
    sortedThemes.sort((a, b) => {
        if (a.usage == b.usage) {
            return a.lastUsed > b.lastUsed;
        }
        return a.usage > b.usage;
    });
    return sortedThemes[0];
}

function applyTheme(windowId, theme) {
    browser.theme.update(windowId, theme.browserThemeObject);
    themeOfWindowID.set(windowId, theme);
    theme.usage += 1;
    theme.lastUsed = Date.now();
}

async function applyThemesToAllWindows() {
    await modeStateReady;

    for (const window of await browser.windows.getAll()) {
        applyTheme(window.id, getNextTheme());
    }
}

function freeTheme(windowId) {
    const theme = themeOfWindowID.get(windowId);
    theme.usage -= 1;
    themeOfWindowID.delete(windowId);
}

browser.windows.onCreated.addListener(async (window) => {
    await modeStateReady;
    applyTheme(window.id, getNextTheme());
});

browser.windows.onRemoved.addListener(freeTheme);
browser.runtime.onStartup.addListener(applyThemesToAllWindows);
browser.runtime.onInstalled.addListener(applyThemesToAllWindows);

browser.runtime.onMessage.addListener(async (message) => {
    await modeStateReady;

    if (message.action === 'getColorMode') {
        return { mode: currentMode };
    }

    if (message.action === 'setColorMode') {
        const requestedMode = message.mode === MODE_DARK ? MODE_DARK : MODE_LIGHT;
        currentMode = requestedMode;
        await browser.storage.local.set({ [MODE_STORAGE_KEY]: currentMode });
        return { mode: currentMode };
    }

    if (message.action === 'setWindowColor') {
        const { color } = message;
        let window = await browser.windows.getCurrent()
        freeTheme(window.id);
        let theme = ALL_THEMES.find(theme => theme.frame === color)
        applyTheme(window.id, theme)
    }
})
