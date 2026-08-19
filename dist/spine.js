/* ===== entry.js ===== */
﻿(function () {
  "use strict";

  var g = (typeof globalThis !== "undefined") ? globalThis : ((typeof global !== "undefined") ? global : window);

  if (g.SPINE && g.SPINE.booted) {
    return;
  }

  var SPINE = (g.SPINE = g.SPINE || {});
  SPINE.version = "0.16.0";
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


/* ===== metro.js ===== */
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

/* ===== patcher.js ===== */
(function () {
  "use strict";

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  SPINE.patcher = (function () {
    var delaySymbol = Symbol.for("spine.patcher.delay");
    var records = [];

    
    
    function setProp(parent, name, value) {
      try {
        Object.defineProperty(parent, name, { value: value, configurable: true, writable: true });
      } catch (e) {
        parent[name] = value;
      }
    }

    function runHooks(rec, ctor, args, ctxt) {
      var orig = rec.o;
      rec.b.forEach(function (hook) {
        var maybe = hook.call(ctxt, args);
        if (Array.isArray(maybe)) {
          args = maybe;
        }
      });
      
      
      var working = orig;
      var ins = [];
      rec.i.forEach(function (h) { ins.push(h); });
      for (var j = ins.length - 1; j >= 0; j--) {
        (function (cur, prev) {
          working = function () {
            return cur.call(ctxt, Array.prototype.slice.call(arguments), prev);
          };
        })(ins[j], working);
      }
      var ret;
      if (ctor) {
        var inst = Object.create(rec.F.prototype);
        ret = working.apply(inst, args);
        return (ret !== null && typeof ret === "object") ? ret : inst;
      }
      ret = working.apply(ctxt, args);
      rec.a.forEach(function (hook) {
        var nr = hook.call(ctxt, args, ret);
        if (nr !== undefined) {
          ret = nr;
        }
      });
      if (rec.c.length) {
        var cs = rec.c.slice();
        rec.c.length = 0;
        for (var k = 0; k < cs.length; k++) {
          try { cs[k](); } catch (e) {}
        }
      }
      return ret;
    }

    function makeWrapper(rec) {
      var orig = rec.o;
      var F = function () {
        var ctor = this instanceof F;
        return runHooks(rec, ctor, ctor ? orig : this, Array.prototype.slice.call(arguments));
      };
      F.prototype = orig.prototype || {};
      try {
        
        
        Object.defineProperty(F, "name", { value: orig.name || "", configurable: true });
        Object.defineProperty(F, "length", { value: orig.length || 0, configurable: true });
      } catch (e) {}
      try {
        var names = Object.getOwnPropertyNames(orig);
        for (var i = 0; i < names.length; i++) {
          var n = names[i];
          if (n === "length" || n === "name" || n === "prototype" || n === "arguments" || n === "caller") {
            continue;
          }
          var v = orig[n];
          F[n] = (typeof v === "function") ? v.bind(orig) : v;
        }
      } catch (e) {}
      return F;
    }

    function getRecord(funcName, funcParent) {
      var origFunc = funcParent[funcName];
      if (typeof origFunc !== "function") {
        throw new Error("SPINE.patcher: '" + String(funcName) + "' is not a function on the given parent");
      }
      for (var i = 0; i < records.length; i++) {
        if (records[i].p === funcParent && (records[i].F === origFunc || records[i].o === origFunc)) {
          return records[i];
        }
      }
      var rec = { n: funcName, o: origFunc, p: funcParent, c: [], b: new Map(), i: new Map(), a: new Map(), F: null };
      rec.F = makeWrapper(rec);
      records.push(rec);
      setProp(funcParent, funcName, rec.F);
      return rec;
    }

    function applyPatch(funcName, funcParent, patchType, callback, once) {
      var rec = getRecord(funcName, funcParent);
      var hookId = Symbol();
      var unpatch = function () {
        if (!rec[patchType].delete(hookId)) {
          return false;
        }
        if (rec.b.size === 0 && rec.i.size === 0 && rec.a.size === 0) {
          var idx = records.indexOf(rec);
          if (idx !== -1) {
            records.splice(idx, 1);
          }
          setProp(rec.p, rec.n, rec.o);
        }
        return true;
      };
      if (once) {
        rec.c.push(unpatch);
      }
      rec[patchType].set(hookId, callback);
      return unpatch;
    }

    function create(patchType) {
      function patchFn(funcName, funcParent, callback, once) {
        if (typeof funcName !== "string") {
          
          return patchFn(funcParent, funcName, callback, once);
        }
        if (funcParent && typeof funcParent[delaySymbol] === "function") {
          var delayCallback = funcParent[delaySymbol];
          var cancel = false;
          var unpatch = function () { cancel = true; };
          delayCallback(function (target) {
            if (cancel) {
              return;
            }
            try {
              unpatch = patchFn(funcName, target, callback, once);
            } catch (e) {
              unpatch = function () { return false; };
            }
          });
          return function () { return unpatch(); };
        }
        return applyPatch(funcName, funcParent, patchType, callback, once);
      }
      patchFn.await = function (funcName, thenable, callback, once) {
        var cancel = false;
        var unpatch = function () { cancel = true; };
        if (thenable && typeof thenable.then === "function") {
          thenable.then(function (target) {
            if (cancel) {
              return;
            }
            try {
              unpatch = patchFn(funcName, target, callback, once);
            } catch (e) {
              unpatch = function () { return false; };
            }
          }, function () {});
        }
        return function () { return unpatch(); };
      };
      return patchFn;
    }

    function delay(callback) {
      var obj = {};
      obj[delaySymbol] = callback;
      return obj;
    }

    function unpatchAll() {
      records.slice().forEach(function (rec) {
        rec.b.clear();
        rec.i.clear();
        rec.a.clear();
        var idx = records.indexOf(rec);
        if (idx !== -1) {
          records.splice(idx, 1);
        }
        setProp(rec.p, rec.n, rec.o);
      });
      records.length = 0;
    }

    return {
      before: create("b"),
      after: create("a"),
      instead: create("i"),
      delay: delay,
      unpatchAll: unpatchAll,
      active: function () { return records.length; },
      _records: records
    };
  })();
})();


/* ===== storage.js ===== */
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

/* ===== prefs.js ===== */
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

/* ===== ui.js ===== */
(function () {
  "use strict";

  SPINE.ui = (function () {
    var find = SPINE.metro.find;
    var byProps = SPINE.metro.byProps;
    var byName = SPINE.metro.byName;

    var reactMod = null;
    var rnMod = null;
    var rnPress = null;
    var layoutMod = null;
    var layoutId = null;
    var iconsMod = null;
    var lastRnDiagAt = 0;
    
    
    function interopMod(m) {
      if (!m) return null;
      return (m.__esModule === true && m.default !== undefined) ? m.default : m;
    }
    function loadReact() {
      if (reactMod) {
        return reactMod;
      }
      var f = find(function (exps) {
        return exps && typeof exps === "object" &&
          typeof exps.createElement === "function" &&
          typeof exps.version === "string";
      });
      if (f) {
        reactMod = interopMod(f.module);
      }
      if (!reactMod) {
        var f2 = find(byProps(["createElement"]));
        if (f2) {
          reactMod = interopMod(f2.module);
        }
      }
      return reactMod;
    }
    function probeFn(o, name) {
      try {
        var v = typeof o[name];
        return v === "function" ? "fn" : v;
      } catch (e) {
        return "THREW:" + ((e && e.message) || e);
      }
    }

    
    
    
    
    function resolvePressable(rn) {
      var names = ["Pressable", "TouchableOpacity", "TouchableHighlight", "TouchableWithoutFeedback", "View"];
      for (var i = 0; i < names.length; i++) {
        try {
          if (typeof rn[names[i]] === "function") {
            return names[i];
          }
        } catch (e) {}
      }
      return null;
    }

    function loadRN() {
      if (rnMod) {
        return rnMod;
      }
      
      
      
      
      
      
      
      var f = find(function (exps) {
        return exps && typeof exps === "object" &&
          typeof exps.View === "function" &&
          typeof exps.Text === "function";
      });
      if (f) {
        rnMod = interopMod(f.module);
        rnPress = resolvePressable(rnMod);
        return rnMod;
      }
      
      
      try {
        var mm = SPINE.metro.mirror();
        var s295 = "ausente";
        var r295 = mm["295"];
        if (r295 && r295.exports) {
          var e295 = r295.exports;
          s295 = "View=" + probeFn(e295, "View") +
            " Text=" + probeFn(e295, "Text") +
            " Pressable=" + probeFn(e295, "Pressable") +
            " TO=" + probeFn(e295, "TouchableOpacity");
        }
        var hitV = [], hitT = [], hitP = [], hitA = [];
        var cV = 0, cT = 0, cP = 0, cA = 0;
        for (var k in mm) {
          var rec = mm[k];
          if (!rec || rec.exports === undefined || typeof rec.exports !== "object") {
            continue;
          }
          var ex = rec.exports;
          var okV = probeFn(ex, "View") === "fn";
          var okT = probeFn(ex, "Text") === "fn";
          var okP = probeFn(ex, "Pressable") === "fn";
          if (okV && cV++ < 30) {
            hitV.push(k);
          }
          if (okT && cT++ < 30) {
            hitT.push(k);
          }
          if (okP && cP++ < 30) {
            hitP.push(k);
          }
          if (okV && okT && okP && cA++ < 30) {
            hitA.push(k);
          }
        }
        var nowD = Date.now();
        if (nowD - lastRnDiagAt > 20000) {
          lastRnDiagAt = nowD;
        }
      } catch (eD) {}
      return rnMod;
    }
    function loadLayout() {
      if (layoutMod) {
        return layoutMod;
      }
      var f = find(function (exps) {
        return exps && typeof exps === "object" &&
          exps.styles && typeof exps.styles.settingsSection === "object" &&
          exps.SettingsGroup !== undefined;
      });
      if (f) {
        layoutId = f.id;
        layoutMod = interopMod(f.module);
      }
      return layoutMod;
    }
    function loadIcons() {
      if (iconsMod) {
        return iconsMod;
      }
      var f = find(function (exps) {
        return exps && typeof exps === "object" && typeof exps.Ionicons === "function";
      });
      if (f) {
        iconsMod = interopMod(f.module);
      }
      return iconsMod;
    }

    var iconContainerMod = null;
    function loadIconContainer() {
      if (iconContainerMod) {
        return iconContainerMod;
      }
      var f = find(function (exps) {
        return exps && typeof exps === "object" && typeof exps.default === "function" &&
          (exps.default.name === "SettingsIconContainer" || exps.default.displayName === "SettingsIconContainer");
      });
      if (f) {
        iconContainerMod = interopMod(f.module);
      }
      return iconContainerMod;
    }

    
    
    var blurMod = null;
    function loadBlurView() {
      if (blurMod) {
        return blurMod;
      }
      var f = find(function (exps) {
        return exps && typeof exps === "object" && typeof exps.default === "function" &&
          (exps.default.name === "BlurView" || exps.default.displayName === "BlurView");
      });
      if (f) {
        blurMod = interopMod(f.module);
      }
      return blurMod;
    }

    function getTheme(props) {
      props = props || {};
      try {
        if (props.route && props.route.params && props.route.params.theme) return props.route.params.theme;
        if (props.route && props.route.route && props.route.route.params && props.route.route.params.theme) return props.route.route.params.theme;
        if (props.params && props.params.theme) return props.params.theme;
        if (props.theme) return props.theme;
      } catch (e) {}
      return {};
    }

    function h(type, props, children) {
      var R = loadReact();
      if (!R) {
        return null;
      }
      var args = [type, props || null];
      if (children !== undefined) {
        args.push(children);
      }
      return R.createElement.apply(R, args);
    }

    function isScrollView(tag) {
      if (!tag) {
        return false;
      }
      if (typeof tag === "string") {
        return /scrollview/i.test(tag);
      }
      if (typeof tag === "function") {
        return /scrollview/i.test(tag.name || tag.displayName || "");
      }
      if (typeof tag === "object") {
        var n = (tag.name || "") + " " + (tag.displayName || "") + " " + ((tag.render && tag.render.name) || "");
        return /scrollview/i.test(n);
      }
      return false;
    }

    function collectScrollViews(node, out) {
      if (!node || typeof node !== "object") {
        return;
      }
      if (node.props && isScrollView(node.type)) {
        out.push(node);
      }
      var children = node.props && node.props.children;
      if (Array.isArray(children)) {
        for (var i = 0; i < children.length; i++) {
          collectScrollViews(children[i], out);
        }
      } else if (children && typeof children === "object") {
        collectScrollViews(children, out);
      }
    }

    function appendToScrollView(scrollEl, newChild) {
      var R = loadReact();
      if (!R || !R.cloneElement) {
        return null;
      }
      var existing = scrollEl.props && scrollEl.props.children;
      var list = [];
      if (Array.isArray(existing)) {
        list = existing.slice();
      } else if (existing !== undefined && existing !== null) {
        list = [existing];
      }
      list.push(newChild);
      return R.cloneElement(scrollEl, { children: list });
    }

    
    
    
    
    
    
    function findSectionSpot(tree, styles) {
      var spot = null;
      function walk(node, parent, grand) {
        if (!node || typeof node !== "object") {
          return;
        }
        if (node.props && node.props.style === styles.settingsSection && parent) {
          spot = { parent: parent, grand: grand };
        }
        var cs = node.props && node.props.children;
        if (Array.isArray(cs)) {
          for (var i = 0; i < cs.length; i++) {
            if (cs[i] !== node) walk(cs[i], node, parent);
          }
        } else if (cs && typeof cs === "object") {
          walk(cs, node, parent);
        }
      }
      walk(tree, null, null);
      return spot;
    }

    
    
    function replaceNode(root, target, newEl) {
      if (!root || typeof root !== "object") {
        return root;
      }
      if (root === target) {
        return newEl;
      }
      var R = loadReact();
      var cs = root.props && root.props.children;
      if (Array.isArray(cs)) {
        var changed = false;
        var out = [];
        for (var i = 0; i < cs.length; i++) {
          if (cs[i] === target) {
            out.push(newEl);
            changed = true;
          } else {
            var r = replaceNode(cs[i], target, newEl);
            if (r !== cs[i]) {
              changed = true;
            }
            out.push(r);
          }
        }
        if (changed && R && R.cloneElement) {
          return R.cloneElement(root, { children: out });
        }
      } else if (cs && typeof cs === "object") {
        var r2 = replaceNode(cs, target, newEl);
        if (r2 !== cs && R && R.cloneElement) {
          return R.cloneElement(root, { children: r2 });
        }
      }
      return root;
    }

    var lastInject = { status: "nenhum", at: 0 };
    function fmtExtra(extra) {
      var s = "";
      if (extra) {
        try {
          for (var k in extra) {
            if (extra[k] !== undefined) {
              s += " " + k + "=" + extra[k];
            }
          }
        } catch (e) {}
      }
      return s;
    }
    function trackInject(status, extra) {
      try {
        var now = Date.now();
        lastInject = { status: status, at: now };
        if (extra) {
          for (var k in extra) {
            lastInject[k] = extra[k];
          }
        }
      } catch (e) {}
    }

    
    
    
    function buildSettingsSection(props, opts) {
      opts = opts || {};
      var R = loadReact();
      var RN = loadRN();
      var L = loadLayout();
      var Ion = loadIcons();
      var IconContainer = loadIconContainer();
      if (!R || !RN) {
        return null;
      }
      var theme = getTheme(props) || {};
      var styles = (L && L.styles) || {};
      var SettingsGroup = L && L.SettingsGroup;

      if (!styles.settingsSection || !styles.settingsRowGrouped) {
        return null;
      }

      var title = h(RN.Text, {
        style: [styles.settingsSectionTitle, { color: theme.secondaryText, marginLeft: 16, marginBottom: 8 }],
        children: opts.title || "paras8"
      });

      var icon = null;
      if (Ion && Ion.Ionicons) {
        icon = h(Ion.Ionicons, { name: "skull-outline", size: 20, color: theme.primaryText });
      }
      var iconWrap = null;
      if (IconContainer) {
        iconWrap = h(IconContainer, { theme: theme, children: icon });
      } else {
        iconWrap = icon;
      }

      var label = h(RN.Text, {
        style: [styles.settingsRowText, { color: theme.primaryText }],
        children: opts.label || "Parasyte module"
      });
      var sub = opts.subtitle ? h(RN.Text, {
        style: { color: theme.secondaryText, fontSize: 12, marginTop: 2 },
        children: opts.subtitle
      }) : null;
      var texts = [label];
      if (sub) texts.push(sub);
      var textCol = h(RN.View, { children: texts });

      var left = h(RN.View, {
        style: styles.settingsRowLeft,
        children: [iconWrap, textCol].filter(function (x) { return x !== null; })
      });

      var chevron = null;
      if (Ion && Ion.Ionicons) {
        chevron = h(Ion.Ionicons, { name: "chevron-forward", size: 20, color: theme.secondaryText });
      }
      var pressType = (RN[rnPress] && typeof RN[rnPress] === "function") ? RN[rnPress] : RN.View;
      var row = h(pressType, {
        key: opts.key || "spine-row",
        style: [
          styles.settingsRowGrouped,
          styles.settingsRowFirst,
          styles.settingsRowLast,
          { borderBottomWidth: 0, backgroundColor: theme.card }
        ],
        onPress: opts.onPress || undefined
      }, [left, chevron].filter(function (x) { return x !== null; }));

      
      
      
      var group = null;
      if (SettingsGroup) {
        group = h(SettingsGroup, { theme: theme, children: row });
      } else {
        group = row;
      }
      return h(RN.View, { style: styles.settingsSection, children: [title, group] });
    }

    function injectIntoSettings(origEl, props, opts) {
      opts = opts || {};
      var R = loadReact();
      if (!R || !origEl || typeof origEl !== "object") {
        trackInject("fail:no-react");
        return origEl;
      }
      try {
        var section = buildSettingsSection(props, opts);
        if (!section) {
          var L0 = loadLayout();
          var st0 = (L0 && L0.styles) || null;
          trackInject("fail:no-section", {
            react: loadReact() ? 1 : 0,
            rn: loadRN() ? 1 : 0,
            press: rnPress || "-",
            layout: L0 ? 1 : 0,
            layoutId: layoutId || "-",
            ss: (st0 && st0.settingsSection) ? 1 : 0,
            srg: (st0 && st0.settingsRowGrouped) ? 1 : 0,
            mirror: Object.keys(SPINE.metro.mirror()).length
          });
          return origEl;
        }
        var scrollers = [];
        collectScrollViews(origEl, scrollers);
        if (scrollers.length > 0) {
          var newScroll = appendToScrollView(scrollers[0], section);
          if (newScroll) {
            var out1 = replaceNode(origEl, scrollers[0], newScroll);
            trackInject("ok:name", { scrollers: scrollers.length, replaced: out1 !== origEl });
            return out1;
          }
        }
        var L = loadLayout();
        var styles = (L && L.styles) || null;
        var spot = styles ? findSectionSpot(origEl, styles) : null;
        if (spot) {
          var newParent = appendToScrollView(spot.parent, section);
          var out2 = replaceNode(origEl, spot.parent, newParent);
          trackInject("ok:identity", { stylesFound: !!styles, replaced: out2 !== origEl });
          return out2;
        }
        trackInject("fail:no-inject-point", { scrollers: scrollers.length, styles: !!styles });
        return origEl;
      } catch (e) {
        SPINE.error("ui.inject", e);
        trackInject("fail:err " + ((e && e.message) || e));
        return origEl;
      }
    }

    function Alert(title, message, buttons) {
      try {
        var f = find(byProps(["alert"]), { skipFailed: true });
        if (!f) {
          f = find(byProps(["Alert"]), { skipFailed: true });
        }
        var A = null;
        if (f) {
          var ex = f.module;
          A = (ex.alert && typeof ex.alert === "function" && ex) ||
              (ex.default && ex.default.alert && typeof ex.default.alert === "function" && ex.default) ||
              (ex.Alert && typeof ex.Alert.alert === "function" && ex.Alert) ||
              (ex.default && ex.default.default && ex.default.default.Alert && typeof ex.default.default.Alert.alert === "function" && ex.default.default.Alert) ||
              (ex.default && ex.default.Alert && typeof ex.default.Alert.alert === "function" && ex.default.Alert);
        }
        if (A && typeof A.alert === "function") {
          A.alert(title, message, buttons);
          return true;
        }
      } catch (e) {}
      
      
      
      try {
        var RN = loadRN();
        if (RN && RN.Alert && typeof RN.Alert.alert === "function") {
          RN.Alert.alert(title, message, buttons);
          return true;
        }
      } catch (e2) {}
      return false;
    }

    return {
      react: loadReact,
      rn: loadRN,
      layout: loadLayout,
      icons: loadIcons,
      iconContainer: loadIconContainer,
      blurView: loadBlurView,
      getTheme: getTheme,
      h: h,
      collectScrollViews: collectScrollViews,
      appendToScrollView: appendToScrollView,
      findSectionSpot: findSectionSpot,
      replaceNode: replaceNode,
      buildSettingsSection: buildSettingsSection,
      injectIntoSettings: injectIntoSettings,
      lastInject: function () { return lastInject; },
      Alert: Alert
    };
  })();
})();

/* ===== exporter.js ===== */
(function () {
  "use strict";

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  var g = (typeof globalThis !== "undefined") ? globalThis : ((typeof global !== "undefined") ? global : window);
  var S = g.SPINE || (g.SPINE = {});

  function metro() {
    return S.metro || null;
  }

  
  
  
  
  
  function findModuleAsync(makeFilter, unwrap) {
    var m = metro();
    if (!m) return Promise.resolve(null);
    var filter = makeFilter(m);
    var f = null;
    try {
      f = m.find(filter);
    } catch (e) {}
    if (f) {
      return Promise.resolve(unwrap(f.module));
    }
    if (typeof m.findLazyP === "function") {
      return m.findLazyP(filter).then(function (lf) {
        if (!lf) return null;
        try { return unwrap(lf.module); } catch (e) { return null; }
      });
    }
    return Promise.resolve(null);
  }

  
  
  
  
  
  function findModuleAsyncMulti(makers, unwrap) {
    var m = metro();
    if (!m) return Promise.resolve(null);
    var hits = [];
    var i = 0;
    function val(lf) {
      if (!lf) return null;
      var u = null;
      try { u = unwrap(lf.module); } catch (e) {}
      if (u) return u;
      if (lf.id) hits.push(lf.id);
      return null;
    }
    function next() {
      if (i >= makers.length) {
        if (hits.length) {
          try {
            var sp = g.SPINE;
          } catch (e) {}
        }
        return Promise.resolve(null);
      }
      var filter = makers[i](m);
      i++;
      var f = null;
      try { f = m.find(filter); } catch (e) {}
      if (f) {
        var u = val(f);
        if (u) return Promise.resolve(u);
      }
      if (typeof m.findLazyP === "function") {
        
        
        
        return m.findLazyP(filter, { skipFind: true }).then(function (lf) {
          if (!lf) return next();
          var u = val(lf);
          if (u) return Promise.resolve(u);
          return next();
        });
      }
      return next();
    }
    return next();
  }

  
  
  
  
  
  
  function makeShareFilter(m) {
    var srcF = null;
    try { srcF = m.bySourceSubstring("ExpoSharing"); } catch (e) {}
    return function (exps, meta) {
      function good(x) {
        if (!x || typeof x !== "object") return false;
        return typeof x.shareAsync === "function" &&
          typeof x.isAvailableAsync === "function" &&
          (typeof x.getSharedPayloads === "function" ||
            typeof x.getResolvedSharedPayloadsAsync === "function" ||
            typeof x.clearSharedPayloads === "function");
      }
      if (good(exps)) return true;
      var d = null;
      try { d = (exps && exps.__esModule && exps.default !== undefined) ? exps.default : null; } catch (e) {}
      if (good(d)) return true;
      if (srcF) {
        try { if (srcF(exps, meta)) return true; } catch (e2) {}
      }
      return false;
    };
  }

  function resolveSharing() {
    
    
    return memoResolve("sharing", function () {
      return findModuleAsyncMulti([
        makeShareFilter,
        function (m) { return m.bySourceSubstring("ExpoSharing"); }
      ], unwrapShare);
    });
  }

  function unwrapShare(ex) {
    if (ex && typeof ex.shareAsync === "function") return ex;
    if (ex && ex.default && typeof ex.default.shareAsync === "function") return ex.default;
    var d = (ex && ex.__esModule && ex.default !== undefined) ? ex.default : ex;
    if (d && typeof d.shareAsync === "function") return d;
    return null;
  }

  function unwrapFflate(ex) {
    if (ex && typeof ex.zipSync === "function") return ex;
    if (ex && ex.default && typeof ex.default.zipSync === "function") return ex.default;
    var d = (ex && ex.__esModule && ex.default !== undefined) ? ex.default : ex;
    if (d && typeof d.zipSync === "function") return d;
    return null;
  }

  function unwrapBuffer(ex) {
    var b = (ex && ex.Buffer) || (ex && ex.default && ex.default.Buffer);
    if (b && typeof b.from === "function" && typeof b.isBuffer === "function") return b;
    return null;
  }

  
  
  
  var MEMO = {};
  function memoResolve(key, fn) {
    if (Object.prototype.hasOwnProperty.call(MEMO, key)) {
      return MEMO[key];
    }
    MEMO[key] = fn().then(function (r) {
      return r;
    });
    return MEMO[key];
  }

  function resolveFflate() {
    return memoResolve("fflate", function () {
      return findModuleAsync(function (m) { return m.byProps(["zipSync", "unzipSync", "strToU8", "strFromU8"]); }, unwrapFflate);
    });
  }

  function resolveBuffer() {
    return memoResolve("buffer", function () {
      return findModuleAsync(function (m) {
        return function (exps) {
          var b = (exps && exps.Buffer) || (exps && exps.default && exps.default.Buffer);
          return !!b && typeof b.from === "function" && typeof b.isBuffer === "function";
        };
      }, unwrapBuffer);
    });
  }

  function b64ToU8(b64, buffer) {
    
    
    
    try {
      if (typeof g.atob === "function") {
        var bin = g.atob(String(b64));
        var out = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
      }
    } catch (e2) {}
    if (buffer && typeof buffer.from === "function") {
      try {
        return buffer.from(String(b64), "base64");
      } catch (e) {}
    }
    
    
    var map = b64ToU8._map;
    if (!map) {
      map = b64ToU8._map = {};
      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      for (var c = 0; c < chars.length; c++) map[chars.charCodeAt(c)] = c;
    }
    var s = String(b64);
    var len = s.length;
    var pad = 0;
    if (len > 0 && s.charCodeAt(len - 1) === 61) pad++;
    if (len > 1 && s.charCodeAt(len - 2) === 61) pad++;
    var outSize = ((len * 6) >> 3) - pad;
    var bytes = new Uint8Array(outSize);
    var buf = 0, bits = 0, o = 0;
    for (var j = 0; j < len; j++) {
      var v = map[s.charCodeAt(j)];
      if (v === undefined) continue;
      buf = (buf << 6) | v;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        bytes[o++] = (buf >> bits) & 0xFF;
      }
    }
    return bytes;
  }

  function u8ToB64(u8, buffer) {
    
    
    try {
      if (typeof g.btoa === "function") {
        var s = "";
        var chunk = 32768;
        for (var ci = 0; ci < u8.length; ci += chunk) {
          var part = String.fromCharCode.apply(null, u8.subarray(ci, Math.min(ci + chunk, u8.length)));
          s += part;
        }
        return g.btoa(s);
      }
    } catch (e2) {}
    if (buffer && typeof buffer.from === "function") {
      try {
        var b = buffer.from(u8);
        if (b && typeof b.toString === "function") return b.toString("base64");
      } catch (e) {}
    }
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var out = "";
    var i2 = 0;
    while (i2 < u8.length) {
      var a = u8[i2++];
      var b2 = i2 < u8.length ? u8[i2++] : -1;
      var c = i2 < u8.length ? u8[i2++] : -1;
      out += chars.charAt(a >> 2);
      out += chars.charAt(((a & 3) << 4) | (b2 < 0 ? 0 : b2 >> 4));
      out += b2 < 0 ? "=" : chars.charAt(((b2 & 15) << 2) | (c < 0 ? 0 : c >> 6));
      out += c < 0 ? "=" : chars.charAt(c & 63);
    }
    return out;
  }

  function strToU8(s) {
    var str = String(s);
    var bytes = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i) & 255;
    return bytes;
  }

  function u16(n) { return [n & 255, (n >>> 8) & 255]; }
  function u32(n) {
    return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  }
  function u32be(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  }

  
  
  var CRC_TABLES = null;
  function crc32(bytes) {
    if (!CRC_TABLES) {
      var t0 = [];
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        t0[n] = c >>> 0;
      }
      CRC_TABLES = [t0];
      for (var ti = 1; ti < 8; ti++) {
        var tn = [];
        var prev = CRC_TABLES[ti - 1];
        for (var m = 0; m < 256; m++) tn[m] = (prev[m] >>> 8) ^ t0[prev[m] & 255];
        CRC_TABLES.push(tn);
      }
    }
    var T = CRC_TABLES;
    var crc = 0xFFFFFFFF, i = 0, len = bytes.length;
    while (i + 8 <= len) {
      crc = T[7][(crc ^ bytes[i]) & 255] ^ T[6][(crc >>> 8 ^ bytes[i + 1]) & 255] ^
            T[5][(crc >>> 16 ^ bytes[i + 2]) & 255] ^ T[4][(crc >>> 24 ^ bytes[i + 3]) & 255] ^
            T[3][bytes[i + 4]] ^ T[2][bytes[i + 5]] ^ T[1][bytes[i + 6]] ^ T[0][bytes[i + 7]];
      i += 8;
    }
    while (i < len) crc = (crc >>> 8) ^ T[0][(crc ^ bytes[i++]) & 255];
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  
  
  
  
  function utf16leBytes(s) {
    var out = [0xFF, 0xFE];
    var str = String(s == null ? "" : s);
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      out.push(c & 255, (c >>> 8) & 255);
    }
    return out;
  }

  function utf8Bytes(s) {
    var out = [];
    var str = String(s == null ? "" : s);
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 128) out.push(c);
      else if (c < 2048) out.push(192 | (c >> 6), 128 | (c & 63));
      else out.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
    }
    return out;
  }

  function id3Frame(id, bytes) {
    var hdr = [];
    for (var i = 0; i < 4; i++) hdr.push(id.charCodeAt(i));
    
    hdr = hdr.concat(u32be(bytes.length));
    hdr.push(0, 0);
    return hdr.concat(bytes);
  }

  function id3v2Tag(meta, cover) {
    var enc = [0x01];
    var frames = [];
    function text(id, val) {
      if (val === undefined || val === null || String(val) === "") return;
      frames.push(id3Frame(id, enc.concat(utf16leBytes(val))));
    }
    text("TIT2", meta.title);
    text("TPE1", meta.artist);
    text("TALB", meta.album);
    text("TRCK", meta.index);
    if (meta.durationMs) text("TLEN", String(meta.durationMs));
    
    if (cover && cover.length) {
      var mime = utf8Bytes("image/jpeg");
      var body = [0x03].concat(mime, [0x00], [0x03], [0x00]).concat(Array.prototype.slice.call(cover));
      frames.push(id3Frame("APIC", body));
    }
    var bodyLen = 0;
    for (var i = 0; i < frames.length; i++) bodyLen += frames[i].length;
    
    var sizeBytes = [
      (bodyLen >>> 21) & 0x7F, (bodyLen >>> 14) & 0x7F,
      (bodyLen >>> 7) & 0x7F, bodyLen & 0x7F
    ];
    
    var out = [0x49, 0x44, 0x33, 0x03, 0x00, 0x00].concat(sizeBytes);
    for (var j = 0; j < frames.length; j++) out = out.concat(frames[j]);
    return new Uint8Array(out);
  }

  function prependU8(tag, audio) {
    var out = new Uint8Array(tag.length + audio.length);
    out.set(tag, 0);
    out.set(audio, tag.length);
    return out;
  }

  function vorbisCommentBlock(meta) {
    var comments = [];
    function kv(k, v) {
      if (v === undefined || v === null || String(v) === "") return;
      comments.push(String(k) + "=" + String(v));
    }
    kv("TITLE", meta.title);
    kv("ARTIST", meta.artist);
    kv("ALBUM", meta.album);
    if (meta.index) kv("TRACKNUMBER", String(meta.index).replace(/^0+/, ""));
    var vendor = utf8Bytes("paras8 Export");
    var body = u32(vendor.length).concat(vendor);
    body = body.concat(u32(comments.length));
    for (var i = 0; i < comments.length; i++) {
      var cb = utf8Bytes(comments[i]);
      body = body.concat(u32(cb.length)).concat(cb);
    }
    
    return [0x04, (body.length >>> 16) & 255, (body.length >>> 8) & 255, body.length & 255].concat(body);
  }

  
  function flacPictureBlock(cover) {
    var mime = utf8Bytes("image/jpeg");
    var body = u32be(3);                       
    body = body.concat(u32be(mime.length), mime);
    body = body.concat(u32be(0));              
    body = body.concat(u32be(0), u32be(0), u32be(0), u32be(0)); 
    body = body.concat(u32be(cover.length));
    body = body.concat(Array.prototype.slice.call(cover));
    return [0x06, (body.length >>> 16) & 255, (body.length >>> 8) & 255, body.length & 255].concat(body);
  }

  function flacEmbed(bytes, meta, cover) {
    
    if (bytes.length < 12) return bytes;
    if (!(bytes[0] === 0x66 && bytes[1] === 0x6C && bytes[2] === 0x61 && bytes[3] === 0x43)) return bytes;
    var firstType = bytes[4] & 0x7F;
    if (firstType !== 0) return bytes; 
    var sLen = (bytes[5] << 16) | (bytes[6] << 8) | bytes[7];
    var afterStream = 8 + sLen;
    var extra = vorbisCommentBlock(meta);
    if (cover && cover.length) extra = extra.concat(flacPictureBlock(cover));
    var out = new Uint8Array(afterStream + extra.length + (bytes.length - afterStream));
    out.set(bytes.subarray(0, afterStream), 0);
    out.set(extra, afterStream);
    out.set(bytes.subarray(afterStream), afterStream + extra.length);
    return out;
  }

  
  
  
  
  
  function zipStore(entries) {
    var paths = Object.keys(entries || {});
    var chunks = [];
    var sizes = {};
    var offsets = {};
    var total = 0;
    var i, p, data, nameBytes, nameLen, crc, n, dlen;

    for (i = 0; i < paths.length; i++) {
      p = paths[i];
      data = entries[p] || new Uint8Array(0);
      nameBytes = strToU8(p);
      nameLen = nameBytes.length;
      crc = crc32(data);
      dlen = data.length;
      offsets[p] = total;
      sizes[p] = { crc: crc, dlen: dlen };
      total += 30 + nameLen + dlen;
    }

    for (i = 0; i < paths.length; i++) {
      p = paths[i];
      data = entries[p] || new Uint8Array(0);
      nameBytes = strToU8(p);
      nameLen = nameBytes.length;
      crc = sizes[p].crc;
      dlen = sizes[p].dlen;
      var lh = new Uint8Array(30);
      lh.set([0x50, 0x4B, 0x03, 0x04]);                  
      lh.set(u16(20), 4);                                 
      lh.set(u16(0), 6);                                  
      lh.set(u16(0), 8);                                  
      lh.set(u16(0), 10);                                 
      lh.set(u16(0x21), 12);                              
      lh.set(u32(crc), 14);                               
      lh.set(u32(dlen), 18);                              
      lh.set(u32(dlen), 22);                              
      lh.set(u16(nameLen), 26);                           
      lh.set(u16(0), 28);                                 
      chunks.push(lh, nameBytes, data);
    }

    var cdStart = total;
    var cdBytes = [];
    var cdTotal = 0;
    for (i = 0; i < paths.length; i++) {
      p = paths[i];
      nameBytes = strToU8(p);
      nameLen = nameBytes.length;
      crc = sizes[p].crc;
      dlen = sizes[p].dlen;
      var ch = new Uint8Array(46);
      ch.set([0x50, 0x4B, 0x01, 0x02]);                  
      ch.set(u16(20), 4);                                 
      ch.set(u16(20), 6);                                 
      ch.set(u16(0), 8);                                  
      ch.set(u16(0), 10);                                 
      ch.set(u16(0), 12);                                 
      ch.set(u16(0x21), 14);                              
      ch.set(u32(crc), 16);                               
      ch.set(u32(dlen), 20);                              
      ch.set(u32(dlen), 24);                              
      ch.set(u16(nameLen), 28);                           
      ch.set(u16(0), 30);                                 
      ch.set(u16(0), 32);                                 
      ch.set(u16(0), 34);                                 
      ch.set(u16(0), 36);                                 
      ch.set(u32(0), 38);                                 
      ch.set(u32(offsets[p]), 42);                        
      cdBytes.push(ch, nameBytes);
      cdTotal += 46 + nameLen;
    }
    var cd = new Uint8Array(cdTotal);
    var pos = 0;
    for (i = 0; i < cdBytes.length; i++) {
      cd.set(cdBytes[i], pos);
      pos += cdBytes[i].length;
    }

    var eocd = new Uint8Array(22);
    eocd.set([0x50, 0x4B, 0x05, 0x06]);                  
    eocd.set(u16(0), 4);                                 
    eocd.set(u16(0), 6);                                 
    eocd.set(u16(paths.length), 8);                      
    eocd.set(u16(paths.length), 10);                     
    eocd.set(u32(cdTotal), 12);                          
    eocd.set(u32(cdStart), 16);                          
    eocd.set(u16(0), 20);                                
    chunks.push(cd, eocd);

    var outLen = total + cdTotal + eocd.length;
    var out = new Uint8Array(outLen);
    pos = 0;
    for (i = 0; i < chunks.length; i++) {
      out.set(chunks[i], pos);
      pos += chunks[i].length;
    }
    return out;
  }

  
  function parseFilename(fname) {
    var base = String(fname || "");
    var ext = "";
    var i = base.lastIndexOf(".");
    if (i > 0) {
      ext = base.slice(i + 1);
      base = base.slice(0, i);
    }
    var j = base.lastIndexOf("_");
    var titlePart = j > 0 ? base.slice(0, j) : base;
    var dash = titlePart.indexOf(" - ");
    var artist = "", title = titlePart;
    if (dash > 0) {
      artist = titlePart.slice(0, dash);
      title = titlePart.slice(dash + 3);
    }
    return { artist: artist.trim(), title: title.trim(), ext: ext.toLowerCase() };
  }

  
  function parseKeyMeta(key) {
    var s = String(key || "");
    if (s.indexOf("|") === -1) return {};
    var parts = s.split("|");
    return { title: parts[0] || "", artist: parts[1] || "", album: parts[2] || "", duration: parts[3] || "" };
  }

  function resolveArtistName(track) {
    if (!track) return "";
    var a = track.artist;
    if (a == null) return "";
    if (typeof a === "string") return a;
    if (Array.isArray(a)) {
      var names = [];
      for (var i = 0; i < a.length; i++) {
        var n = (typeof a[i] === "string") ? a[i] : (a[i] && a[i].name);
        if (n) names.push(n);
      }
      return names.join(", ");
    }
    return a.name || a.artistName || a.artist || "";
  }

  function resolveAlbumTitle(track) {
    if (!track) return "";
    var al = track.album;
    if (al == null) return "";
    if (typeof al === "string") return al;
    return al.title || al.name || al.album || al.albumTitle || al.collectionName || "";
  }

  function resolveTrackTitle(track) {
    if (!track) return "";
    return track.title || track.name || track.trackName || "";
  }

  function resolveTrackDuration(track) {
    if (!track) return "";
    var d = track.duration_ms;
    if (d == null) d = track.duration;
    return d == null ? "" : String(d);
  }

  
  function getUniqueTrackKey(item) {
    if (!item) return "";
    if (typeof item === "string") return item;
    var artist = resolveArtistName(item);
    var album = resolveAlbumTitle(item);
    var items = [item.name || ""];
    items.push(artist);
    if (album) items.push(album);
    if (item.duration_ms || item.duration || "") items.push(resolveTrackDuration(item));
    return items.join("|").toLowerCase().trim();
  }

  
  function indexTracks(trackList) {
    var byUnique = {};
    var byId = {};
    var byName = {};
    var byFilename = {};
    var byDebridKey = {};
    if (!Array.isArray(trackList)) trackList = [];
    for (var i = 0; i < trackList.length; i++) {
      var t = trackList[i];
      if (!t || typeof t !== "object") continue;
      var meta = {
        id: t.id,
        name: t.name,
        title: resolveTrackTitle(t),
        artist: resolveArtistName(t),
        album: resolveAlbumTitle(t),
        duration: resolveTrackDuration(t),
        downloadedUri: t.downloadedUri,
        uri: t.uri || t.url
      };
      var uk = getUniqueTrackKey(t);
      if (uk && !(uk in byUnique)) byUnique[uk] = meta;
      if (t.id && !(t.id in byId)) byId[t.id] = meta;
      if (t.name && !(t.name in byName)) byName[t.name] = meta;
      var fns = [t.downloadedUri, t.uri, t.url];
      for (var f = 0; f < fns.length; f++) {
        var fn = String(fns[f] || "");
        var base = fn.split("/").pop();
        if (base && base.indexOf(".") !== -1 && !(base in byFilename)) byFilename[base] = meta;
      }
      var idMatch = String(t.id || "").match(/^(torbox|realdebrid):([^:]+):([^:]+):/);
      if (idMatch) {
        var dk = idMatch[2] + "_" + idMatch[3];
        if (!(dk in byDebridKey)) byDebridKey[dk] = meta;
      }
    }
    return { byUnique: byUnique, byId: byId, byName: byName, byFilename: byFilename, byDebridKey: byDebridKey };
  }

  function lookupTrackMeta(index, key, filename) {
    if (!index) return null;
    var s = String(key || "");
    var m = null;
    if (s) {
      m = index.byUnique[s.toLowerCase().trim()] || index.byId[s] || index.byName[s] || index.byDebridKey[s] || null;
    }
    if (!m && filename) {
      m = index.byFilename[String(filename).split("/").pop()] || null;
    }
    return m;
  }

  function sanitize(seg) {
    return String(seg || "Unknown")
      .replace(/[\/\\:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .trim() || "Unknown";
  }

  function readJson(fs, uri) {
    if (!fs) return Promise.resolve(null);
    
    
    
    
    
    
    
    return fs.getInfoAsync(uri, {}).then(function (info) {
      try {
      } catch (e) {}
      if (!info || !info.exists) return null;
      return fs.readAsStringAsync(uri, {}).then(function (txt) {
        try {
          return JSON.parse(txt);
        } catch (e) {
          return null;
        }
      });
    }).then(function (v) {
      if (v) return v;
      return fs.getInfoAsync(uri + ".tmp", {}).then(function (info2) {
        if (!info2 || !info2.exists) return null;
        return fs.readAsStringAsync(uri + ".tmp", {}).then(function (txt) {
          try { return JSON.parse(txt); } catch (e) { return null; }
        });
      }).catch(function () { return null; });
    }).catch(function (err) {
      try {
      } catch (e2) {}
      return null;
    });
  }

  
  var MUSIC_EXTS = ["mp3", "mp2", "flac", "m4a", "m4b", "m4p", "aac", "ogg", "oga", "opus", "wav", "aiff", "aif", "wma", "alac", "ape", "flv"];

  function isMusicName(name) {
    var i = String(name || "").lastIndexOf(".");
    if (i <= 0) return false;
    return MUSIC_EXTS.indexOf(String(name).slice(i + 1).toLowerCase()) !== -1;
  }

  function listDownloads(spine) {
    var fs = spine && spine.storage ? spine.storage.fs() : null;
    if (!fs) {
      try {
      } catch (e) {}
      return Promise.resolve([]);
    }
    var doc = (fs.documentDirectory || "");
    var lib = doc + "library/";
    try {
    } catch (e) {}
    function fromRecords() {
      return Promise.all([
        readJson(fs, lib + "downloads.json"),
        readJson(fs, lib + "debrid_downloads.json"),
        readJson(fs, lib + "tracks.json")
      ]).then(function (rs) {
        var dl = rs[0], dd = rs[1], tracks = rs[2];
        var idx = indexTracks(Array.isArray(tracks) ? tracks : []);
        var out = [];
        var seen = {};
        function push(key, filename, source) {
          if (!filename || seen[filename]) return;
          if (!isMusicName(filename)) return;
          seen[filename] = true;
          var m = lookupTrackMeta(idx, key, filename);
          out.push({
            key: key,
            filename: filename,
            uri: lib + filename,
            source: source,
            meta: m || null
          });
        }
        if (dl && dl.downloadedTracks && dl.recentDownloads) {
          var keys = Array.isArray(dl.downloadedTracks) ? dl.downloadedTracks.slice() : [];
          keys.forEach(function (k) { push(k, dl.recentDownloads[k], "downloads"); });
        }
        if (dd) {
          var d = (dd && dd.downloads) ? dd.downloads : dd;
          if (d && typeof d === "object") {
            Object.keys(d).forEach(function (k) {
              var v = d[k];
              var fn = (typeof v === "string") ? v : (v && v.localPath);
              if (typeof fn === "string" && fn.indexOf("/") !== -1) fn = fn.split("/").pop();
              push(k, fn, "debrid");
            });
          }
        }
        return out;
      });
    }
    
    
    
    
    
    
    function fromDir() {
      if (typeof fs.readDirectoryAsync !== "function") return Promise.resolve([]);
      return fs.readDirectoryAsync(lib).then(function (entries) {
        var out = [];
        var seen = {};
        (entries || []).forEach(function (en) {
          if (typeof en !== "string") return;
          if (!isMusicName(en)) return;
          if (en === "downloads.json.tmp" || en === "downloads.json.bak") return;
          if (en === "debrid_downloads.json.tmp" || en === "debrid_downloads.json.bak") return;
          if (seen[en]) return;
          seen[en] = true;
          out.push({ key: "", filename: en, uri: lib + en, source: "dir" });
        });
        try {
        } catch (e) {}
        return out;
      }).catch(function () { return []; });
    }
    return fromRecords().then(function (recs) {
      if (recs.length) return recs;
      return fromDir();
    }).then(function (out) {
      return out.map(function (t) {
        var p = parseFilename(t.filename);
        var trackMeta = t.meta || null;
        var keyMeta = parseKeyMeta(t.key);
        return {
          key: t.key,
          filename: t.filename,
          uri: t.uri,
          source: t.source,
          artist: (trackMeta && trackMeta.artist) || p.artist || keyMeta.artist || "Unknown",
          title: (trackMeta && trackMeta.title) || p.title || keyMeta.title || t.filename,
          album: (trackMeta && trackMeta.album) || keyMeta.album || "Unknown Album",
          ext: p.ext || "mp3",
          duration: (trackMeta && trackMeta.duration) || keyMeta.duration || ""
        };
      });
    });
  }

  
  
  
  
  
  
  
  
  
  
  
  
  function coverSanitize(s) {
    return String(s).replace(/[^a-z0-9]/gi, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
  }
  function coverHash(str) {
    var s = String(str);
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h * 33) + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  function coverName(artist, album) {
    var raw = artist + "_" + album;
    var formatted = coverSanitize(raw);
    return ((formatted.slice(0, 120) || "artwork") + "_" + coverHash(raw) + ".jpg");
  }
  
  function coverCandidates(track) {
    var artist = String(track.artist || "");
    var album = String(track.album || "");
    var keys = [];
    function push(a) { keys.push(a); }
    if (album === "Unknown Album") {
      var tn = String(track.title || track.name || "");
      if (tn) push(tn);          
    }
    push(album);                 
    var out = [];
    for (var i = 0; i < keys.length; i++) {
      if (out.indexOf(keys[i]) === -1) out.push(keys[i]);
    }
    return out.map(function (albumKey) {
      return { artist: artist, album: albumKey, name: coverName(artist, albumKey) };
    });
  }
  function resolveCover(fs, track) {
    if (!fs || !track || !track.artist) return Promise.resolve(null);
    var cd = fs.cacheDirectory || "";
    if (typeof fs.readAsStringAsync !== "function") return Promise.resolve(null);
    var dir = cd + "artwork_cache/";
    function read(ur) {
      return fs.readAsStringAsync(ur, { encoding: "base64" }).then(function (b64) {
        if (!b64) return null;
        var bytes = b64ToU8(b64, null);
        if (!bytes || !bytes.length) return null;
        return bytes;
      }).catch(function () { return null; });
    }
    var cands = coverCandidates(track);
    var idx = 0;
    
    
    function tryNext() {
      if (idx >= cands.length) return listByArtist();
      var uri = dir + cands[idx].name;
      idx++;
      if (typeof fs.getInfoAsync === "function") {
        return fs.getInfoAsync(uri, {}).then(function (info) {
          return info && info.exists ? read(uri) : tryNext();
        }).catch(function () { return tryNext(); });
      }
      return read(uri).then(function (b) {
        return b ? b : tryNext();
      });
    }
    function listByArtist() {
      if (typeof fs.readDirectoryAsync !== "function") return Promise.resolve(null);
      var artistPrefix = coverSanitize(track.artist).slice(0, 120);
      return fs.readDirectoryAsync(dir).then(function (entries) {
        if (!entries || !entries.length) return null;
        var i2;
        for (i2 = 0; i2 < entries.length; i2++) {
          var en = entries[i2];
          if (typeof en === "string" && en.slice(-4) === ".jpg" && en.indexOf(artistPrefix) === 0) {
            return read(dir + en);
          }
        }
        return null;
      }).catch(function () { return null; });
    }
    return tryNext();
  }

  
  
  
  
  
  
  function buildZip(spine, tracks, onProgress, metaFormat) {
    metaFormat = metaFormat || "json";
    var fs = spine && spine.storage ? spine.storage.fs() : null;
    if (!fs) return Promise.reject(new Error("FileSystem not found"));
    return Promise.all([resolveBuffer(), resolveFflate()]).then(function (rs) {
      var buffer = rs[0];
      var ff = rs[1];
      var canStream = !!(ff && typeof ff.Zip === "function" && typeof ff.ZipPassThrough === "function");
      var manifest = {
        app: "paras8 Export",
        exportedAt: new Date().toISOString(),
        appVersion: S.version || "?",
        count: tracks.length,
        tracks: []
      };
      var m3uLines = ["#EXTM3U"];
      var coverMap = {};
      var coverKeys = [];
      tracks.forEach(function (t) {
        var k = (t.artist || "") + "\u0000" + (t.album || "");
        if (!(k in coverMap)) {
          coverMap[k] = null;
          coverKeys.push({ k: k, t: t });
        }
      });
      function resolveAllCovers() {
        return Promise.all(coverKeys.map(function (ck) {
          return resolveCover(fs, ck.t).then(function (bytes) {
            coverMap[ck.k] = bytes;
            try {
            } catch (e) {}
            return null;
          });
        })).catch(function () {});
      }
      function coverFor(t) {
        return coverMap[(t.artist || "") + "\u0000" + (t.album || "")] || null;
      }
      function buildTrack(t, idx) {
        return fs.readAsStringAsync(t.uri, { encoding: "base64" }).then(function (b64) {
            var bytes = b64ToU8(b64, buffer);
            var nn = ("0" + (idx + 1)).slice(-2);
            var folder = sanitize(t.artist) + "/" + sanitize(t.album) + "/";
            var path = folder + nn + " - " + sanitize(t.title) + "." + t.ext;
            var manifestEntry = {
              index: idx + 1,
              title: t.title,
              artist: t.artist,
              album: t.album,
              duration: t.duration,
              format: t.ext,
              source: t.source,
              file: path,
              original: t.filename
            };
            var extra = [];
            if (metaFormat === "embedded") {
              
              
              var durSec = parseInt(t.duration, 10);
              var durMs = isNaN(durSec) ? 0 : durSec * 1000;
              var meta = {
                title: t.title,
                artist: t.artist,
                album: t.album,
                index: idx + 1,
                durationMs: durMs
              };
              var ext = String(t.ext || "").toLowerCase();
              var cov = coverFor(t);
              if (ext === "mp3" || ext === "mp2") {
                bytes = prependU8(id3v2Tag(meta, cov), bytes);
              } else if (ext === "flac") {
                bytes = flacEmbed(bytes, meta, cov);
              }
            }
            if (metaFormat === "txt") {
              
              var txtPath = folder + nn + " - " + sanitize(t.title) + ".txt";
              var txtLines = [];
              txtLines.push("Title: " + (t.title || ""));
              txtLines.push("Artist: " + (t.artist || ""));
              txtLines.push("Album: " + (t.album || ""));
              if (t.duration) txtLines.push("Duration: " + t.duration);
              txtLines.push("File: " + path);
              txtLines.push("");
              extra.push({ path: txtPath, bytes: strToU8(txtLines.join("\n")) });
            }
            if (metaFormat === "m3u") {
              var dur = parseInt(t.duration, 10);
              if (isNaN(dur)) dur = -1;
              extra.push({ m3u: "#EXTINF:" + dur + "," + (t.artist + " - " + t.title) + "\n" + path });
            }
            if (onProgress) onProgress(idx + 1, tracks.length, t.title);
            return { bytes: bytes, path: path, extra: extra, artist: t.artist, album: t.album, index: idx, title: t.title, manifestEntry: manifestEntry };
          }).catch(function () {
            if (onProgress) onProgress(idx + 1, tracks.length, "error: " + t.filename);
            return null;
          });
      }
      function streamZip() {
        var b64Parts = [];
        var zip = new ff.Zip(function (err, chunk, final) {
          if (chunk && chunk.length) {
            b64Parts.push(u8ToB64(chunk, buffer));
          }
        });
        function add(path, data) {
          var pt = new ff.ZipPassThrough(path);
          zip.add(pt);
          pt.push(data, true);
        }
        var CONCURRENT = 4;
        var m3uExtra = [];
        var p = resolveAllCovers().then(function () {
          var next = 0;
          var results = [];
          function worker() {
            if (next >= tracks.length) return Promise.resolve();
            var idx = next++;
            var t = tracks[idx];
            return buildTrack(t, idx).then(function (r) {
              if (r) results[idx] = r;
              return worker();
            });
          }
          var workers = [];
          for (var w = 0; w < CONCURRENT && w < tracks.length; w++) {
            workers.push(worker());
          }
          return Promise.all(workers).then(function () { return results; });
        }).then(function (results) {
          results.sort(function (a, b) {
            if (!a) return 1;
            if (!b) return -1;
            return a.index - b.index;
          });
          for (var ri = 0; ri < results.length; ri++) {
            var r = results[ri];
            if (!r) continue;
            manifest.tracks.push(r.manifestEntry);
            add(r.path, r.bytes);
            r.extra.forEach(function (x) {
              if (x.m3u) m3uExtra.push(x.m3u);
              else add(x.path, x.bytes);
            });
          }
          m3uLines = m3uLines.concat(m3uExtra);
          var addedCovers = {};
          tracks.forEach(function (r) {
            var cov = coverFor(r);
            if (cov && r.artist && r.album) {
              var folder = sanitize(r.artist) + "/" + sanitize(r.album) + "/";
              if (folder && !addedCovers[folder]) {
                addedCovers[folder] = true;
                add(folder + "cover.jpg", cov);
              }
            }
          });
          if (metaFormat === "m3u") {
            add("playlist.m3u", strToU8(m3uLines.join("\n")));
          } else if (metaFormat !== "txt" && metaFormat !== "embedded") {
            add("manifest.json", strToU8(JSON.stringify(manifest, null, 2)));
          }
          zip.end();
          return { b64: b64Parts.join(""), manifest: manifest, count: tracks.length, metaFormat: metaFormat };
        });
        return p;
      }
      function storeZip() {
        var entries = {};
        var results = new Array(tracks.length);
        var seq = Promise.resolve();
        tracks.forEach(function (t, idx) {
          seq = seq.then(function () {
            return buildTrack(t, idx).then(function (r) {
              if (r) results[idx] = r;
              return null;
            });
          });
        });
        return resolveAllCovers().then(function () {
          return seq;
        }).then(function () {
          var addedCovers = {};
          results.forEach(function (r) {
            if (!r) return;
            entries[r.path] = r.bytes;
            r.extra.forEach(function (x) {
              if (x.m3u) m3uLines.push(x.m3u);
              else entries[x.path] = x.bytes;
            });
            var cov = coverFor(r);
            if (cov && r.path) {
              var cfolder = r.path.slice(0, r.path.lastIndexOf("/") + 1);
              if (cfolder && !addedCovers[cfolder]) {
                addedCovers[cfolder] = true;
                entries[cfolder + "cover.jpg"] = cov;
              }
            }
          });
          if (metaFormat === "m3u") {
            entries["playlist.m3u"] = strToU8(m3uLines.join("\n"));
          } else if (metaFormat !== "txt" && metaFormat !== "embedded") {
            entries["manifest.json"] = strToU8(JSON.stringify(manifest, null, 2));
          }
          var tz = Date.now();
          var zip = zipStore(entries);
          try {
          } catch (e) {}
          return { zip: zip, manifest: manifest, count: tracks.length, metaFormat: metaFormat };
        });
      }
      if (canStream) return streamZip();
      return storeZip();
    });
  }

  
  function writeZip(spine, zipBytes) {
    var fs = spine && spine.storage ? spine.storage.fs() : null;
    if (!fs) return Promise.reject(new Error("FileSystem not found"));
    var isB64 = typeof zipBytes === "string";
    var doc = (fs.cacheDirectory || fs.documentDirectory || "");
    var dir = doc + "parasy8_export/";
    var name = "spine_music_" + Date.now() + ".zip";
    var mk = (typeof fs.makeDirectoryAsync === "function")
      ? fs.makeDirectoryAsync(dir, { intermediates: true, idempotent: true }).catch(function () {})
      : Promise.resolve();
    var prepare = isB64
      ? Promise.resolve(zipBytes)
      : resolveBuffer().then(function (buffer) {
          return u8ToB64(zipBytes, buffer);
        });
    return prepare.then(function (b64) {
      return mk.then(function () {
        return fs.writeAsStringAsync(dir + name, b64, { encoding: "base64" }).then(function () {
          try {
          } catch (e) {}
          return { uri: dir + name, name: name };
        });
      });
    });
  }

  
  function exportDirect(spine, tracks, onProgress) {
    var fs = spine && spine.storage ? spine.storage.fs() : null;
    if (!fs) return Promise.reject(new Error("FileSystem not found"));
    var doc = (fs.cacheDirectory || fs.documentDirectory || "");
    var dir = doc + "parasy8_export/";
    var uris = [];
    var seq = Promise.resolve();
    tracks.forEach(function (t, idx) {
      seq = seq.then(function () {
        var nn = ("0" + (idx + 1)).slice(-2);
        var folder = sanitize(t.artist) + "/" + sanitize(t.album) + "/";
        var dest = dir + folder + nn + " - " + sanitize(t.title) + "." + t.ext;
        var mk = (typeof fs.makeDirectoryAsync === "function")
          ? fs.makeDirectoryAsync(dir + folder, { intermediates: true, idempotent: true }).catch(function () {})
          : Promise.resolve();
        return mk.then(function () {
          if (typeof fs.copyAsync !== "function") return null;
          return fs.copyAsync({ from: t.uri, to: dest }).then(function () {
            uris.push(dest);
            if (onProgress) onProgress(idx + 1, tracks.length, t.title);
            return null;
          }).catch(function () { return null; });
        });
      });
    });
    return seq.then(function () {
      if (!uris.length) return null;
      return {
        mode: "direct",
        uri: uris,
        name: null,
        count: uris.length,
        tracks: tracks,
        manifest: null,
        metaFormat: null,
        zip: null,
        b64: null,
        exportDir: dir
      };
    });
  }

  function exportMusic(spine, onProgress, opts) {
    opts = opts || {};
    var metaFormat = opts.metaFormat || "json";
    return listDownloads(spine).then(function (tracks) {
      if (!tracks.length) {
        return Promise.reject(new Error("No downloaded music found"));
      }
      return exportDirect(spine, tracks, onProgress).then(function (r) {
        if (r && r.uri && r.uri.length) return r;
        return Promise.reject(new Error("Direct copy failed for all tracks"));
      });
    });
  }

  
  
  function shareZip(spine, uri, opts) {
    opts = opts || {};
    var isList = Array.isArray(uri);
    var uris = isList ? uri : [uri];
    var mime = isList ? (opts.mimeType || "audio/*") : "application/zip";
    return resolveSharing().then(function (sharing) {
      if (!sharing || typeof sharing.shareAsync !== "function") {
        return { ok: false, reason: "share-nao-disponivel" };
      }
      var avail = (typeof sharing.isAvailableAsync === "function")
        ? Promise.resolve(sharing.isAvailableAsync())
        : Promise.resolve(true);
      return Promise.resolve(avail).then(function (ok) {
        if (!ok) return { ok: false, reason: "share-indisponivel" };
        var target = isList ? uris : uri;
        return Promise.resolve(sharing.shareAsync(target, {
          mimeType: mime,
          dialogTitle: opts.dialogTitle || "Export music",
          UTI: isList ? "public.item" : "public.zip-archive"
        })).then(function () {
          var after = { ok: true };
          if (isList && opts.exportDir && spine && spine.storage) {
            var cfs = spine.storage.fs();
            if (cfs && typeof cfs.deleteAsync === "function") {
              after.cleanup = cfs.deleteAsync(opts.exportDir, { idempotent: true }).catch(function () {});
            }
          }
          return after;
        }).catch(function (e) {
          return { ok: false, reason: (e && e.message) || String(e) };
        });
      });
    });
  }

  
  
  
  
  function warmup() {
    return Promise.all([
      resolveBuffer().catch(function () { return null; }),
      resolveSharing().catch(function () { return null; })
    ]).then(function (r) {
      return { buffer: !!r[0], sharing: !!r[1] };
    });
  }

  S.exporter = {
    listDownloads: listDownloads,
    buildZip: buildZip,
    writeZip: writeZip,
    exportMusic: exportMusic,
    shareZip: shareZip,
    warmup: warmup,
    parseFilename: parseFilename,
    parseKeyMeta: parseKeyMeta,
    sanitize: sanitize
  };
})();


/* ===== settings.js ===== */
(function () {
  "use strict";

  SPINE.registerMod("settings-spine-row", function (spine) {
    var find = spine.metro.find;
    var byName = spine.metro.byName;
    var ui = spine.ui;

    var g = (typeof globalThis !== "undefined") ? globalThis : ((typeof global !== "undefined") ? global : window);

    
    
    
    

    var JSX_MATCH = function (exps) {
      
      
      return exps && typeof exps === "object" && typeof exps.jsx === "function" && typeof exps.jsxs === "function" &&
        typeof exps.createElement !== "function";
    };
    var TOKEN = Symbol.for("spine.settings.injected");

    function interop(exps) {
      if (!exps) return null;
      return (exps.__esModule && exps.default !== undefined) ? exps.default : exps;
    }

    function trySetDefault(exps, value) {
      if (!exps) return { ok: false, reason: "no-exps" };
      try {
        exps.default = value;
        return { ok: true };
      } catch (e1) {
        try {
          Object.defineProperty(exps, "default", {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
          });
          return { ok: true };
        } catch (e2) {
          return { ok: false, reason: (e2 && e2.message) || String(e2) };
        }
      }
    }

    function hookJsxExports(modExports, st) {
      var out = { hooked: false, stages: [] };
      if (!modExports) {
        out.stages.push("no-mod");
        return out;
      }
      ["jsx", "jsxs"].forEach(function (name) {
        var orig = null;
        try { orig = modExports[name]; } catch (e) {}
        if (typeof orig !== "function") {
          out.stages.push(name + ":nao-fn");
          return;
        }
        var wrapped = function (type, props, key) {
          if (st.Orig && type === st.Orig) {
            st.renders++;
            var W = st.Wrapped || (typeof st.build === "function" ? st.build() : null);
            if (W && W !== type) type = W;
          }
          
          
          
          
          
          if (props && props.children === "paras8") {
            st.paras8Card = true;
          } else if (props && props.children === "CLOUD DOWNLOADS MODULE") {
            if (st.paras8Card) {
              var clone = {};
              for (var pk in props) {
                if (Object.prototype.hasOwnProperty.call(props, pk)) clone[pk] = props[pk];
              }
              clone.children = "NOT MUSIC SOURCE";
              props = clone;
              st.paras8Card = false;
            }
          }
          return orig(type, props, key);
        };
        try {
          modExports[name] = wrapped;
          out.stages.push(name + ":set");
          return;
        } catch (e1) {
          try {
            Object.defineProperty(modExports, name, {
              value: wrapped,
              enumerable: true,
              configurable: true,
              writable: true
            });
            out.stages.push(name + ":dprop");
            return;
          } catch (e2) {
            out.stages.push(name + ":ERR " + ((e2 && e2.message) || e2));
          }
        }
      });
      out.hooked = out.stages.some(function (s) { return s.indexOf(":ERR") === -1; });
      return out;
    }

    function hookJsxRuntime(st) {
      var out = { hooked: false, stages: [] };
      var f = null;
      try {
        f = spine.metro.scanDirect(JSX_MATCH);
      } catch (e) {}
      if (!f) {
        out.stages.push("jsx:nao-encontrado");
        return out;
      }
      var r = hookJsxExports(f.module, st);
      out.stages.push("jsx:" + r.stages.join("/"));
      out.hooked = r.hooked;
      return out;
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    var LOADER_ID = "paras8-liver";

    function filterIdArray(v) {
      try {
        var a = JSON.parse(v);
        if (Array.isArray(a)) {
          var f = a.filter(function (x) {
            var id = (x && typeof x === "object") ? x.id : x;
            return id !== LOADER_ID;
          });
          return JSON.stringify(f);
        }
      } catch (e) {}
      return null;
    }

    function filterPairArray(v) {
      try {
        var a = JSON.parse(v);
        if (Array.isArray(a)) {
          var f = a.filter(function (x) {
            var id = Array.isArray(x) ? x[0] : (x && x.id);
            return id !== LOADER_ID;
          });
          return JSON.stringify(f);
        }
      } catch (e) {}
      return null;
    }

    function closeApp() {
      try {
        var RN2 = ui.rn();
        if (RN2 && RN2.BackHandler && typeof RN2.BackHandler.exitApp === "function") {
          RN2.BackHandler.exitApp();
          return true;
        }
      } catch (e) {}
      try {
        var RN3 = ui.rn();
        if (RN3 && RN3.DevSettings && typeof RN3.DevSettings.reload === "function") {
          RN3.DevSettings.reload();
          return true;
        }
      } catch (e2) {}
      return false;
    }

    function requestUnpatch(spine) {
      try {
        var st = spine.storage;
        var work = [
          st.get("user_modules").then(function (v) {
            var nv = filterIdArray(v);
            return nv ? st.set("user_modules", nv) : Promise.resolve(true);
          }),
          st.get("active_streaming_module_ids").then(function (v) {
            var nv = filterIdArray(v);
            return nv ? st.set("active_streaming_module_ids", nv) : Promise.resolve(true);
          }),
          st.get("module_settings").then(function (v) {
            var nv = filterPairArray(v);
            return nv ? st.set("module_settings", nv) : Promise.resolve(true);
          }),
          st.get("active_module_id").then(function (v) {
            return (v === LOADER_ID) ? st.remove("active_module_id") : Promise.resolve(true);
          }),
          st.get("active_cloud_module_id").then(function (v) {
            return (v === LOADER_ID) ? st.remove("active_cloud_module_id") : Promise.resolve(true);
          }),
          
          st.wipe()
        ];
        return Promise.all(work).then(function (r) {
          resetSpineRuntime();
          var exit = closeApp();
          try {
          } catch (e) {}
          return { done: true, exit: exit };
        }).catch(function (e) {
          return { done: false, exit: false };
        });
      } catch (e) {
        return Promise.resolve({ done: false, exit: false });
      }
    }

    function resetSpineRuntime() {
      try {
        try { g.SPINE.booted = false; } catch (e) {}
        try { g.__SPINE_EXEC_TS__ = 0; } catch (e) {}
        try {
          var pre = g.__SPINE_PRE__;
          if (pre && pre.settings) {
            var stReset = pre.settings;
            stReset.Orig = null;
            stReset.Wrapped = null;
            stReset.OrigProxy = false;
            stReset.lastFail = "unpatch";
          }
        } catch (e2) {}
      } catch (e3) {}
    }

    
    
    
    
    
    
    
    function buildUnpatchPage(spine, route) {
      var nav = null;
      var theme = {};
      try {
        if (route && route.navigation) nav = route.navigation;
        var r = (route && route.route) || {};
        if (r.navigation) nav = r.navigation;
        var ps = (r && r.params) || {};
        if (ps.theme) theme = ps.theme;
      } catch (e) {}
      var R = ui.react();
      var RN = ui.rn();
      var L = ui.layout();
      if (!R || !RN) {
        return null;
      }
      var h = ui.h;
      var styles = (L && L.styles) || {};
      var Ion = ui.icons();
      var Blur = ui.blurView();
      var pressType = RN.View;
      var names = ["Pressable", "TouchableOpacity", "TouchableHighlight", "View"];
      for (var i = 0; i < names.length; i++) {
        try {
          if (typeof RN[names[i]] === "function") {
            pressType = RN[names[i]];
            break;
          }
        } catch (e2) {}
      }
      var pageWidth = null;
      try {
        if (L && typeof L.useSettingsPaneLayout === "function") {
          pageWidth = L.useSettingsPaneLayout(route).pageWidth;
        }
      } catch (e3) {}
      var goBack = function () {
        try {
          if (nav && typeof nav.goBack === "function") nav.goBack();
        } catch (e4) {}
      };
      var onUnpatch = function () {
        var doRemove = function () {
          var p = null;
          try {
            p = requestUnpatch(spine);
          } catch (e) {
            p = null;
          }
          if (p && typeof p.then === "function") {
            p.then(function (r) {
              if (!r || !r.exit) goBack();
            }, goBack);
          } else {
            goBack();
          }
        };
        
        
        var shown = false;
        try {
          shown = ui.Alert("Remove paras8?", "The paras8 loader, its bundle and all saved data will be deleted and the app will close. Your library and accounts are not affected. You can reinstall it later from Settings > Modules.", [
            { text: "Cancel", style: "cancel" },
            { text: "Remove & Close", style: "destructive", onPress: doRemove }
          ]);
        } catch (e) {}
        if (!shown) {
          
          
          try {
          } catch (e2) {}
        }
      };

      
      
      var blurEl = null;
      if (Blur) {
        blurEl = h(Blur, {
          style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
          blurType: "dark",
          blurAmount: 20,
          pointerEvents: "none"
        });
      }
      var backBtn = h(pressType, {
        style: styles.backButtonContainer,
        onPress: goBack,
        hitSlop: 10
      }, Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: "chevron-back", size: 32, color: theme.primaryText }) : null);
      var header = h(RN.View, { style: styles.settingsPageHeader },
        [blurEl, backBtn, h(RN.Text, {
          style: [styles.settingsPageTitle, { color: theme.primaryText }],
          children: "paras8"
        })].filter(function (x) { return x !== null; }));

      
      
      var about = null;
      try {
        about = ui.buildSettingsSection(route, {
          title: "About",
          label: "Parasyte loader",
          subtitle: "v" + (spine.version || "?"),
          key: "spine-about"
        });
      } catch (e5) {}
      var dangerRow = h(pressType, {
        key: "spine-unpatch-row",
        style: [
          styles.settingsRowGrouped,
          styles.settingsRowFirst,
          styles.settingsRowLast,
          { borderBottomWidth: 0, backgroundColor: theme.card }
        ],
        onPress: onUnpatch
      }, [
        h(RN.Text, { style: [styles.settingsRowText, { color: theme.accent || "#FF3B30" }], children: "Unpatch" }),
        Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: "chevron-forward", size: 20, color: theme.secondaryText }) : null
      ].filter(function (x) { return x !== null; }));
      var dangerGroup = (L && L.SettingsGroup) ? h(L.SettingsGroup, { theme: theme, children: dangerRow }) : dangerRow;
      var dangerSection = h(RN.View, {
        style: styles.settingsSection,
        children: [
          h(RN.Text, {
            style: [styles.settingsSectionTitle, { color: theme.secondaryText, marginLeft: 16, marginBottom: 8 }],
            children: "Danger zone"
          }),
          dangerGroup
        ]
      });
      
      
      
      var onExportRow = function () {
        try {
          if (nav && typeof nav.navigate === "function") {
            nav.navigate("SpineExport", { theme: theme });
          }
        } catch (e) {}
      };
      var exportRow = h(pressType, {
        key: "spine-export-row",
        style: [
          styles.settingsRowGrouped,
          styles.settingsRowFirst,
          styles.settingsRowLast,
          { borderBottomWidth: 0, backgroundColor: theme.card }
        ],
        onPress: onExportRow
      }, [
        h(RN.Text, { style: [styles.settingsRowText, { color: theme.primaryText }], children: "Export music" }),
        Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: "chevron-forward", size: 20, color: theme.secondaryText }) : null
      ].filter(function (x) { return x !== null; }));
      var exportGroup = (L && L.SettingsGroup) ? h(L.SettingsGroup, { theme: theme, children: exportRow }) : exportRow;
      var exportSection = h(RN.View, {
        style: styles.settingsSection,
        children: [
          h(RN.Text, {
            style: [styles.settingsSectionTitle, { color: theme.secondaryText, marginLeft: 16, marginBottom: 8 }],
            children: "Music"
          }),
          exportGroup
        ]
      });
      var content = h(RN.View, {
        style: { flex: 1, width: pageWidth || undefined, alignSelf: "center" },
        children: [about, exportSection, dangerSection].filter(function (x) { return x !== null; })
      });
      return h(RN.View, {
        style: [styles.settingsPageContainer, { backgroundColor: theme.background }],
        children: [header, content]
      });
    }

    
    
    
    
    
    
    
    
    
    
    
    
    function buildExportPage(spine, route) {
      var R = ui.react();
      if (!R || typeof R.createElement !== "function" || typeof R.useState !== "function") {
        return null;
      }
      return R.createElement(ExportPage, { spine: spine, route: route });
    }

    
    
    
    function ExportPage(props) {
      var R = ui.react();
      var busyState = R.useState(false);
      var statusState = R.useState("");
      var metaState = R.useState(spine.prefs && typeof spine.prefs.get === "function" ? spine.prefs.get("exportMetaFormat", "json") : "json");
      var busy = busyState[0] === true;
      var setBusy = busyState[1];
      var status = statusState[0] || "";
      var setStatus = statusState[1];
      var meta = metaState[0] || "json";
      var setMeta = metaState[1];
      
      
      try {
        return buildExportPageBody(props.spine, props.route, {
          busy: busy,
          setBusy: setBusy,
          status: status,
          setStatus: setStatus,
          meta: meta,
          setMeta: setMeta
        });
      } catch (e) {
        return null;
      }
    }

    function buildExportPageBody(spine, route, fb) {
      fb = fb || {};
      var setBusy = fb.setBusy || null;
      var setStatus = fb.setStatus || null;
      var busy = !!fb.busy;
      var status = fb.status || "";
      var meta = fb.meta || "json";
      var setMeta = fb.setMeta || null;
      var nav = null;
      var theme = {};
      try {
        if (route && route.navigation) nav = route.navigation;
        var r = (route && route.route) || {};
        if (r.navigation) nav = r.navigation;
        var ps = (r && r.params) || {};
        if (ps.theme) theme = ps.theme;
      } catch (e) {}
      var R = ui.react();
      var RN = ui.rn();
      var L = ui.layout();
      if (!R || !RN) {
        return null;
      }
      
      
      var h = ui.h;
      var styles = (L && L.styles) || {};
      var Ion = ui.icons();
      var Blur = ui.blurView();
      var pressType = RN.View;
      var names = ["Pressable", "TouchableOpacity", "TouchableHighlight", "View"];
      for (var i = 0; i < names.length; i++) {
        try {
          if (typeof RN[names[i]] === "function") {
            pressType = RN[names[i]];
            break;
          }
        } catch (e2) {}
      }
      var pageWidth = null;
      try {
        if (L && typeof L.useSettingsPaneLayout === "function") {
          pageWidth = L.useSettingsPaneLayout(route).pageWidth;
        }
      } catch (e3) {}
      var goBack = function () {
        try {
          if (nav && typeof nav.goBack === "function") nav.goBack();
        } catch (e4) {}
      };

      
      
      
      
      
      
      
      
      
      var exporting = false;
      function setFeedback(msg) {
        if (setStatus) {
          try { setStatus(msg); } catch (e) {}
        }
      }
      function runExport() {
        if (exporting) return;
        exporting = true;
        if (setBusy) {
          try { setBusy(true); } catch (e) {}
        }
        setFeedback("Preparing files...");
        var p = null;
        try {
          if (spine.exporter && typeof spine.exporter.exportMusic === "function") {
            p = spine.exporter.exportMusic(spine, function (idx, total, msg) {
              setFeedback((total > 1 ? "(" + idx + "/" + total + ") " : "") + (msg || "Exporting..."));
            }, { metaFormat: meta });
          }
        } catch (e) {}
        if (!p || typeof p.then !== "function") {
          exporting = false;
          if (setBusy) {
            try { setBusy(false); } catch (e) {}
          }
          setFeedback("");
          ui.Alert("Export music", "Export is not available in this boot.", [{ text: "OK" }]);
          return;
        }
        p.then(function (res) {
          exporting = false;
          if (setBusy) {
            try { setBusy(false); } catch (e) {}
          }
          setFeedback("");
          try {
            if (spine.exporter && typeof spine.exporter.shareZip === "function") {
              spine.exporter.shareZip(spine, res.uri, { exportDir: res.exportDir }).then(function (sh) {
                if (sh && sh.ok) {
                  ui.Alert("Export music", res.count + " track(s) ready. Use the share sheet to save to Files/apps.", [{ text: "OK" }]);
                } else {
                  var where = Array.isArray(res.uri) ? res.uri.join(" , ") : res.uri;
                  ui.Alert("Export music", (Array.isArray(res.uri) ? "Arquivos prontos: " : "Arquivo criado: ") + where + (sh && sh.reason ? " (share: " + sh.reason + ")" : ""), [{ text: "OK" }]);
                }
              }, function () {});
            }
          } catch (e2) {}
        }, function (err) {
          exporting = false;
          if (setBusy) {
            try { setBusy(false); } catch (e) {}
          }
          setFeedback("");
          var msg = (err && err.message) || String(err);
          ui.Alert("Export music", "Error: " + msg, [{ text: "OK" }]);
        });
      }

      var blurEl = null;
      if (Blur) {
        blurEl = h(Blur, {
          style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
          blurType: "dark",
          blurAmount: 20,
          pointerEvents: "none"
        });
      }
      var backBtn = h(pressType, {
        style: styles.backButtonContainer,
        onPress: goBack,
        hitSlop: 10
      }, Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: "chevron-back", size: 32, color: theme.primaryText }) : null);
      var header = h(RN.View, { style: styles.settingsPageHeader },
        [blurEl, backBtn, h(RN.Text, {
          style: [styles.settingsPageTitle, { color: theme.primaryText }],
          children: "Export music"
        })].filter(function (x) { return x !== null; }));

      
      
      var exportRow = h(pressType, {
        key: "spine-export-run-row",
        style: [
          styles.settingsRowGrouped,
          styles.settingsRowFirst,
          styles.settingsRowLast,
          { borderBottomWidth: 0, backgroundColor: theme.card }
        ],
        onPress: runExport
      }, [
        h(RN.Text, { style: [styles.settingsRowText, { color: theme.primaryText }], children: "Export downloaded music" }),
        Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: "download-outline", size: 20, color: theme.secondaryText }) : null
      ].filter(function (x) { return x !== null; }));
      var exportGroup = (L && L.SettingsGroup) ? h(L.SettingsGroup, { theme: theme, children: exportRow }) : exportRow;
      var exportSection = h(RN.View, {
        style: styles.settingsSection,
        children: [
          h(RN.Text, {
            style: [styles.settingsSectionTitle, { color: theme.secondaryText, marginLeft: 16, marginBottom: 8 }],
            children: "Music"
          }),
          exportGroup
        ]
      });
      
      
      
      
      
      
      
      var META_OPTS = [
        { key: "json", label: "JSON manifest", desc: "Single manifest.json with all tracks." },
        { key: "m3u", label: "M3U playlist", desc: "playlist.m3u with paths + #EXTINF." },
        { key: "txt", label: "TXT per track", desc: "One .txt file per track (sidecar)." },
        { key: "embedded", label: "Embedded tags", desc: "ID3v2 (mp3) / Vorbis (flac) inside the files." }
      ];
      function radioRow(opt, first, last) {
        var selected = meta === opt.key;
        var rowStyle = [styles.settingsRowGrouped];
        if (first) rowStyle.push(styles.settingsRowFirst);
        if (last) rowStyle.push(styles.settingsRowLast);
        rowStyle.push({ borderBottomColor: theme.border, borderBottomWidth: RN.StyleSheet && RN.StyleSheet.hairlineWidth ? RN.StyleSheet.hairlineWidth : 1, backgroundColor: theme.card });
        return h(pressType, {
          key: "spine-meta-" + opt.key,
          accessibilityRole: "radio",
          accessibilityState: { checked: selected },
          onPress: function () {
            if (setMeta) {
              try { setMeta(opt.key); } catch (e) {}
            }
            try {
              if (spine.prefs && typeof spine.prefs.set === "function") {
                spine.prefs.set("exportMetaFormat", opt.key);
              }
            } catch (e2) {}
          },
          style: rowStyle
        }, [
          h(RN.View, { style: [styles.settingsRowLeft, { flex: 1 }] }, [
            h(RN.View, { style: { flex: 1 } }, [
              h(RN.View, { style: { flexDirection: "row", alignItems: "center", gap: 8 } }, [
                h(RN.Text, { style: [styles.settingsRowText, { color: theme.primaryText }], children: opt.label }),
                (opt.key === "json")
                  ? h(RN.View, { style: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: theme.pillBackground, borderWidth: 1, borderColor: theme.pillBorder || theme.border } }, [
                      h(RN.Text, { style: { color: theme.pillText || theme.primaryText, fontSize: 10, fontWeight: "800" }, children: "DEFAULT" })
                    ])
                  : null
              ]),
              h(RN.Text, { style: { color: theme.secondaryText, fontSize: 12, marginTop: 3, maxWidth: 280 }, children: opt.desc })
            ])
          ]),
          Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: selected ? "radio-button-on" : "radio-button-off", size: 22, color: selected ? (theme.accent || theme.primaryText) : theme.secondaryText }) : null
        ].filter(function (x) { return x !== null; }));
      }
      var metaRows = META_OPTS.map(function (opt, i) {
        return radioRow(opt, i === 0, i === META_OPTS.length - 1);
      });
      var metaGroup = (L && L.SettingsGroup) ? h(L.SettingsGroup, { theme: theme, children: metaRows }) : metaRows;
      var metaSection = h(RN.View, {
        style: styles.settingsSection,
        children: [
          h(RN.Text, {
            style: [styles.settingsSectionTitle, { color: theme.secondaryText, marginLeft: 16, marginBottom: 8 }],
            children: "Metadata"
          }),
          metaGroup
        ]
      });
      var content = h(RN.View, {
        style: { flex: 1, width: pageWidth || undefined, alignSelf: "center" },
        children: [exportSection, metaSection].filter(function (x) { return x !== null; })
      });
      
      
      
      var spinner = null;
      if (busy) {
        var ai = null;
        try { ai = RN.ActivityIndicator; } catch (e5) {}
        spinner = h(RN.View, {
          key: "spine-export-overlay",
          style: {
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.45)"
          }
        }, [
          h(RN.View, {
            style: {
              borderRadius: 14, paddingHorizontal: 22, paddingVertical: 18,
              alignItems: "center", backgroundColor: theme.card
            }
          }, [
            (typeof ai === "function" || (ai && typeof ai.render === "function"))
              ? h(ai, { size: "large", color: theme.accent })
              : null,
            h(RN.Text, {
              style: [styles.settingsRowText, { color: theme.primaryText, marginTop: 10, textAlign: "center" }],
              children: status || "Exporting music..."
            })
          ].filter(function (x) { return x !== null; }))
        ]);
      }
      return h(RN.View, {
        style: [styles.settingsPageContainer, { backgroundColor: theme.background }],
        children: [header, content, spinner].filter(function (x) { return x !== null; })
      });
    }

    
    
    
    
    function hookNavigatorScreens(st, spine) {
      var f = null;
      try {
        f = spine.metro.scanDirect(JSX_MATCH);
      } catch (e) {}
      if (!f) {
        return { ok: false, reason: "jsx-runtime ausente" };
      }
      var mod = f.module;
      function injectScreen(ch, name, key, builder) {
        if (!st.screenType || !Array.isArray(ch)) return null;
        for (var k = 0; k < ch.length; k++) {
          var c = ch[k];
          if (c && c.props && c.props.name === name) return null;
        }
        var R = ui.react();
        if (!R) return null;
        var screenEl = R.createElement(st.screenType, {
          name: name,
          headerShown: false,
          key: key,
          children: function (route) {
            try {
              if (!st.pageOpened) {
                st.pageOpened = true;
              }
            } catch (e2) {}
            return builder(spine, route);
          }
        });
        if (!screenEl) return null;
        var hole = -1;
        for (var i = 0; i < ch.length; i++) {
          if (!ch[i]) {
            hole = i;
            break;
          }
        }
        if (hole !== -1) {
          ch[hole] = screenEl;
        } else {
          ch.push(screenEl);
        }
        return screenEl;
      }
      function tryNav(el) {
        if (!el || typeof el !== "object") return el;
        var tp = el.type;
        if (!tp || typeof tp !== "function") return el;
        var nm = tp.name || tp.displayName || "";
        if (nm === "Screen") {
          st.screenType = st.screenType || tp;
          return el;
        }
        if (nm !== "NativeStackNavigator") return el;
        var ch = el.props && el.props.children;
        if (!Array.isArray(ch)) return el;
        if (!st.screenType) return el;
        var s1 = injectScreen(ch, "SpineUnpatch", "spine-unpatch", buildUnpatchPage);
        var s2 = injectScreen(ch, "SpineExport", "spine-export", buildExportPage);
        return el;
      }
      ["jsx", "jsxs"].forEach(function (name) {
        var orig = null;
        try { orig = mod[name]; } catch (e3) {}
        if (typeof orig !== "function") return;
        var w = function (type, props, key) {
          var out = orig(type, props, key);
          try { out = tryNav(out) || out; } catch (e4) {}
          return out;
        };
        try {
          mod[name] = w;
        } catch (e5) {
          try {
            Object.defineProperty(mod, name, {
              value: w,
              enumerable: true,
              configurable: true,
              writable: true
            });
          } catch (e6) {}
        }
      });
      return { ok: true };
    }

    function makeWrapped(st, spine) {
      var Orig = st.Orig;
      if (typeof Orig !== "function") return null;
      var onPressRow = function (props) {
        var nav = null;
        var fired = false;
        try {
          if (props.route && props.route.navigation) nav = props.route.navigation;
          else if (props.route && props.route.route && props.route.route.navigation) nav = props.route.route.navigation;
          else if (props.navigation) nav = props.navigation;
          if (nav && typeof nav.navigate === "function") {
            nav.navigate("SpineUnpatch", { theme: ui.getTheme(props) });
            fired = true;
          }
        } catch (e) {}
        return fired;
      };
      var Wrapped = function (route) {
        var props = route || {};
        var el = null;
        try {
          el = Orig(props);
        } catch (e) {
          spine.error("settings.render", e);
          return null;
        }
        if (!el || typeof el !== "object") {
          return el;
        }
        var out = ui.injectIntoSettings(el, props, {
          title: "paras8",
          label: "paras8 Settings",
          key: "spine-row-modules",
          onPress: function () { onPressRow(props); }
        });
        return out;
      };
      Wrapped[TOKEN] = true;
      Wrapped.__spineWrapped = true;
      try {
        Object.defineProperty(Wrapped, "name", { value: Orig.name || "SettingsPage", configurable: true });
        Object.defineProperty(Wrapped, "displayName", { value: Orig.displayName || Orig.name || "SettingsPage", configurable: true });
      } catch (e) {}
      return Wrapped;
    }

    function buildProxy(st, spine) {
      var proxy = function (route) {
        var W = st.Wrapped || (typeof st.build === "function" ? st.build() : null);
        if (W) {
          st.renders++;
          return W(route);
        }
        return st.Orig(route);
      };
      proxy.__spineProxy = true;
      try {
        Object.defineProperty(proxy, "name", { value: "SettingsPage", configurable: true });
        Object.defineProperty(proxy, "displayName", { value: "SettingsPage", configurable: true });
      } catch (e) {}
      return proxy;
    }

    function scheduleReports(st) {
      try {
        setTimeout(function () {
          try {
            var inj = spine.ui.lastInject ? spine.ui.lastInject() : null;
            var injS = "na";
            if (inj) {
              injS = inj.status;
              if (inj.scrollers !== undefined) injS += " scrollers=" + inj.scrollers;
              if (inj.styles !== undefined) injS += " styles=" + (inj.styles ? 1 : 0);
              if (inj.layout !== undefined) injS += " layout=" + inj.layout;
              if (inj.layoutId !== undefined) injS += " layoutId=" + inj.layoutId;
              if (inj.ss !== undefined) injS += " ss=" + inj.ss;
              if (inj.srg !== undefined) injS += " srg=" + inj.srg;
              if (inj.react !== undefined) injS += " react=" + inj.react;
              if (inj.rn !== undefined) injS += " rn=" + inj.rn;
              if (inj.mirror !== undefined) injS += " mirror=" + inj.mirror;
            }
          } catch (e) {}
        }, 45000);
        setTimeout(function () {
          try {
          } catch (e) {}
        }, 180000);
      } catch (e) {}
      try {
      } catch (e) {}
    }

    var st = null;
    try {
      var PRE = g.__SPINE_PRE__;
      st = (PRE && PRE.settings) || null;
    } catch (e) {}
    if (!st) {
      st = {
        token: TOKEN,
        Orig: null,
        Wrapped: null,
        build: null,
        renders: 0,
        hooked: false,
        exps: null,
        defaultOk: false,
        defaultErr: "-",
        OrigProxy: false
      };
      try {
        g.__SPINE_PRE__ = g.__SPINE_PRE__ || {};
        g.__SPINE_PRE__.settings = st;
      } catch (e) {}
    }
    st.build = st.build || function () {
      var W = makeWrapped(st, spine);
      if (!W && st.Wrapped) W = st.Wrapped;
      return W;
    };

    
    
    
    
    
    try {
      spine.metro.pushCb(function (id, rec) {
        try {
          if (!rec.exports || st.Wrapped) return;
          var ex = rec.exports;
          var d = (ex && ex.__esModule && ex.default !== undefined) ? ex.default : ex;
          var isSettings = typeof d === "function" && (d.name === "SettingsPage" || d.displayName === "SettingsPage");
          if (isSettings || JSX_MATCH(rec.exports)) {
            if (applyOnce()) {
              try { scheduleReports(st); } catch (e2) {}
            }
          }
        } catch (e2) {}
      });
    } catch (e) {}

    function ensureOrig() {
      if (st.Orig) return true;
      if (st.OrigProxy) return false;
      var found = null;
      try {
        found = find(byName("SettingsPage"));
      } catch (e) {}
      var exps = found ? found.module : null;
      if (!exps && st.exps) exps = st.exps;
      if (!exps) return false;
      var Orig = interop(exps);
      if (Orig && typeof Orig === "function" && Orig.__spineProxy !== true) {
        st.exps = exps;
        st.Orig = Orig;
        return true;
      }
      st.OrigProxy = true;
      return false;
    }

    function applyOnce() {
      if (!ensureOrig()) {
        st.lastFail = "no-orig proxy=" + (st.OrigProxy ? 1 : 0) + " mirror=" + (spine.metro.mirror() ? Object.keys(spine.metro.mirror()).length : -1);
        return false;
      }
      if (st.Wrapped && st.Wrapped[TOKEN]) return true;

      if (!st.hooked) {
        var r = hookJsxRuntime(st);
        st.hooked = r.hooked;
        spine.log("settings", "jsx-runtime hook: " + r.stages.join(","));
      }

      if (st.exps) {
        var sr = trySetDefault(st.exps, buildProxy(st, spine));
        st.defaultOk = sr.ok;
        st.defaultErr = sr.ok ? null : sr.reason;
      } else {
        st.defaultErr = "no-exps";
      }

      var W = makeWrapped(st, spine);
      if (!W) {
        st.lastFail = "no-wrapped orig=" + (st.Orig ? "fn" : "null");
        return false;
      }
      st.Wrapped = W;
      
      
      
      if (!st.navHooked) {
        var nv = hookNavigatorScreens(st, spine);
        st.navHooked = nv.ok;
      }
      st.lastFail = null;
      return true;
    }

    if (!applyOnce()) {
      var retries = 0;
      var delay = 1500;
      (function retry() {
        
        
        
        
        try { spine.metro.seedMirror(); } catch (e2) {}
        if (applyOnce()) {
          scheduleReports(st);
          return;
        }
        retries++;
        if (retries < 8) {
          delay = Math.min(delay * 2, 20000);
          try { setTimeout(retry, delay); } catch (e) {}
        }
      })();
      return { applied: false, reason: "SettingsPage nao encontrada ainda (retrying)" };
    }
    scheduleReports(st);
    return { applied: true };
  });
})();

try {
  setTimeout(function () { SPINE.boot && SPINE.boot(); }, 500);
} catch (e) {}
