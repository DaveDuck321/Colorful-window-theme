class BasicColorTheme {
    constructor(frame, tone) {
        this.frame = frame;
        this.tone = tone;
        this.usage = 0;
        this.lastUsed = Math.random();
    }

    get browserThemeObject() {
        const isDarkTone = this.tone === 'dark';
        const selectedTabLightenAmount = isDarkTone ? 0.30 : 0.70;
        const urlBarLightenAmount = isDarkTone ? 0.18 : 0.60;
        const textColor = isDarkTone ? '#f5f5f5' : '#111';
        const urlBarColor = lightenHexColor(this.frame, urlBarLightenAmount);
        const selectedTabColor = lightenHexColor(this.frame, selectedTabLightenAmount);

        return {
            colors: {
                frame: this.frame,
                tab_selected: selectedTabColor,
                tab_background_text: textColor,
                tab_line: 'transparent',
                toolbar_field: urlBarColor,
                toolbar_field_focus: urlBarColor,
                toolbar_field_text: textColor,
                toolbar_field_text_focus: textColor,
            }
        };
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

let themeOfWindowID = new Map();
const ALL_THEMES = [
    new BasicColorTheme('#f2a3a3', 'light'),
    new BasicColorTheme('#f2bf8a', 'light'),
    new BasicColorTheme('#f2df8a', 'light'),
    new BasicColorTheme('#d6e38f', 'light'),
    new BasicColorTheme('#9fd9a3', 'light'),
    new BasicColorTheme('#8fd9c6', 'light'),
    new BasicColorTheme('#8fd9e2', 'light'),
    new BasicColorTheme('#9fc4e8', 'light'),
    new BasicColorTheme('#a7b0f0', 'light'),
    new BasicColorTheme('#c2a3e8', 'light'),
    new BasicColorTheme('#e3a3e8', 'light'),
    new BasicColorTheme('#e8a3c5', 'light'),
    new BasicColorTheme('#d7bca5', 'light'),
    new BasicColorTheme('#bfc7d1', 'light'),
    new BasicColorTheme('#2a2a40', 'dark'),
    new BasicColorTheme('#3d2525', 'dark'),
    new BasicColorTheme('#3b321f', 'dark'),
    new BasicColorTheme('#2a3d29', 'dark'),
    new BasicColorTheme('#1d443d', 'dark'),
    new BasicColorTheme('#223f52', 'dark'),
    new BasicColorTheme('#24305b', 'dark'),
    new BasicColorTheme('#39286b', 'dark'),
    new BasicColorTheme('#502563', 'dark'),
    new BasicColorTheme('#61274a', 'dark'),
    new BasicColorTheme('#612a2c', 'dark'),
    new BasicColorTheme('#4f4024', 'dark'),
    new BasicColorTheme('#304522', 'dark'),
    new BasicColorTheme('#1d1d1d', 'dark'),
];

function getNextTheme() {
    const sortedThemes = [...ALL_THEMES];
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
    for (const window of await browser.windows.getAll()) {
        applyTheme(window.id, getNextTheme());
    }
}

function freeTheme(windowId) {
    const theme = themeOfWindowID.get(windowId);
    theme.usage -= 1;
    themeOfWindowID.delete(windowId);
}

browser.windows.onCreated.addListener(window => applyTheme(window.id, getNextTheme()));
browser.windows.onRemoved.addListener(freeTheme);
browser.runtime.onStartup.addListener(applyThemesToAllWindows);
browser.runtime.onInstalled.addListener(applyThemesToAllWindows);

browser.runtime.onMessage.addListener(async (message) => {
    if (message.action === 'setWindowColor') {
        const { color } = message;
        let window = await browser.windows.getCurrent()
        freeTheme(window.id);
        let theme = ALL_THEMES.find(theme => theme.frame === color)
        applyTheme(window.id, theme)
    }
})
