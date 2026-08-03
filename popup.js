const toggle = document.querySelector('#design-toggle');
const status = document.querySelector('#status');

function showState(enabled) {
    toggle.checked = enabled;
    status.textContent = '';
}

async function initialize() {
    const response = await chrome.runtime.sendMessage({
        type: 'get-design-enabled',
    });

    if (response?.error) {
        throw new Error(response.error);
    }

    showState(response?.enabled !== false);
}

toggle.addEventListener('change', async () => {
    const previousValue = !toggle.checked;
    status.textContent = '';

    try {
        const response = await chrome.runtime.sendMessage({
            type: 'set-design-enabled',
            enabled: toggle.checked,
        });

        if (response?.error) {
            throw new Error(response.error);
        }

        showState(response.enabled);
    } catch (error) {
        showState(previousValue);
        status.textContent = 'Не удалось изменить настройку';
        console.error(error);
    }
});

initialize().catch((error) => {
    status.textContent = 'Не удалось загрузить настройку';
    console.error(error);
});
