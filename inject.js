(function() {
    const FLAG = 'WebNextNewWaveTab';

    function overrideExperiments(experiments) {
        const flag = experiments?.[FLAG];
        if (!flag || typeof flag !== 'object') return;
        flag.group = 'default';
        flag.value = { title: 'default' };
    }

    // music-spa loads experiments through the API instead of SSR state patches.
    // Patch only the experiments response, preserving the native Response and
    // its status, headers, streaming body, cloning and error behavior.
    const originalJson = Response.prototype.json;
    Response.prototype.json = function(...args) {
        const result = originalJson.apply(this, args);
        let url;
        try {
            url = new URL(this.url);
        } catch {
            return result;
        }
        if (!/^https?:$/.test(url.protocol)
            || !/^(?:api\.)?music\.yandex\.(?:ru|by|kz|uz|com|net)$/.test(url.hostname)
            || url.pathname !== '/account/experiments/details') {
            return result;
        }
        return result.then(data => {
            overrideExperiments(data);
            overrideExperiments(data?.result);
            return data;
        });
    };

    const patches = window.__STATE_PATCHES__ = window.__STATE_PATCHES__ || [];
    
    function overrideFlag(patchArray) {
        if (!Array.isArray(patchArray)) return;
        for (const op of patchArray) {
            if (op && op.path === '/experiments/experiments' && op.value) {
                overrideExperiments(op.value);
            }
        }
    }

    // Run on any patches already pushed
    patches.forEach(overrideFlag);

    // Wrap push for future patches
    const originalPush = patches.push;
    patches.push = function(...args) {
        args.forEach(overrideFlag);
        return originalPush.apply(this, args);
    };
})();
