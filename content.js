(function() {
    console.log('[Old Vibe] Injecting override script...');
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    
    // Try to copy CSP nonces if any scripts are already parsed
    const nonceEl = document.querySelector('script[nonce]');
    if (nonceEl) {
        script.setAttribute('nonce', nonceEl.nonce || nonceEl.getAttribute('nonce'));
    }
    
    // Append to documentElement immediately (document.head might be null at document_start)
    (document.head || document.documentElement).appendChild(script);
    
    // Cleanup the DOM node after execution
    script.onload = () => script.remove();
})();
