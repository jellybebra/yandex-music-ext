(function() {
  const disableFlags = ["WebNextNewWaveTab", "WebNextNewWaveTabRedesign", "WebNextNewWaveWizard"];
  
  function modify(item) {
    const exps = item?.experiments?.experiments;
    if (exps) {
      disableFlags.forEach(f => {
        if (exps[f]) {
          exps[f].group = "off";
          exps[f].value = { title: "off", enabled: false };
        }
      });
    }
  }

  const arr = window.__STATE_SNAPSHOT__ || [];
  const oldPush = arr.push;
  arr.push = function() {
    for (let i = 0; i < arguments.length; i++) modify(arguments[i]);
    return oldPush.apply(this, arguments);
  };
  arr.forEach(modify);
  window.__STATE_SNAPSHOT__ = arr;
})();
