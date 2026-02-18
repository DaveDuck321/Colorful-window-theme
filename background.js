class BasicColorTheme {
    constructor(frame, tab_background_text = '#111') {
        this.frame = frame;
        this.tab_background_text = tab_background_text;
        this.usage = 0;
        this.lastUsed = Math.random();
    }

    get browserThemeObject() {
        return {
            colors: {
                frame: this.frame,
                tab_background_text: this.tab_background_text,
            }
        };
    }
}

let themeOfWindowID = new Map();
const ALL_THEMES = [
    new BasicColorTheme('#ec5f67'),
    new BasicColorTheme('#f99157'),
    new BasicColorTheme('#fac863'),
    new BasicColorTheme('#99c794'),
    new BasicColorTheme('#5fb3b3'),
    new BasicColorTheme('#6699cc'),
    new BasicColorTheme('#c594c5'),
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
