(function() {
  console.log("[YandexMusicExt] Classic Vibe extension loaded");

  // --- Step 1: Intercept window.__STATE_SNAPSHOT__ safely ---
  function modifySnapshot(item) {
    try {
      if (item && item.experiments && item.experiments.experiments) {
        const exps = item.experiments.experiments;
        const disableFlags = [
          "WebNextNewWaveTab",
          "WebNextNewWaveTabRedesign",
          "WebNextNewWaveWizard"
        ];
        disableFlags.forEach(flag => {
          if (exps[flag]) {
            exps[flag].group = "off";
            exps[flag].value = { title: "off", enabled: false };
          }
        });
        console.log("[YandexMusicExt] Overrode state snapshot experiments:", exps);
      }
    } catch (e) {
      console.error("[YandexMusicExt] Error modifying snapshot:", e);
    }
  }

  // Pre-initialize window.__STATE_SNAPSHOT__ as a standard array with overridden push
  if (!window.__STATE_SNAPSHOT__) {
    const arr = [];
    arr.push = function() {
      for (let i = 0; i < arguments.length; i++) {
        modifySnapshot(arguments[i]);
      }
      return Array.prototype.push.apply(this, arguments);
    };
    window.__STATE_SNAPSHOT__ = arr;
  } else if (Array.isArray(window.__STATE_SNAPSHOT__)) {
    const arr = window.__STATE_SNAPSHOT__;
    const oldPush = arr.push;
    arr.push = function() {
      for (let i = 0; i < arguments.length; i++) {
        modifySnapshot(arguments[i]);
      }
      return oldPush.apply(this, arguments);
    };
    arr.forEach(modifySnapshot);
  }


  // --- Step 2: DOM Cleanup & Layout Swapping ---
  let isCleaning = false;

  function applyDOMCleanup() {
    if (isCleaning) return;
    isCleaning = true;

    // Disconnect observer during DOM changes to avoid triggering infinite loop
    observer.disconnect();

    try {
      const isMainPage = window.location.pathname === '/' || window.location.pathname === '/home';

      // 1. Swap layout classes to restore standard player layout
      const root = document.querySelector('.DefaultLayout_rootNewVibe__MSDOn');
      if (root) {
        root.classList.remove('DefaultLayout_rootNewVibe__MSDOn');
        root.classList.add('DefaultLayout_root__7J0wo');
      }

      const content = document.querySelector('.Content_rootOld_newVibe__4CZFU');
      if (content) {
        content.classList.remove('Content_rootOld_newVibe__4CZFU');
      }

      const main = document.querySelector('.Content_main_newVibe__tfCx9');
      if (main) {
        main.classList.remove('Content_main_newVibe__tfCx9');
      }

      // 2. Hide redesigned sections if they somehow render
      if (isMainPage) {
        const swiper = document.querySelector('section.swiper, .VibePage_wheel__E_p8_');
        if (swiper) {
          swiper.style.setProperty('display', 'none', 'important');
        }

        const vibePlayer = document.querySelector('.VibePlayerBar_root__G3MOe, .VibePage_playerBlock__b6ZRu');
        if (vibePlayer) {
          vibePlayer.style.setProperty('display', 'none', 'important');
        }
      }

    } catch (e) {
      console.error("[YandexMusicExt] Cleanup error:", e);
    } finally {
      // Reconnect observer
      if (document.documentElement) {
        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class']
        });
      }
      isCleaning = false;
    }
  }

  // Setup observer
  const observer = new MutationObserver(() => {
    applyDOMCleanup();
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  setInterval(applyDOMCleanup, 400);

})();
