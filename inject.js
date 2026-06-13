(function() {
    const patches = window.__STATE_PATCHES__ = window.__STATE_PATCHES__ || [];
    
    function overrideFlag(patchArray) {
        if (!Array.isArray(patchArray)) return;
        for (const op of patchArray) {
            if (op && op.path === '/experiments/experiments' && op.value) {
                const exps = op.value;
                if (exps.WebNextNewWaveTab) {
                    exps.WebNextNewWaveTab.group = 'default';
                    exps.WebNextNewWaveTab.value = { title: 'default' };
                }
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
