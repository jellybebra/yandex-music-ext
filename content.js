(function() {
  console.log("[YandexMusicExt] Classic Vibe extension loaded (minimal)");

  // --- Safely intercept window.__STATE_SNAPSHOT__ to disable new vibe experiments ---
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

})();
