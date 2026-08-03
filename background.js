const SCRIPT_ID = 'classic-yandex-music-design';
const STORAGE_KEY = 'designEnabled';
const MATCHES = [
    '*://music.yandex.ru/*',
    '*://music.yandex.by/*',
    '*://music.yandex.kz/*',
    '*://music.yandex.uz/*',
    '*://music.yandex.com/*',
];
let stateOperation = Promise.resolve();

function queueStateOperation(operation) {
    const result = stateOperation.then(operation, operation);
    stateOperation = result.catch(() => {});
    return result;
}

async function getEnabled() {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    return stored[STORAGE_KEY] !== false;
}

async function updateActionTitle(enabled) {
    await chrome.action.setTitle({
        title: enabled ? 'Старый дизайн включён' : 'Старый дизайн выключен',
    });
}

async function applyState(enabled) {
    const registered = await chrome.scripting.getRegisteredContentScripts({
        ids: [SCRIPT_ID],
    });

    if (enabled && registered.length === 0) {
        await chrome.scripting.registerContentScripts([{
            id: SCRIPT_ID,
            matches: MATCHES,
            js: ['inject.js'],
            runAt: 'document_start',
            world: 'MAIN',
            allFrames: true,
            persistAcrossSessions: true,
        }]);
    } else if (!enabled && registered.length > 0) {
        await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
    }

    await updateActionTitle(enabled);
}

async function initialize() {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const enabled = stored[STORAGE_KEY] !== false;

    if (typeof stored[STORAGE_KEY] !== 'boolean') {
        await chrome.storage.local.set({ [STORAGE_KEY]: true });
    }

    await applyState(enabled);
    return enabled;
}

async function reloadYandexMusicTabs() {
    const tabs = await chrome.tabs.query({ url: MATCHES });
    await Promise.all(tabs.map(async (tab) => {
        if (typeof tab.id !== 'number') return;

        try {
            await chrome.tabs.reload(tab.id);
        } catch (error) {
            console.error(error);
        }
    }));
}

async function setEnabled(enabled) {
    await chrome.storage.local.set({ [STORAGE_KEY]: enabled });
    await applyState(enabled);
    await reloadYandexMusicTabs().catch(console.error);
    return enabled;
}

chrome.runtime.onInstalled.addListener(() => {
    queueStateOperation(initialize).catch(console.error);
});

chrome.runtime.onStartup.addListener(() => {
    queueStateOperation(initialize).catch(console.error);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'get-design-enabled') {
        queueStateOperation(initialize)
            .then((enabled) => sendResponse({ enabled }))
            .catch((error) => sendResponse({ error: error.message }));
        return true;
    }

    if (message?.type === 'set-design-enabled') {
        queueStateOperation(() => setEnabled(message.enabled === true))
            .then((enabled) => sendResponse({ enabled }))
            .catch((error) => sendResponse({ error: error.message }));
        return true;
    }

    return false;
});
