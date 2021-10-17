const THEMES = [
    {
        colors: {
            frame: '#D7392C',
            tab_background_text: '#111',
        }
    },
    {
        colors: {
            frame: '#CA6948',
            tab_background_text: '#111',
        }
    },
    {
        colors: {
            frame: '#B8B565',
            tab_background_text: '#111',
        }
    },
    {
        colors: {
            frame: '#3DB8B5',
            tab_background_text: '#111',
        }
    },
    {
        colors: {
            frame: '#1F82BC',
            tab_background_text: '#111',
        }
    },
];

let lastThemeIndex = 0;

function getNextTheme() {
    lastThemeIndex = (lastThemeIndex + 1) % THEMES.length;
    return THEMES[lastThemeIndex];
}

browser.windows.onCreated.addListener((window) => {
    browser.theme.update(window.id, getNextTheme());
});
