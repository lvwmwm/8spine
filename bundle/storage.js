(function () {
  "use strict";

  var g = (typeof globalThis !== "undefined") ? globalThis : ((typeof global !== "undefined") ? global : window);

  SPINE.storage = (function () {
    var storeCache = null;

    function isStoreLike(x) {
      var direct = !!x && typeof x.getItem === "function" && typeof x.setItem === "function" && typeof x.getAllKeys === "function";
      if (direct) {
        return true;
      }
      try {
        var d = x && x.default;
        return !!d && typeof d.getItem === "function" && typeof d.setItem === "function" && typeof d.getAllKeys === "function";
      } catch (e) {}
      return false;
    }

    function unwrapStore(x) {
      if (!x) return null;
      return (typeof x.getItem === "function") ? x : x.default;
    }

    
    
    
    function findStore() {
      if (storeCache) {
        return storeCache;
      }
      var out = null;
      var NAMES = ["RNCAsyncStorage", "AsyncStorage", "RCTAsyncLocalStorage", "PlatformLocalStorage"];
      function pick(s) {
        if (!s || out) return;
        if (isStoreLike(s)) {
          out = unwrapStore(s);
        }
      }
      try { pick(g.AsyncStorage); } catch (e) {}
      try {
        var nm = g.NativeModules;
        if (nm) {
          for (var i = 0; i < NAMES.length; i++) {
            pick(nm[NAMES[i]]);
          }
        }
      } catch (e2) {}
      try {
        var t = g.__turboModuleProxy;
        if (typeof t === "function") {
          for (var j = 0; j < NAMES.length; j++) {
            try { pick(t(NAMES[j])); } catch (e3) {}
          }
        }
      } catch (e4) {}
      if (!out) {
        try {
          var pre = g.__SPINE_PRE__;
          var mods = pre && pre.mods;
          if (mods) {
            for (var k in mods) {
              try { pick(mods[k] && mods[k].exports); } catch (e5) {}
              if (out) break;
            }
          }
        } catch (e6) {}
      }
      if (out) {
        storeCache = out;
      }
      return out;
    }

    function get(key) {
      var s = findStore();
      if (!s) {
        return Promise.resolve(null);
      }
      return s.getItem(key).then(function (v) {
        return v == null ? null : v;
      }).catch(function () {
        return null;
      });
    }

    function getJSON(key, fallback) {
      return get(key).then(function (v) {
        if (v == null || v === "") {
          return fallback;
        }
        try {
          return JSON.parse(v);
        } catch (e) {
          return fallback;
        }
      });
    }

    function set(key, value) {
      var s = findStore();
      if (!s) {
        return Promise.resolve(false);
      }
      var text = typeof value === "string" ? value : JSON.stringify(value);
      return s.setItem(key, text).then(function () { return true; }).catch(function () { return false; });
    }

    
    
    function isFSLike(x) {
      function good(s) {
        return !!s && typeof s === "object" &&
          typeof s.documentDirectory === "string" &&
          typeof s.getInfoAsync === "function" &&
          typeof s.readAsStringAsync === "function" &&
          typeof s.writeAsStringAsync === "function";
      }
      if (good(x)) {
        return true;
      }
      try {
        return good(x && x.default);
      } catch (e) {}
      return false;
    }

    function unwrapFS(x) {
      if (!x) return null;
      return (x && typeof x.getInfoAsync === "function") ? x : (x ? x.default : null);
    }

    function findFS() {
      
      
      
      
      
      
      
      
      var direct = null;
      var nativePick = null;
      function isNativeLike(x) {
        return isFSLike(x) && x && typeof x.default !== "undefined" && isFSLike(x.default);
      }
      try {
        
        if (isFSLike(g.ExpoFileSystem)) nativePick = unwrapFS(g.ExpoFileSystem);
      } catch (e) {}
      try {
        if (!nativePick && isFSLike(g.FileSystem)) nativePick = unwrapFS(g.FileSystem);
      } catch (e) {}
      if (!nativePick || !direct) {
        try {
          var pre = g.__SPINE_PRE__;
          var mods = pre && pre.mods;
          if (mods) {
            for (var k in mods) {
              try {
                var ex = mods[k] && mods[k].exports;
                if (!ex) continue;
                if (isNativeLike(ex) || isFSLike(ex.default)) {
                  if (!nativePick) nativePick = unwrapFS(ex.default) || unwrapFS(ex);
                } else if (isFSLike(ex)) {
                  if (!direct) direct = unwrapFS(ex);
                }
              } catch (e5) {}
              if (nativePick && direct) break;
            }
          }
        } catch (e6) {}
      }
      var out = nativePick || direct;
      if (out) {
        
        
        
        
        
        
        
        var wrapper = direct;
        var native = nativePick;
        if (wrapper && native && wrapper !== native) {
          var merged = Object.create(native);
          try {
            if (typeof wrapper.documentDirectory === "string") merged.documentDirectory = wrapper.documentDirectory;
            if (typeof wrapper.cacheDirectory === "string") merged.cacheDirectory = wrapper.cacheDirectory;
            if (typeof wrapper.bundleDirectory === "string") merged.bundleDirectory = wrapper.bundleDirectory;
            out = merged;
          } catch (e9) {}
        }
        
        
        
        
        
        try {
          var dd = out && out.documentDirectory;
          if (typeof dd === "string" && dd !== "" && dd.charAt(dd.length - 1) !== "/") {
            out = Object.create(out);
            out.documentDirectory = dd + "/";
          }
        } catch (e7) {}
        try {
          var sp = g.SPINE;
        } catch (e8) {}
      }
      return out;
    }

    function fsDir() {
      var fs = findFS();
      if (!fs) {
        return null;
      }
      try {
        if (fs.documentDirectory) {
          return fs.documentDirectory + "parasy8/";
        }
      } catch (e) {}
      return null;
    }

    function wipe() {
      
      
      var jobs = [
        remove("spine_bundle"),
        remove("spine_bundle_v"),
        remove("spine_config"),
        remove("spine_ids")
      ];
      var fs = findFS();
      var dir = fsDir();
      if (fs && dir && typeof fs.deleteAsync === "function") {
        try {
          jobs.push(fs.deleteAsync(dir, { idempotent: true }).then(function () { return true; }).catch(function () { return false; }));
        } catch (e) {
          jobs.push(Promise.resolve(false));
        }
      }
      return Promise.all(jobs);
    }

    function remove(key) {
      var s = findStore();
      if (!s) {
        return Promise.resolve(false);
      }
      return s.removeItem(key).then(function () { return true; }).catch(function () { return false; });
    }

    function allRaw() {
      var s = findStore();
      if (!s) {
        return Promise.resolve({});
      }
      var out = {};
      return s.getAllKeys().then(function (keys) {
        var all = keys || [];
        var p = Promise.resolve();
        all.forEach(function (k) {
          p = p.then(function () {
            return s.getItem(k).then(function (v) {
              if (v != null) {
                out[k] = String(v).slice(0, 500);
              }
            }).catch(function () {});
          });
        });
        return p;
      }).then(function () {
        return out;
      }).catch(function () {
        return out;
      });
    }

    return {
      find: findStore,
      fs: findFS,
      fsDir: fsDir,
      get: get,
      getJSON: getJSON,
      set: set,
      remove: remove,
      wipe: wipe,
      allRaw: allRaw
    };
  })();
})();