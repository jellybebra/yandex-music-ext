(() => {
    if (globalThis.classicDonationLoaded) return;
    globalThis.classicDonationLoaded = true;

    const HOST_ID = 'classic-music-donation';
    let enabled = true;
    let host;
    let frame;

    function mount() {
        if (!enabled) {
            host?.remove();
            host = undefined;
            return;
        }
        // The classic wave is a positioned container. Never attach to the player
        // or unrelated pages when Yandex changes its layout.
        const wave = document.querySelector('[class*="VibeBlock_root__"]');
        if (!wave) {
            host?.remove();
            host = undefined;
            return;
        }
        if (host?.parentElement === wave) return;
        host?.remove();
        host = document.createElement('div');
        host.id = HOST_ID;
        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <style>
                :host { position: absolute; right: 24px; bottom: 20px; z-index: 5;
                    max-width: calc(100% - 48px); font-family: inherit; color-scheme: dark; text-align: right; }
                * { box-sizing: border-box; }
                .caption { display: block; margin-bottom: 3px; color: #999; font-size: 11px; line-height: 1.4; }
                a { display: inline-flex; align-items: center; gap: 6px; padding: 5px 0; color: #999; font-size: 12px;
                    line-height: 1.4; text-decoration: none; transition: color 150ms; }
                a:hover { color: #fff; }
                a:focus-visible {
                    outline: 2px solid #ffdd00; outline-offset: 3px; border-radius: 4px; }
                svg { width: 14px; height: 14px; flex: 0 0 auto; }
                @media (max-width: 600px) { :host { right: 16px; bottom: 16px; max-width: calc(100% - 32px); } }
                @media (prefers-reduced-motion: reduce) { a { transition: none; } }
            </style>
            <span class="caption">Нравится старый дизайн?</span>
                    <a href="https://pay.cloudtips.ru/p/8f144f28" target="_blank" rel="noopener noreferrer"
                       title="Поддержать автора расширения «Старый дизайн Яндекс Музыки» — откроется страница доната"
                       aria-label="Поддержать автора расширения «Старый дизайн Яндекс Музыки» (в новой вкладке)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg><span>Сказать спасибо</span></a>
`;
        wave.append(host);
    }

    function scheduleMount() {
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = undefined;
            mount();
        });
    }

    chrome.storage.local.get('designEnabled').then(stored => {
        enabled = stored.designEnabled !== false;
        mount();
        const observer = new MutationObserver(scheduleMount);
        observer.observe(document.body, { childList: true, subtree: true });
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area !== 'local' || !changes.designEnabled) return;
            enabled = changes.designEnabled.newValue !== false;
            mount();
        });
    }).catch(console.error);
})();
