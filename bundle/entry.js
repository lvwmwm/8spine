(function () {
  "use strict";

  var g = (typeof globalThis !== "undefined") ? globalThis : ((typeof global !== "undefined") ? global : window);

  if (g.SPINE && g.SPINE.booted) {
    return;
  }

  var SPINE = (g.SPINE = g.SPINE || {});
  SPINE.version = "0.13.7";
  SPINE.booted = false;
  SPINE.warmupEnabled = true;
  SPINE.app = { bundleTime: g.__BUNDLE_START_TIME__ || 0 };
  SPINE.log = function (tag, msg) {
    try {
      if (g.console && g.console.log) {
        g.console.log("[SPINE] " + tag + ": " + msg);
      }
    } catch (e) {}
  };
  SPINE.beacon = function (tag, msg) {
    return null;
  };
  SPINE.error = function (tag, err) {
    try {
      if (g.console && g.console.warn) {
        g.console.warn("[SPINE] " + tag + " ERROR: " + (err && err.message ? err.message : err));
      }
    } catch (e) {}
  };
  SPINE.mods = [];
  SPINE.registerMod = function (name, fn) {
    SPINE.mods.push({ name: name, run: fn });
  };

  var bootRun = false;
  SPINE.boot = function () {
    if (bootRun) {
      return SPINE.lastBoot;
    }
    bootRun = true;
    var failures = {};
    try {
      if (SPINE.metro && typeof SPINE.metro.seedMirror === "function") {
        SPINE.metro.seedMirror();
      }
      if (SPINE.prefs && typeof SPINE.prefs.load === "function") {
        SPINE.prefs.load();
      }
      if (SPINE.exporter && typeof SPINE.exporter.warmup === "function" && SPINE.warmupEnabled !== false) {
        SPINE.exporter.warmup();
      }
    } catch (e) {}
    SPINE.mods.forEach(function (mod) {
      try {
        var r = mod.run(SPINE);
        if (r && r.applied === false) {
          failures[mod.name] = r;
        }
      } catch (err) {
        failures[mod.name] = { applied: false, error: err };
        SPINE.error("mod:" + mod.name, err);
      }
    });
    SPINE.booted = true;
    SPINE.lastBoot = { at: Date.now(), failures: failures };
    SPINE.log("boot", "mods: " + SPINE.mods.length + ", falhos: " + (Object.keys(failures).join(",") || "nenhum"));
    return SPINE.lastBoot;
  };
})();
