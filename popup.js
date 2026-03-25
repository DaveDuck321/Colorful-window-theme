const MODE_LIGHT = 'light';
const MODE_DARK = 'dark';

document.addEventListener('DOMContentLoaded', async () => {
  const modeToggle = document.getElementById('mode-toggle');
  const colorButtons = Array.from(document.querySelectorAll('.color-button'));

  let activeMode = MODE_LIGHT;
  try {
    const response =
        await browser.runtime.sendMessage({action: 'getColorMode'});
    activeMode = response?.mode === MODE_DARK ? MODE_DARK : MODE_LIGHT;
  } catch (_) {
    activeMode = MODE_LIGHT;
  }

  modeToggle.checked = activeMode === MODE_DARK;
  applyModeVisibility(colorButtons, activeMode);
  applyPopupTheme(activeMode);

  modeToggle.addEventListener('change', async () => {
    const requestedMode = modeToggle.checked ? MODE_DARK : MODE_LIGHT;
    let nextMode = requestedMode;

    try {
      const response = await browser.runtime.sendMessage({
        action: 'setColorMode',
        mode: requestedMode,
      });
      nextMode = response?.mode === MODE_DARK ? MODE_DARK : MODE_LIGHT;
    } catch (_) {
      nextMode = requestedMode;
    }

    modeToggle.checked = nextMode === MODE_DARK;
    applyModeVisibility(colorButtons, nextMode);
    applyPopupTheme(nextMode);
  });

  colorButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      await browser.runtime.sendMessage({
        action: 'setWindowColor',
        color: button.dataset.color,
      });
    });
  });
});

function applyModeVisibility(buttons, mode) {
  buttons.forEach((button) => {
    const isDarkSwatch = button.classList.contains('dark-swatch');
    const isVisibleInMode = mode === MODE_DARK ? isDarkSwatch : !isDarkSwatch;
    button.classList.toggle('mode-hidden', !isVisibleInMode);
  });
}

function applyPopupTheme(mode) {
  document.body.classList.toggle('popup-dark', mode === MODE_DARK);
}
