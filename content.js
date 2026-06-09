(window.__STATE_SNAPSHOT__ ||= []).push = function(...args) {
  args.forEach(item => {
    const exps = item?.experiments?.experiments;
    if (exps) {
      ["WebNextNewWaveTab", "WebNextNewWaveTabRedesign", "WebNextNewWaveWizard"].forEach(f => {
        if (exps[f]) exps[f] = { group: "off", value: { title: "off", enabled: false } };
      });
    }
  });
  return Array.prototype.push.apply(this, args);
};
