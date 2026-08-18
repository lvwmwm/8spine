
var GITHUB_RAW = "https://raw.githubusercontent.com/lvwmwm/8spine/main";
var BUNDLE_PATH = GITHUB_RAW + "/dist/spine.js";
var SILENCE_PATH = GITHUB_RAW + "/silence.wav";

var PRE_TOKEN = null;
try { PRE_TOKEN = Symbol.for("spine.settings.injected"); } catch (e) {}
var runBusy = false;


var FS_FOLDER = "parasy8/";
var FS_BUNDLE_FILE = "bundle.js";
var FS_META_FILE = "meta.json";
var BUNDLE_KEY = "spine_bundle";
var BUNDLE_META_KEY = "spine_bundle_v";

function isFS(s) {
  function good(x) {
    return !!x && typeof x === "object" &&
      typeof x.documentDirectory === "string" &&
      typeof x.getInfoAsync === "function" &&
      typeof x.readAsStringAsync === "function" &&
      typeof x.writeAsStringAsync === "function";
  }
  if (good(s)) return true;
  try {
    return good(s && s.default);
  } catch (e) {}
  return false;
}
function unwrapFS(s) {
  if (!s) return null;
  return (s && typeof s.getInfoAsync === "function") ? s : (s ? s.default : null);
}

function isSL(s) {
  if (!s) return false;
  if (typeof s.getItem === "function" && typeof s.setItem === "function") return true;
  
  
  try {
    var d = s.default;
    return !!d && typeof d.getItem === "function" && typeof d.setItem === "function";
  } catch (e) {}
  return false;
}
function unwrapSL(s) {
  return (s && typeof s.getItem === "function") ? s : (s ? s.default : null);
}


var storeMemo = null;
function findStore() {
  if (storeMemo) {
    return storeMemo;
  }
  var g = G();
  var out = null;
  var NAMES = ["RNCAsyncStorage", "AsyncStorage", "RCTAsyncLocalStorage", "PlatformLocalStorage"];
  function pick(s) {
    if (!s || out) return;
    if (isSL(s)) {
      out = unwrapSL(s);
    }
  }
  try { pick((typeof AsyncStorage !== "undefined") ? AsyncStorage : null); } catch (e) {}
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
    storeMemo = out;
  }
  return out;
}

function G() {
  try { if (typeof globalThis !== "undefined") return globalThis; } catch (e) {}
  try { return global; } catch (e) {}
  return {};
}

function timing(fn, ms) {
  if (typeof setTimeout === "function") {
    setTimeout(fn, ms);
    return true;
  }
  return false;
}

function shouldRun() {
  var s = findStore();
  if (!s) {
    return Promise.resolve(true);
  }
  try {
    return s.getItem("spine_config").then(function (v) {
      try {
        var c = v ? JSON.parse(v) : {};
        return !c.disabled;
      } catch (e) {
        return true;
      }
    }).catch(function () {
      return true;
    });
  } catch (e) {
    return Promise.resolve(true);
  }
}

function interopEx(exps) {
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

function installModuleSpy() {
  var g = G();
  var pre = null;
  try {
    pre = (g.__SPINE_PRE__ = g.__SPINE_PRE__ || {});
  } catch (e) {
    return { ok: false, reason: "no-global" };
  }
  var mirror = (pre.mods = pre.mods || {});
  var cbs = (pre.modsCbs = pre.modsCbs || []);
  if (g.__SPINE_MODS_SPY__) {
    return { ok: true, already: true, mirror: mirror, cbs: cbs };
  }
  if (typeof Map !== "function" || typeof Map.prototype.get !== "function") {
    return { ok: false, reason: "no-map" };
  }
  var origGet = Map.prototype.get;
  Map.prototype.get = function spineSpyMapGet(k) {
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
        for (var j = 0; j < cbs.length; j++) {
          try { cbs[j](id, rec, r); } catch (e2) {}
        }
      }
    } catch (e3) {}
    return r;
  };
  g.__SPINE_MODS_SPY__ = 1;
  return { ok: true, mirror: mirror, cbs: cbs };
}


function seedMirror() {
  var g = G();
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

  
  try {
    setTimeout(function () {
      if (!done) {
        for (; i <= MAX; i++) {
          if (out.ms > TIME_CAP) {
            break;
          }
          if (!step(i)) {
            break;
          }
        }
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
        for (; i <= MAX; i++) {
          if (out.ms > TIME_CAP) {
            break;
          }
          if (!step(i)) {
            break;
          }
        }
        out.cache = !cacheGot ? "miss" : "stale";
        finishScan();
      }).catch(function () {
        for (; i <= MAX; i++) {
          if (out.ms > TIME_CAP) {
            break;
          }
          if (!step(i)) {
            break;
          }
        }
        out.cache = "miss";
        finishScan();
      });
    } else {
      for (; i <= MAX; i++) {
        if (out.ms > TIME_CAP) {
          break;
        }
        if (!step(i)) {
          break;
        }
      }
      out.cache = "miss";
      finishScan();
    }
  } catch (e) {
    for (; i <= MAX; i++) {
      if (out.ms > TIME_CAP) {
        break;
      }
      if (!step(i)) {
        break;
      }
    }
    out.cache = "miss";
    finishScan();
  }

  return out;
}

function installPreHooks() {
  var g = G();
  if (!g || typeof g.__r !== "function") {
    return { ok: false, reason: "no-runtime" };
  }
  try {
    var PRE = (g.__SPINE_PRE__ = g.__SPINE_PRE__ || {});
    var st = (PRE.settings = PRE.settings || {
      token: PRE_TOKEN,
      Orig: null,
      Wrapped: null,
      build: null,
      renders: 0,
      hooked: false,
      exps: null,
      defaultOk: false,
      defaultErr: "-"
    });
    var steps = [];
    var spy = installModuleSpy();
    steps.push("spy=" + (spy.ok ? (spy.already ? "ja" : "ok") : "ERR"));
    
    
    
    
    if (!PRE.settingsCb) {
      PRE.settingsCb = 1;
      spy.cbs.push(function hookRecord(id, rec) {
        var ex = rec.exports;
        if (!ex || typeof ex !== "object") return;
        if (!st.hooked && typeof ex.jsx === "function" && typeof ex.jsxs === "function" && typeof ex.createElement !== "function") {
          var r = hookJsxExports(ex, st);
          if (r.hooked) {
            st.hooked = true;
            steps.push("jsx:" + id);
          }
        }
        if (!st.Orig && !st.Wrapped) {
          var Orig = interopEx(ex);
          if (Orig && typeof Orig === "function" && (Orig.name === "SettingsPage" || Orig.displayName === "SettingsPage")) {
            st.exps = ex;
            st.Orig = Orig;
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
            var setRes = trySetDefault(ex, proxy);
            st.defaultOk = setRes.ok;
            st.defaultErr = setRes.ok ? null : setRes.reason;
            steps.push("default=" + (setRes.ok ? "ok" : ("ERR " + setRes.reason)));
          }
        }
      });
    }
    return { ok: !!st.Orig || st.hooked, steps: steps };
  } catch (e) {
    return { ok: false, reason: (e && e.message) || String(e) };
  }
}


var fsMemo = null;
function findFS() {
  if (fsMemo) {
    return fsMemo;
  }
  var g = G();
  var out = null;
  function pick(s) {
    if (!s || out) return;
    if (isFS(s)) {
      out = unwrapFS(s);
    }
  }
  try { pick(g.ExpoFileSystem); } catch (e) {}
  try { pick(g.FileSystem); } catch (e) {}
  if (!out) {
    try {
      var pre = g.__SPINE_PRE__;
      var mods = pre && pre.mods;
      if (mods) {
        for (var k in mods) {
          try { pick(mods[k] && mods[k].exports); } catch (e2) {}
          if (out) break;
        }
      }
    } catch (e3) {}
  }
  if (!out) {
    
    try {
      var rt = scanRuntime();
      if (rt.fs) {
        out = rt.fs;
      }
    } catch (e4) {}
  }
  if (out) {
    fsMemo = out;
  }
  return out;
}


var runtimeMemo = { store: null, fs: null };
function scanRuntime() {
  var g = G();
  var req = null;
  try { req = g.__r; } catch (e) {}
  if (typeof req !== "function") {
    return runtimeMemo;
  }
  var i = 0;
  var misses = 0;
  var t0 = Date.now();
  var MAX = 65535;
  var MISS_LIMIT = 300;
  var TIME_CAP = 2500;
  while (i <= MAX && (Date.now() - t0) < TIME_CAP && misses < MISS_LIMIT) {
    var ex = null;
    try {
      ex = req(i);
    } catch (e) {
      misses++;
      i++;
      continue;
    }
    misses = 0;
    if (!runtimeMemo.store && isSL(ex)) {
      runtimeMemo.store = unwrapSL(ex);
    }
    if (!runtimeMemo.fs && isFS(ex)) {
      runtimeMemo.fs = unwrapFS(ex);
    }
    if (runtimeMemo.store && runtimeMemo.fs) {
      break;
    }
    i++;
  }
  return runtimeMemo;
}

function scanForStore() {
  var rt = scanRuntime();
  if (rt.store) return rt.store;
  try {
    var s = findStore();
    if (s) rt.store = s;
  } catch (e) {}
  return rt.store;
}

function fsDir() {
  var fs = findFS();
  if (!fs) {
    return null;
  }
  try {
    if (fs.documentDirectory) {
      return fs.documentDirectory + FS_FOLDER;
    }
  } catch (e) {}
  return null;
}

function readStoredFS() {
  var fs = findFS();
  var dir = fsDir();
  if (!fs || !dir) {
    return Promise.resolve(null);
  }
  var file = dir + FS_BUNDLE_FILE;
  try {
    return fs.getInfoAsync(file).then(function (info) {
      if (!info || !info.exists) {
        return null;
      }
      return fs.readAsStringAsync(file).then(function (code) {
        if (code && typeof code === "string" && code.length > 100) {
          return { code: code, via: "fs" };
        }
        return null;
      }).catch(function () {
        return null;
      });
    }).catch(function () {
      return null;
    });
  } catch (e) {
    return Promise.resolve(null);
  }
}

function readStored() {
  return readStoredFS().then(function (fsr) {
    if (fsr) {
      return fsr;
    }
    var s = findStore();
    if (!s || typeof s.getItem !== "function") {
      return null;
    }
    try {
      return s.getItem(BUNDLE_KEY).then(function (v) {
        if (v && typeof v === "string" && v.length > 100) {
          return { code: v, via: "as" };
        }
        return null;
      }).catch(function () {
        return null;
      });
    } catch (e) {
      return null;
    }
  });
}

function saveStoredFS(code) {
  var fs = findFS();
  var dir = fsDir();
  if (!fs || !dir) {
    return Promise.resolve(false);
  }
  var file = dir + FS_BUNDLE_FILE;
  var meta = JSON.stringify({ at: Date.now(), len: code.length, via: "fs" });
  var ensure = null;
  try {
    ensure = fs.getInfoAsync(dir).then(function (info) {
      if (info && info.exists) {
        return true;
      }
      if (typeof fs.makeDirectoryAsync === "function") {
        return fs.makeDirectoryAsync(dir, { intermediates: true }).then(function () { return true; }).catch(function () { return false; });
      }
      return true;
    }).catch(function () {
      return true;
    });
  } catch (e) {
    ensure = Promise.resolve(true);
  }
  return ensure.then(function () {
    return Promise.all([
      fs.writeAsStringAsync(file, code).then(function () { return true; }).catch(function () { return false; }),
      fs.writeAsStringAsync(dir + FS_META_FILE, meta).then(function () { return true; }).catch(function () { return false; })
    ]).then(function (r) {
      return !!(r[0]);
    });
  });
}

function saveStored(code) {
  return saveStoredFS(code).then(function (fsOk) {
    if (fsOk) {
      return true;
    }
    var s = findStore();
    if (!s || typeof s.setItem !== "function") {
      return false;
    }
    var meta = JSON.stringify({ at: Date.now(), len: code.length });
    return Promise.all([
      s.setItem(BUNDLE_KEY, code).catch(function () { return false; }),
      s.setItem(BUNDLE_META_KEY, meta).catch(function () { return false; })
    ]).then(function (r) {
      return !!(r[0]);
    });
  });
}

function fetchLatest() {
  var url = BUNDLE_PATH + "?ts=" + Date.now();
  var ctl = null;
  var timer = null;
  try {
    if (typeof AbortController !== "undefined") {
      ctl = new AbortController();
      timer = setTimeout(function () { try { ctl.abort(); } catch (e) {} }, 10000);
    }
  } catch (e) {}
  var opts = { headers: { Accept: "application/javascript" } };
  if (ctl) {
    opts.signal = ctl.signal;
  }
  return G().fetch(url, opts)
    .then(function (r) {
      try { clearTimeout(timer); } catch (e) {}
      if (!r || !r.ok) throw new Error("HTTP " + (r && r.status));
      return r.text();
    })
    .then(function (code) {
      return { code: code, base: GITHUB_RAW };
    })
    .catch(function (err) {
      try { clearTimeout(timer); } catch (e) {}
      throw err;
    });
}

function execFresh(fresh) {
  var code = fresh.code;
  return readStored().then(function (stored) {
    if (stored && stored.code === code) {
      var okSame = exec(stored.code);
      if (okSame) {
        return code.length;
      }
      return code.length;
    }
    var ok = exec(code);
    if (ok) {
      return saveStored(code).then(function () { return code.length; });
    }
    if (stored && stored.code) {
      var ok2 = exec(stored.code);
      if (ok2) {
        return stored.code.length;
      }
    }
    return 0;
  });
}

function runBundle() {
  var g = G();
  if (runBusy) {
    return Promise.resolve(0);
  }
  runBusy = true;
  function done(v) {
    runBusy = false;
    return v;
  }
  return shouldRun().then(function (run) {
    if (!run) return done(0);
    if (g.SPINE && g.SPINE.booted) return done(0);
    if (g.__SPINE_EXEC_TS__ && (Date.now() - g.__SPINE_EXEC_TS__) < 10000) return done(0);
    try {
      scanRuntime();
      if (!runtimeMemo.store) runtimeMemo.store = findStore();
      if (!runtimeMemo.fs) runtimeMemo.fs = findFS();
    } catch (e) {}
    return fetchLatest().then(function (fresh) {
      if (fresh && fresh.code) {
        return execFresh(fresh).then(done);
      }
      return readStored().then(function (stored) {
        if (stored && stored.code) {
          var okStored = exec(stored.code);
          if (okStored) {
            return done(stored.code.length);
          }
          return done(0);
        }
        return done(0);
      });
    }).catch(function (err) {
      return readStored().then(function (stored) {
        if (stored && stored.code) {
          var okStored = exec(stored.code);
          if (okStored) {
            return done(stored.code.length);
          }
          return done(0);
        }
        return done(0);
      });
    });
  }).catch(function (err) {
    warn(err);
    return done(0);
  });
}

function exec(code) {
  try {
    new Function(code)();
    try {
      G().__SPINE_EXEC_TS__ = Date.now();
    } catch (e) {}
    return true;
  } catch (e) {
    warn(e);
    return false;
  }
}

function warn(err) {
  try {
    if (G().console && G().console.warn) {
      G().console.warn("[SPINE] loader warn: " + (err && err.message ? err.message : err));
    }
  } catch (e) {}
}

try {
  installPreHooks();
} catch (e) {}

if (timing(runBundle, 300)) {
  runBundle = null;
} else {
  runBundle();
}
runBundle = runBundle || function () { return Promise.resolve({ tracks: [], total: 0 }); };

function silenceTrack(id) {
  var base = SILENCE_PATH + "?ts=" + Date.now();
  return {
    id: String(id),
    name: "paras8 (silence)",
    album: "paras8 Mod",
    artist: "paras8",
    uri: base,
    source: "paras8-liver",
    streamUrl: base,
    streamType: "direct",
    isStreaming: true,
    audioQuality: "low",
    bitrate: 128,
    bitDepth: 16,
    codec: "pcm_s16le",
    noStreamCache: true,
    isManualMatch: true
  };
}

return {
  id: "paras8-liver",
  name: "paras8",
  author: "Livie",
  version: "0.10.2",
  description: "paras8 loader",
  labels: ["loader"],
  automaticStreaming: false,
  noPrefetch: true,
  noStreamCache: true,
  searchTracks: function (q, limit, ctx) {
    timing(runBundle, 0);
    return Promise.resolve({ tracks: [], total: 0 });
  },
  getTrackStreamUrl: function (id, los, src) {
    return Promise.resolve(silenceTrack(id));
  },
  getTrackDownloadUrl: function (id, los, src) {
    return Promise.resolve(silenceTrack(id));
  }
};
