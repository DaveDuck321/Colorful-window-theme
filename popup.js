document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.color-button').forEach(button => {
        button.addEventListener('click', async () => {
            await browser.runtime.sendMessage({
                action: 'setWindowColor',
                color: button.dataset.color
            });
        });
    });
});