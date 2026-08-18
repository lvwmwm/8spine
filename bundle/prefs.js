(function () {
  "use strict";

  var g = (typeof globalThis !== "undefined") ? globalThis : ((typeof global !== "undefined") ? global : window);

  
  
  
  
  SPINE.prefs = (function () {
    var KEY = "spine_prefs";
    var cache = null;
    var loading = null;

    function load() {
      if (cache) return Promise.resolve(cache);
      if (loading) return loading;
      loading = Promise.resolve().then(function () {
        if (SPINE.storage && typeof SPINE.storage.getJSON === "function") {
          return SPINE.storage.getJSON(KEY, {});
        }
        return {};
      }).then(function (o) {
        cache = (o && typeof o === "object") ? o : {};
        loading = null;
        return cache;
      }).catch(function () {
        cache = {};
        loading = null;
        return cache;
      });
      return loading;
    }

    function get(key, fallback) {
      if (cache && Object.prototype.hasOwnProperty.call(cache, key)) {
        return cache[key];
      }
      return fallback;
    }

    function set(key, value) {
      cache = cache || {};
      cache[key] = value;
      if (SPINE.storage && typeof SPINE.storage.set === "function") {
        return SPINE.storage.set(KEY, cache);
      }
      return Promise.resolve(false);
    }

    return {
      load: load,
      get: get,
      set: set,
      key: KEY
    };
  })();
})();