(function () {
  "use strict";

  var g = (typeof globalThis !== "undefined") ? globalThis : ((typeof global !== "undefined") ? global : window);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  function isSL(s) {
    return !!s && typeof s.getItem === "function" && typeof s.setItem === "function";
  }

  function findStore() {
    try { if (typeof AsyncStorage !== "undefined" && isSL(AsyncStorage)) return AsyncStorage; } catch (e) {}
    try { if (isSL(g.AsyncStorage)) return g.AsyncStorage; } catch (e) {}
    try {
      var t = g.__turboModuleProxy;
      if (typeof t === "function") {
        var n = ["RNCAsyncStorage", "AsyncStorage", "PlatformLocalStorage"];
        for (var i = 0; i < n.length; i++) { try { var m = t(n[i]); if (isSL(m)) return m; } catch (e2) {} }
      }
    } catch (e3) {}
    return null;
  }

  var pre = null;
  try {
    pre = (g.__SPINE_PRE__ = g.__SPINE_PRE__ || {});
  } catch (e) { pre = {}; }

  var mirror = (pre.mods = pre.mods || {});
  var cbs = (pre.modsCbs = pre.modsCbs || []);

  function pushCb(cb) {
    cbs.push(cb);
  }

  function installSpy() {
    if (g.__SPINE_MODS_SPY__) {
      return { ok: true, already: true };
    }
    if (typeof Map !== "function" || typeof Map.prototype.get !== "function") {
      return { ok: false, reason: "no-map" };
    }
    var origGet = Map.prototype.get;
    Map.prototype.get = function spineSpyMapGet(k) {
      try { g.__SPINE_SPY_HITS__ = (g.__SPINE_SPY_HITS__ || 0) + 1; } catch (e) {}
      var r = origGet.call(this, k);
      try {
        if (r && typeof r === "object" && r.publicModule && (r.isInitialized !== undefined || r.factory !== undefined)) {
          var id = String(k);
          var rec = mirror[id];
          if (!rec) {
            rec = mirror[id] = {};
          }
          rec.id = id;
          if (r.isInitialized) {
            rec.initialized = true;
          }
          if (r.factory && typeof r.factory === "function") {
            try { rec.source = r.factory.toString(); } catch (e) {}
          }
          var ex = r.publicModule.exports;
          if (ex !== undefined) {
            rec.exports = ex;
          }
          for (var i = 0; i < cbs.length; i++) {
            try { cbs[i](id, rec, r); } catch (e2) {}
          }
        }
      } catch (e3) {}
      return r;
    };
    g.__SPINE_MODS_SPY__ = 1;
    return { ok: true };
  }

  function seedMirror() {
    var pre = null;
    try {
      pre = g.__SPINE_PRE__;
    } catch (e) {}
    if (!pre) {
      return { ok: false, reason: "no-pre" };
    }
    var mirror = pre.mods || {};
    var cbs = pre.modsCbs || [];
    var req = null;
    try {
      req = g.__r;
    } catch (e) {}
    if (typeof req !== "function") {
      return { ok: false, reason: "no-runtime" };
    }
    if (pre.scanState === "ok") {
      return { ok: true, scanned: 0, cache: "skip" };
    }
    var busy = null;
    try {
      busy = g.__SPINE_SCAN_BUSY__;
      g.__SPINE_SCAN_BUSY__ = 1;
    } catch (e) {}
    if (busy) {
      return { ok: true, scanned: 0, cache: "busy" };
    }

    var out = { ok: true, scanned: 0, missed: 0, cache: "none", found: 0, ms: 0 };
    var t0 = Date.now();
    var MAX = 65535;
    var MISS_LIMIT = 300;
    var TIME_CAP = 3000;
    var HI_PART1 = 1200;
    var targets = [];
    var done = false;

    function capture(id, ex) {
      var sid = String(id);
      var rec = mirror[sid];
      if (!rec) {
        rec = mirror[sid] = {};
      }
      rec.id = sid;
      rec.initialized = true;
      if (ex !== undefined) {
        rec.exports = ex;
      }
      out.scanned++;
      for (var j = 0; j < cbs.length; j++) {
        try { cbs[j](sid, rec, { publicModule: { exports: ex } }); } catch (e2) {}
      }
    }

    function stReady() {
      var st = null;
      try {
        st = pre.settings || null;
      } catch (e) {}
      return !!(st && st.Orig);
    }

    function isTargetish(ex) {
      if (!ex || typeof ex !== "object") {
        return false;
      }
      if (typeof ex.jsx === "function" && typeof ex.jsxs === "function" && typeof ex.createElement !== "function") {
        return true;
      }
      if (typeof ex.createElement === "function" && typeof ex.version === "string") {
        return true;
      }
      if (typeof ex.View === "function" && typeof ex.Text === "function" && typeof ex.Pressable === "function") {
        return true;
      }
      if (ex.styles && typeof ex.styles === "object" && typeof ex.SettingsGroup === "function") {
        return true;
      }
      
      if (ex.__esModule && ex.default && typeof ex.default === "object" &&
        ex.default.styles && typeof ex.default.styles === "object" &&
        typeof ex.default.SettingsGroup === "function") {
        return true;
      }
      if (typeof ex.Ionicons === "function" || typeof ex.alert === "function") {
        return true;
      }
      var d = null;
      try {
        d = ex.__esModule ? ex.default : null;
        if (d == null) {
          d = ex;
        }
      } catch (e) {}
      if (d && typeof d === "function" && (d.name === "SettingsPage" || d.displayName === "SettingsPage" ||
        d.name === "SettingsIconContainer" || d.displayName === "SettingsIconContainer")) {
        return true;
      }
      return false;
    }

    function finishScan() {
      if (done) {
        return;
      }
      done = true;
      try { g.__SPINE_SCAN_BUSY__ = 0; } catch (e) {}
      out.ms = Date.now() - t0;
      try {
        var s2 = findStore();
        if (s2 && typeof s2.setItem === "function" && targets.length) {
          s2.setItem("spine_ids", JSON.stringify({ at: Date.now(), ids: targets }));
        }
      } catch (e) {}
      if (stReady()) {
        pre.scanState = "ok";
      }
    }

    
    function step(i) {
      var ex = null;
      try {
        ex = req(i);
      } catch (e) {
        out.missed++;
        if (++misses > MISS_LIMIT) {
          return false;
        }
        return true;
      }
      misses = 0;
      capture(i, ex);
      if (isTargetish(ex)) {
        targets.push(i);
        out.found++;
        if (targets.length >= 8) {
          return false;
        }
      }
      return true;
    }

    
    var cacheGot = null;
    var cacheSeen = false;
    function tryCacheJump() {
      if (done) {
        return false;
      }
      if (cacheSeen) {
        return false;
      }
      cacheSeen = true;
      if (!cacheGot || !cacheGot.ids || !cacheGot.ids.length) {
        return false;
      }
      var okAll = true;
      for (var i = 0; i < cacheGot.ids.length; i++) {
        try {
          var ex = req(cacheGot.ids[i]);
          capture(cacheGot.ids[i], ex);
          if (!isTargetish(ex)) {
            okAll = false;
          }
        } catch (e) {
          okAll = false;
        }
      }
      if (okAll && stReady()) {
        out.cache = "hit";
        pre.scanState = "ok";
        finishScan();
        return true;
      }
      out.cache = "stale";
      return false;
    }

    var misses = 0;
    var i = 0;

    
    for (; i <= HI_PART1 && i <= MAX; i++) {
      if (!step(i)) {
        break;
      }
    }

    
    function scanRest() {
      for (; i <= MAX; i++) {
        if (out.ms > TIME_CAP) {
          break;
        }
        if (!step(i)) {
          break;
        }
      }
    }
    try {
      setTimeout(function () {
        if (!done) {
          scanRest();
          out.cache = "miss";
          finishScan();
        }
      }, TIME_CAP);
    } catch (e) {}
    try {
      var s = findStore();
      if (s && typeof s.getItem === "function") {
        s.getItem("spine_ids").then(function (v) {
          try {
            var c = v ? JSON.parse(v) : null;
            if (c && Array.isArray(c.ids)) {
              cacheGot = c;
            }
          } catch (e) {}
          if (tryCacheJump()) {
            return;
          }
          scanRest();
          out.cache = !cacheGot ? "miss" : "stale";
          finishScan();
        }).catch(function () {
          scanRest();
          out.cache = "miss";
          finishScan();
        });
      } else {
        scanRest();
        out.cache = "miss";
        finishScan();
      }
    } catch (e) {
      scanRest();
      out.cache = "miss";
      finishScan();
    }

    return out;
  }

  installSpy();
  
  
  
  
  

  SPINE.metro = (function () {

    function snapshot() {
      var out = [];
      var m = mirror;
      for (var k in m) {
        var rec = m[k];
        if (rec && rec.exports !== undefined) {
          out.push(rec);
        }
      }
      return out;
    }

    function matchesAny(exps, filter, meta) {
      if (!exps || typeof exps !== "object") {
        return false;
      }
      
      
      
      try {
        if (filter(exps, meta) === true) {
          return true;
        }
      } catch (e) {}
      try {
        if (exps.default !== undefined && filter(exps.default, meta) === true) {
          return true;
        }
      } catch (e) {}
      return false;
    }

    function find(filter, opts) {
      opts = opts || {};
      var list = snapshot();
      for (var i = 0; i < list.length; i++) {
        var rec = list[i];
        var meta = { id: rec.id, source: rec.source || null, initialized: !!rec.initialized };
        if (matchesAny(rec.exports, filter, meta)) {
          return { id: rec.id, module: rec.exports, source: meta.source };
        }
      }
      return null;
    }

    function findAll(filter, opts) {
      opts = opts || {};
      var out = [];
      var list = snapshot();
      for (var i = 0; i < list.length; i++) {
        var rec = list[i];
        var meta = { id: rec.id, source: rec.source || null, initialized: !!rec.initialized };
        if (matchesAny(rec.exports, filter, meta)) {
          out.push({ id: rec.id, module: rec.exports, source: meta.source });
        }
      }
      return out;
    }

    
    
    
    function scanDirect(filter) {
      var list = snapshot();
      for (var i = 0; i < list.length; i++) {
        var rec = list[i];
        var meta = { id: rec.id, source: rec.source || null, initialized: !!rec.initialized };
        var ex = rec.exports;
        if (ex && typeof ex === "object") {
          try {
            if (filter(ex, meta) === true) {
              return { id: rec.id, module: ex, source: meta.source };
            }
          } catch (e) {}
        }
      }
      return null;
    }

    function byProps(props) {
      var list = Array.isArray(props) ? props : [props];
      return function (exps) {
        if (!exps || typeof exps !== "object") {
          return false;
        }
        for (var i = 0; i < list.length; i++) {
          if (exps[list[i]] === undefined) {
            return false;
          }
        }
        return true;
      };
    }

    function byName(name) {
      return function (exps) {
        if (!exps) {
          return false;
        }
        if (typeof exps === "function") {
          return exps.name === name || exps.displayName === name;
        }
        if (typeof exps === "object") {
          return exps.name === name || exps.displayName === name ||
            (exps.type && (exps.type.name === name || exps.type.displayName === name));
        }
        return false;
      };
    }

    function bySourceSubstring(text) {
      return function (exps, meta) {
        if (!exps) {
          return false;
        }
        var src = (meta && meta.source) || null;
        if (!src) {
          var target = (exps.default && typeof exps.default === "function") ? exps.default : exps;
          if (typeof target !== "function") {
            return false;
          }
          try {
            src = target.toString();
          } catch (e) {
            return false;
          }
        }
        return typeof src === "string" && src.indexOf(text) !== -1;
      };
    }

    
    
    
    function findP(filter, timeoutMs) {
      timeoutMs = timeoutMs || 20000;
      return new Promise(function (resolve) {
        var deadline = Date.now() + timeoutMs;
        (function poll() {
          var f = find(filter);
          if (f) {
            resolve(f);
            return;
          }
          try { seedMirror(); } catch (e) {}
          if (Date.now() >= deadline) {
            resolve(null);
            return;
          }
          try { setTimeout(poll, 400); } catch (e) {}
        })();
      });
    }

    
    
    
    
    
    
    
    
    
    
    function findLazyP(filter, opts) {
      opts = opts || {};
      var timeoutMs = opts.timeoutMs || 20000;
      var chunkMs = opts.chunkMs || 30;
      var req = null;
      try { req = g.__r; } catch (e) {}
      if (typeof req !== "function") {
        return Promise.resolve(null);
      }
      var ids = null;
      try {
        var mods = (typeof req.getModules === "function") ? req.getModules() : null;
        if (!mods && typeof g.__c === "function") {
          
          
          mods = g.__c();
        }
        if (mods) {
          ids = [];
          if (typeof mods.keys === "function") {
            var it = mods.keys();
            for (;;) {
              var step = it.next();
              if (step.done) break;
              ids.push(step.value);
            }
          } else {
            for (var k in mods) {
              if (Object.prototype.hasOwnProperty.call(mods, k)) {
                ids.push(k);
              }
            }
          }
          ids.sort(function (a, b) { return Number(a) - Number(b); });
        }
      } catch (e) {
        ids = null;
      }
      var deadline = Date.now() + timeoutMs;
      var i = 0;
      var totalMisses = 0;
      var maxSeen = 0;
      return new Promise(function (resolve) {
        if (!opts.skipFind) {
          var f0 = find(filter);
          if (f0) {
            resolve(f0);
            return;
          }
        }
        if (!ids || !ids.length) {
          resolve(null);
          return;
        }
        function loop() {
          var t0 = Date.now();
          while (i < ids.length && Date.now() - t0 < chunkMs) {
            if (Date.now() >= deadline) {
              resolve(null);
              return;
            }
            var cur = ids[i];
            var num = Number(cur);
            var sid = String(cur);
            var src = null;
            try {
              var rr = (mods && typeof mods.get === "function") ? mods.get(cur) : null;
              if (rr && typeof rr.factory === "function") {
                src = String(rr.factory);
              }
            } catch (e) {}
            if (!src) {
              var mr = mirror[sid];
              if (mr) src = mr.source || null;
            }
            
            
            var srcHit = false;
            if (src) {
              try {
                if (matchesAny({}, filter, { id: sid, source: src, initialized: false })) {
                  srcHit = true;
                }
              } catch (e) {}
            }
            if (!srcHit) {
              var ex = null;
              try {
                ex = req(cur);
              } catch (e) {
                totalMisses++;
                i++;
                continue;
              }
              if (num > maxSeen) maxSeen = num;
              var rec = mirror[sid] || (mirror[sid] = {});
              rec.id = sid;
              rec.initialized = true;
              if (ex !== undefined) {
                rec.exports = ex;
              }
              if (matchesAny(ex, filter, { id: sid, source: rec.source || src || null, initialized: true })) {
                resolve({ id: sid, module: ex, source: rec.source || src || null });
                return;
              }
            } else {
              if (num > maxSeen) maxSeen = num;
              var ex2 = null;
              try {
                ex2 = req(cur);
              } catch (e) {
                totalMisses++;
                i++;
                continue;
              }
              var rec2 = mirror[sid] || (mirror[sid] = {});
              rec2.id = sid;
              rec2.initialized = true;
              if (ex2 !== undefined) {
                rec2.exports = ex2;
              }
              if (ex2 !== undefined && matchesAny(ex2, filter, { id: sid, source: src, initialized: true })) {
                resolve({ id: sid, module: ex2, source: src });
                return;
              }
            }
            i++;
          }
          if (i >= ids.length) {
            resolve(null);
            return;
          }
          try { setTimeout(loop, 0); } catch (e) { resolve(null); }
        }
        try { setTimeout(loop, 0); } catch (e) { resolve(null); }
      });
    }

    
    
    
    
    function patchObject(parent, funcName, patch, once) {
      var P = null;
      try {
        P = SPINE.patcher;
      } catch (e) {}
      if (!P || !parent || typeof parent !== "object" || !patch || typeof patch !== "object") {
        return function () { return false; };
      }
      var unps = [];
      try {
        if (typeof patch.before === "function") unps.push(P.before(funcName, parent, patch.before, once));
        if (typeof patch.instead === "function") unps.push(P.instead(funcName, parent, patch.instead, once));
        if (typeof patch.after === "function") unps.push(P.after(funcName, parent, patch.after, once));
      } catch (e) {
        return function () { return false; };
      }
      return function () {
        var ok = true;
        for (var i = 0; i < unps.length; i++) {
          try {
            if (!unps[i]()) ok = false;
          } catch (e) {}
        }
        return ok;
      };
    }

    return {
      installSpy: installSpy,
      seedMirror: seedMirror,
      pushCb: pushCb,
      mirror: function () { return mirror; },
      resetSkip: function () {},
      find: find,
      findAll: findAll,
      scanDirect: scanDirect,
      byProps: byProps,
      byName: byName,
      bySourceSubstring: bySourceSubstring,
      findP: findP,
      findLazyP: findLazyP,
      patchObject: patchObject
    };
  })();
})();