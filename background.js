const THEMES = [
    {
        colors: {
            frame: '#ec5f67',
            tab_background_text: '#111',
        }
    },
    {
        colors: {
            frame: '#f99157',
            tab_background_text: '#111',
        }
    },
    {
        colors: {
            frame: '#fac863',
            tab_background_text: '#111',
        }
    },
    {
        colors: {
            frame: '#99c794',
            tab_background_text: '#111',
        }
    },
    {
        colors: {
            frame: '#5fb3b3',
            tab_background_text: '#111',
        }
    },

    {
        colors: {
            frame: '#6699cc',
            tab_background_text: '#111',
        }
    },
    {
        colors: {
            frame: '#c594c5',
            tab_background_text: '#111',
        }
    },
    {
        colors: {
            frame: '#ab7967',
            tab_background_text: '#111',
        }
    },
];

let lastThemeIndex = 0;

function getNextTheme() {
    lastThemeIndex = (lastThemeIndex + 1) % THEMES.length;
    return THEMES[lastThemeIndex];
}

function applyThemeToWindow(window) {
    browser.theme.update(window.id, getNextTheme());
}

async function applyThemeToAllWindows() {
    for (const window of await browser.windows.getAll()) {
        applyThemeToWindow(window);
    }
}

browser.windows.onCreated.addListener(applyThemeToWindow);
browser.runtime.onStartup.addListener(applyThemeToAllWindows);
browser.runtime.onInstalled.addListener(applyThemeToAllWindows);
