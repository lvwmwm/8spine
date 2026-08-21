(function () {
  "use strict";

  SPINE.registerMod("settings-spine-row", function (spine) {
    var find = spine.metro.find;
    var findAll = spine.metro.findAll;
    var byName = spine.metro.byName;
    var ui = spine.ui;

    var g = (typeof globalThis !== "undefined") ? globalThis : ((typeof global !== "undefined") ? global : window);

    var LYR = null;
    try {
      LYR = ((g.__SPINE_PRE__ = g.__SPINE_PRE__ || {})).lyrics = ((g.__SPINE_PRE__).lyrics || {
        on: true,
        orig: null,
        view: null,
        state: "idle"
      });
    } catch (e) {
      LYR = { on: true, orig: null, view: null, state: "idle" };
    }

    var JSX_MATCH = function (exps) {
      
      
      return exps && typeof exps === "object" && typeof exps.jsx === "function" && typeof exps.jsxs === "function" &&
        typeof exps.createElement !== "function";
    };
    var TOKEN = Symbol.for("spine.settings.injected");

    function sig2(props, type) {
      try {
        if (props && props.track !== undefined && typeof props.currentTime === "number" &&
          props.duration !== undefined && typeof props.onSeek === "function") return true;
      } catch (e) {}
      try {
        var tn = "";
        if (typeof type === "function") tn = type.name || type.displayName || "";
        else if (type && typeof type === "object" && type.type && typeof type.type === "function") {
          tn = type.type.name || type.type.displayName || "";
        }
        if (tn === "LyricsView") return true;
      } catch (e2) {}
      return false;
    }

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
          st.jsxSeen = (st.jsxSeen || 0) + 1;
          if (st.Orig && type === st.Orig) {
            st.renders++;
            var W = st.Wrapped || null;
            if (!W && typeof st.build === "function") {
              try { W = st.build(); } catch (eB) { W = null; }
            }
            if (W && W !== type) type = W;
          }
          if (LYR && !LYR.orig && props) {
            try {
              var hit = false;
              for (var qk in props) {
                if (qk === "children") continue;
                if (/lyric/i.test(qk)) { hit = true; break; }
              }
              var tnm = "";
              try {
                if (typeof type === "function") tnm = type.displayName || type.name || "";
                else if (type && typeof type === "object" && type.type && typeof type.type === "function") {
                  tnm = type.type.displayName || type.type.name || "";
                }
              } catch (e5) {}
              if (!hit && /lyric/i.test(tnm)) hit = true;
              if (hit) {
                var arr = (g.__SPINE_LYRIC_SEEN__ = g.__SPINE_LYRIC_SEEN__ || []);
                var pks = [];
                try { for (var pk2 in props) { pks.push(pk2); if (pks.length > 14) break; } } catch (e6) {}
                if (arr.length < 24) {
                  arr.push({ n: tnm || "(anon)", p: pks.join(",") });
                }
                if (tn === "LyricsView" || sig2(props, type)) {
                  LYR.orig = type;
                  try { LYR.view = LYR.view || buildLyricsView(spine); } catch (eV2) {}
                  if (LYR.view) {
                    LYR.state = "installed";
                    LYR.via = "jsx-probe";
                  }
                  try { spine.log("lyrics", "captured via jsx probe: " + tnm); } catch (eL2) {}
                }
              }
            } catch (eQ) {}
          }
          if (LYR && LYR.on && type === LYR.orig) {
            var LV = LYR.view;
            if (LV && LV !== type) {
              type = LV;
              st.renders++;
            }
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
      var list = [];
      try {
        list = spine.metro.findAll(JSX_MATCH) || [];
      } catch (e) {}
      if (!list.length) {
        try {
          var f0 = spine.metro.scanDirect(JSX_MATCH);
          if (f0) list = [f0];
        } catch (e2) {}
      }
      if (!list.length) {
        out.stages.push("jsx:nao-encontrado");
        return out;
      }
      for (var i = 0; i < list.length; i++) {
        var r = hookJsxExports(list[i].module, st);
        out.stages.push("jsx[" + (list[i].id || i) + "]:" + r.stages.join("/"));
        if (r.hooked) out.hooked = true;
      }
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

    
    
    
    
    
    
    
    function buildLyricsSection(spine, route, ctx) {
      var R = ui.react();
      if (!R || typeof R.createElement !== "function" || typeof R.useState !== "function") {
        return null;
      }
      return R.createElement(LyricsSection, { spine: spine, route: route, ctx: ctx });
    }

    function LyricsSection(props) {
      var R = ui.react();
      var spine = props.spine;
      var ctx = props.ctx;
      var theme = ctx.theme;
      var styles = ctx.styles;
      var h = ctx.h;
      var RN = ctx.RN;
      var pressType = ctx.pressType;
      var L = ctx.L;
      var Ion = ctx.Ion;

      function mk(key, dflt) {
        var s = R.useState(function () {
          var v = dflt;
          try {
            var x = spine.prefs.get(key, dflt);
            if (x !== undefined && x !== null) v = x;
          } catch (e) {}
          return v;
        });
        return { key: key, value: s[0], set: s[1] };
      }

      var enabled = mk("lyricsView", true);
      var glow = mk("lyricsGlow", true);
      var fade = mk("lyricsFade", true);
      var bg = mk("lyricsBg", true);
      var clearState = R.useState(null);
      var clearInfo = clearState[0];
      var setClearInfo = clearState[1];
      var diagState = R.useState(function () {
        try {
          var parts = [];
          parts.push("jsx:" + (st.hooked ? "ok" : "NO"));
          parts.push("elems:" + (st.jsxSeen || 0));
          var seen = g.__SPINE_LYRIC_SEEN__;
          if (seen && seen.length) {
            var s0 = [];
            for (var si = 0; si < seen.length && si < 3; si++) s0.push(seen[si].n + "{" + seen[si].p + "}");
            parts.push("seen[" + seen.length + "] " + s0.join(" | "));
          } else {
            parts.push("seen:0");
          }
          parts.push("deep:" + ((LYR && LYR.deep) || "-") + "/" + ((LYR && LYR.deepHooks) || 0));
          var mm = null;
          try { mm = spine.metro.mirror() || {}; } catch (em2) {}
          var found = [];
          for (var mk in mm) {
            var rec = mm[mk];
            var ex = rec && rec.exports;
            if (!ex || typeof ex !== "object") continue;
            var dv = (ex.__esModule && ex.default !== undefined) ? ex.default : ex;
            var tv = "";
            var kind = typeof dv;
            if (kind === "function") tv = dv.displayName || dv.name || "";
            else if (dv && typeof dv === "object" && dv.type && typeof dv.type === "function") {
              kind = "memo";
              tv = dv.type.displayName || dv.type.name || "";
            }
            if (/lyric/i.test(tv) || /lyric/i.test(String(mk))) {
              found.push(mk + ":" + kind + ":" + (tv || "?"));
              if (found.length > 8) break;
            }
          }
          parts.push("mirror: " + (found.length ? found.join(" | ") : "nenhum"));
          return parts.join(" | ");
        } catch (eD2) {
          return "diag-err: " + ((eD2 && eD2.message) || eD2);
        }
      });
      var diag = diagState[0];

      function setOn(t, v) {
        t.set(v);
        try {
          spine.prefs.set(t.key, v);
        } catch (e) {}
        if (t === enabled) {
          try { if (LYR) LYR.on = !!v; } catch (e2) {}
        }
      }

      function rowStyle() {
        return [
          styles.settingsRowGrouped,
          styles.settingsRowFirst,
          styles.settingsRowLast,
          { borderBottomWidth: 0, backgroundColor: theme.card, flexDirection: "row", alignItems: "center" }
        ];
      }

      function switchRow(t, title) {
        return h(RN.View, { key: "lyr-sw-" + t.key, style: rowStyle() }, [
          h(RN.View, { style: { flex: 1, paddingRight: 12 } }, [
            h(RN.Text, { style: [styles.settingsRowText, { color: theme.primaryText }], children: title })
          ]),
          h(RN.Switch, {
            value: t.value === true,
            onValueChange: function (v) { setOn(t, v); }
          })
        ]);
      }

      function onClear() {
        if (clearInfo === "busy") return;
        setClearInfo("busy");
        var fn = null;
        try {
          spine.metro.find(function (ex) {
            if (ex && typeof ex.clearLyricsCache === "function") {
              fn = ex.clearLyricsCache;
              return true;
            }
            return false;
          });
        } catch (e) {}
        if (!fn) {
          setClearInfo("err:clearLyricsCache not found");
          return;
        }
        var p = null;
        try {
          p = fn();
        } catch (e) {
          setClearInfo("err:" + ((e && e.message) || String(e)));
          return;
        }
        if (p && typeof p.then === "function") {
          p.then(function () { setClearInfo("ok"); }, function (e) {
            setClearInfo("err:" + ((e && e.message) || String(e)));
          });
        } else {
          setClearInfo("ok");
        }
      }

      var clearLabel = null;
      if (clearInfo === "busy") clearLabel = "Clearing\u2026";
      else if (clearInfo === "ok") clearLabel = "Lyrics cache cleared";
      else if (clearInfo && clearInfo.indexOf("err:") === 0) clearLabel = "Failed \u2013 " + clearInfo.slice(4);

      var clearRow = h(pressType, {
        key: "lyr-clear",
        style: rowStyle(),
        onPress: onClear
      }, [
        h(RN.View, { style: { flex: 1, paddingRight: 12 } }, [
          h(RN.Text, { style: [styles.settingsRowText, { color: theme.primaryText }], children: "Clear lyrics cache" }),
          clearLabel ? h(RN.Text, {
            style: { fontSize: 12, color: (clearInfo === "ok" ? "#34C759" : theme.secondaryText), marginTop: 2 },
            children: clearLabel
          }) : null
        ]),
        (Ion && Ion.Ionicons) ? h(Ion.Ionicons, { name: "chevron-forward", size: 20, color: theme.secondaryText }) : null
      ].filter(function (x) { return x !== null; }));

      var rows = [
        switchRow(enabled, "Custom lyrics view"),
        switchRow(glow, "Glow effect"),
        switchRow(fade, "Fade mask"),
        switchRow(bg, "Artwork background"),
        clearRow,
        h(RN.View, { key: "lyr-status", style: rowStyle() }, [
          h(RN.Text, {
            style: { fontSize: 12, color: theme.secondaryText },
            children: "engine: " + (LYR ? LYR.state : "?") +
              " | orig: " + (LYR && LYR.orig ? "ok" : "-") +
              " | view: " + (LYR && LYR.view ? "ok" : "-") +
              " | swap: " + ((LYR && LYR.swap) || "-") +
              " | via: " + ((LYR && LYR.via) || "-")
          })
        ]),
        h(RN.View, { key: "lyr-diag", style: rowStyle() }, [
          h(RN.Text, {
            style: { fontSize: 11, color: theme.secondaryText },
            children: diag
          })
        ])
      ];
      var group = (L && L.SettingsGroup) ? h(L.SettingsGroup, { theme: theme, children: rows }) : rows;
      return h(RN.View, {
        style: styles.settingsSection,
        children: [
          h(RN.Text, {
            style: [styles.settingsSectionTitle, { color: theme.secondaryText, marginLeft: 16, marginBottom: 8 }],
            children: "Lyrics"
          }),
          group
        ]
      });
    }

    function buildLyricsView(spine) {
      var R = ui.react();
      if (!R || typeof R.useState !== "function" || typeof R.useEffect !== "function" || typeof R.useRef !== "function") {
        return null;
      }
      var RN = ui.rn();
      if (!RN) return null;
      var h = ui.h;
      var useState = R.useState;
      var useEffect = R.useEffect;
      var useRef = R.useRef;
      var Animated = null;
      try { Animated = RN.Animated || null; } catch (e) {}
      var ScrollView = null;
      try { ScrollView = (typeof RN.ScrollView === "function") ? RN.ScrollView : null; } catch (e) {}
      var Image = null;
      try { Image = (typeof RN.Image === "function") ? RN.Image : null; } catch (e) {}
      var Text = null;
      try { Text = (typeof RN.Text === "function") ? RN.Text : null; } catch (e) {}
      var View = null;
      try { View = (typeof RN.View === "function") ? RN.View : null; } catch (e) {}
      if (!Text || !View) return null;

      var LINE_H = 44;
      var PAD = 140;

      function api() {
        var out = { fetch: null, parse: null };
        try {
          spine.metro.find(function (ex) {
            if (ex && typeof ex.fetchAndCacheLyrics === "function" && !out.fetch) {
              out.fetch = ex.fetchAndCacheLyrics;
            }
            if (ex && typeof ex.parseLrc === "function" && !out.parse) {
              out.parse = ex.parseLrc;
            }
            return !!(out.fetch && out.parse);
          });
        } catch (e) {}
        return out;
      }

      function prefs() {
        var out = { glow: true, fade: true, bg: true };
        try {
          var p = spine.prefs;
          if (p && typeof p.get === "function") {
            if (p.get("lyricsGlow", true) === false) out.glow = false;
            if (p.get("lyricsFade", true) === false) out.fade = false;
            if (p.get("lyricsBg", true) === false) out.bg = false;
          }
        } catch (e) {}
        return out;
      }

      function LyricsView(props) {
        var p = props || {};
        var t0 = p.track || p;
        var track = t0 || {};
        var trackKey = "";
        try {
          trackKey = String(track.id || track.key || track.isrc || track.uri || "");
        } catch (e) {}
        var currentTime = (typeof p.currentTime === "number") ? p.currentTime : 0;
        var textColor = p.textColor || "#ffffff";
        var showBackground = p.showBackground === true;
        var imageUrl = p.imageUrl || null;
        var pf = prefs();

        var loadingState = useState(true);
        var loading = loadingState[0];
        var setLoading = loadingState[1];
        var textState = useState("");
        var text = textState[0];
        var setText = textState[1];
        var linesState = useState([]);
        var lines = linesState[0];
        var setLines = linesState[1];
        var boxState = useState(0);
        var boxH = boxState[0];
        var setBoxH = boxState[1];
        var scroll = useRef(null);
        var lastIdx = useRef(-1);
        var glowAnim = useRef(null);

        useEffect(function () {
          var cancelled = false;
          var a = api();
          setLoading(true);
          setLines([]);
          setText("");
          if (a.fetch && track) {
            var q = null;
            try { q = spineLyricsFetch(track, a.fetch); } catch (e) { q = null; }
            if (q && typeof q.then === "function") {
              q.then(function (lrc) {
                if (cancelled) return;
                setLoading(false);
                if (!lrc || typeof lrc !== "string" || !lrc.length) {
                  setText("");
                  setLines([]);
                  return;
                }
                setText(lrc);
                if (/\[\d{1,3}:\d{2}/.test(lrc) && a.parse) {
                  try {
                    var arr = a.parse(lrc);
                    setLines(Array.isArray(arr) ? arr : []);
                  } catch (e) { setLines([]); }
                } else {
                  setLines([]);
                }
              }, function () {
                if (cancelled) return;
                setLoading(false);
                setText("");
                setLines([]);
              });
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
          return function () { cancelled = true; };
        }, [trackKey]);

        useEffect(function () {
          if (!pf.glow || !Animated || glowAnim.current) return;
          try {
            var v = new Animated.Value(0.35);
            glowAnim.current = v;
            var loop = Animated.loop(Animated.sequence([
              Animated.timing(v, { toValue: 0.8, duration: 1100, useNativeDriver: true }),
              Animated.timing(v, { toValue: 0.35, duration: 1100, useNativeDriver: true })
            ]));
            loop.start();
            return function () {
              try { loop.stop(); } catch (e) {}
            };
          } catch (e) {}
        }, []);

        var idx = -1;
        for (var i = 0; i < lines.length; i++) {
          var tm = lines[i] && lines[i].time;
          if (typeof tm === "number" && tm <= currentTime) idx = i;
        }

        useEffect(function () {
          if (idx < 0 || !scroll.current || idx === lastIdx.current) return;
          lastIdx.current = idx;
          var y = Math.max(0, idx * LINE_H - (boxH / 2 - LINE_H / 2));
          try {
            if (typeof scroll.current.scrollTo === "function") {
              scroll.current.scrollTo({ y: y, animated: true });
            }
          } catch (e) {}
        }, [idx, boxH]);

        var children = [];
        var bgColor = "rgba(14,14,22,0.92)";
        if (p.backgroundColor && p.backgroundColor !== "transparent") {
          bgColor = p.backgroundColor;
        }
        children.push(h(View, { key: "lyr-bg", style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: bgColor } }));
        if (showBackground && imageUrl && Image && pf.bg) {
          children.push(h(Image, { key: "lyr-art", source: { uri: imageUrl }, resizeMode: "cover", style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.16 } }));
          children.push(h(View, { key: "lyr-art-shade", style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(8,8,16,0.55)" } }));
        }
        if (pf.glow && Animated && glowAnim.current && idx >= 0) {
          children.push(h(Animated.View, {
            key: "lyr-glow",
            pointerEvents: "none",
            style: { position: "absolute", left: "10%", right: "10%", top: Math.max(20, boxH / 2 - 62), height: 124, borderRadius: 62, backgroundColor: "rgba(255,255,255,0.10)", opacity: glowAnim.current }
          }));
        }
        if (pf.fade) {
          children.push(h(View, { key: "lyr-fade-t", pointerEvents: "none", style: { position: "absolute", top: 0, left: 0, right: 0, height: 80, backgroundColor: "rgba(14,14,22,0.66)" } }));
          children.push(h(View, { key: "lyr-fade-b", pointerEvents: "none", style: { position: "absolute", bottom: 0, left: 0, right: 0, height: 80, backgroundColor: "rgba(14,14,22,0.66)" } }));
        }

        var lineEls = [];
        if (lines.length) {
          for (var j = 0; j < lines.length; j++) {
            var line = lines[j];
            var txt = (line && line.text) ? line.text : "";
            if (!txt) continue;
            var active = j === idx;
            var lineStyle = {
              fontSize: active ? 26 : 17,
              lineHeight: LINE_H,
              textAlign: "center",
              color: textColor,
              opacity: active ? 1 : 0.42,
              fontWeight: active ? "700" : "400",
              paddingHorizontal: 26
            };
            if (active) {
              lineStyle.textShadowColor = "rgba(255,255,255,0.55)";
              lineStyle.textShadowRadius = 18;
              lineStyle.textShadowOffset = { width: 0, height: 0 };
            }
            lineEls.push(h(Text, { key: "lyr-line-" + j, style: lineStyle, children: txt }));
          }
        } else if (loading) {
          lineEls.push(h(Text, { key: "lyr-loading", style: { fontSize: 15, color: textColor, opacity: 0.5, textAlign: "center" }, children: "Loading lyrics\u2026" }));
        } else if (text) {
          lineEls.push(h(Text, { key: "lyr-plain", style: { fontSize: 16, lineHeight: 26, color: textColor, opacity: 0.8, textAlign: "center", paddingHorizontal: 28 }, children: text }));
        } else {
          lineEls.push(h(Text, { key: "lyr-empty", style: { fontSize: 15, color: textColor, opacity: 0.5, textAlign: "center" }, children: "Lyrics not available" }));
        }

        var scrollEl = null;
        if (ScrollView && lines.length) {
          scrollEl = h(ScrollView, {
            ref: scroll,
            style: { flex: 1 },
            contentContainerStyle: { paddingTop: PAD, paddingBottom: PAD },
            showsVerticalScrollIndicator: false,
            onLayout: function (e) {
              try {
                var hh = e.nativeEvent && e.nativeEvent.layout && e.nativeEvent.layout.height;
                if (hh && hh !== boxH) setBoxH(hh);
              } catch (e2) {}
            }
          }, lineEls);
        } else {
          scrollEl = h(View, { style: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 } }, lineEls);
        }
        children.push(scrollEl);
        return h(View, { style: { flex: 1, overflow: "hidden" } }, children);
      }

      return LyricsView;
    }

    function makeLyricsProxy(LYR) {
      var hFn = null;
      try { hFn = ui.h; } catch (e0) {}
      var oname = "LyricsView";
      try {
        if (LYR.orig) {
          if (typeof LYR.orig === "function") {
            oname = LYR.orig.name || LYR.orig.displayName || oname;
          } else if (LYR.orig.type && typeof LYR.orig.type === "function") {
            oname = LYR.orig.type.displayName || LYR.orig.type.name || oname;
          }
        }
      } catch (en) {}
      var proxy = function (props) {
        if (LYR.on && LYR.view) {
          try {
            return LYR.view(props);
          } catch (eL) {
            try { spine.error("lyrics.view", eL); } catch (e2) {}
          }
        }
        if (LYR.orig) {
          try {
            if (typeof LYR.orig === "function") return LYR.orig(props);
            if (typeof hFn === "function") return hFn(LYR.orig, props);
          } catch (e3) {}
        }
        return null;
      };
      try {
        Object.defineProperty(proxy, "name", {
          value: oname,
          configurable: true
        });
        Object.defineProperty(proxy, "displayName", {
          value: oname,
          configurable: true
        });
      } catch (e) {}
      proxy.__spineLyricsProxy = true;
      return proxy;
    }

    var LYR_FETCH_MEMO = {};
    function lyrFmtTs(ms) {
      var m = Math.floor(ms / 60000);
      var s = Math.floor((ms % 60000) / 1000);
      var cs = Math.floor((ms % 1000) / 10);
      return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s + "." + (cs < 10 ? "0" : "") + cs;
    }
    function lyrTtmlMs(v) {
      try {
        if (v === null || v === undefined) return NaN;
        var s = String(v).trim();
        if (s.charAt(s.length - 1) === "s") s = s.slice(0, -1);
        var parts = s.split(":");
        var sec = 0;
        for (var i = 0; i < parts.length; i++) {
          var f = parseFloat(parts[i]);
          if (isNaN(f)) return NaN;
          sec = sec * 60 + f;
        }
        return Math.round(sec * 1000);
      } catch (e) {
        return NaN;
      }
    }
    function lyrDecEnt(s) {
      return String(s)
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
    }
    function lyrTtmlToLrc(xml) {
      try {
        if (!xml || typeof xml !== "string" || xml.indexOf("<") === -1) return "";
        var out = [];
        var pre = /<p\b[^>]*\bbegin="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g;
        var m = null;
        while ((m = pre.exec(xml)) !== null) {
          var attrs = m[0].slice(0, m[0].indexOf(">") + 1);
          var ab = /\bbegin="([^"]+)"/.exec(attrs);
          var ae = /\bend="([^"]+)"/.exec(attrs);
          if (!ab) continue;
          var ls = lyrTtmlMs(ab[1]);
          var le = ae ? lyrTtmlMs(ae[1]) : NaN;
          if (isNaN(ls)) continue;
          var body = m[2];
          var words = [];
          var spre = /<span\b([^>]*)>([\s\S]*?)<\/span>/g;
          var sm = null;
          var hasSpans = false;
          while ((sm = spre.exec(body)) !== null) {
            var wab = /\bbegin="([^"]+)"/.exec(sm[1]);
            var txt = lyrDecEnt(sm[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
            if (!txt) continue;
            hasSpans = true;
            var ws = wab ? lyrTtmlMs(wab[1]) : ls;
            words.push("<" + lyrFmtTs(isNaN(ws) ? ls : ws) + ">" + txt);
          }
          if (!hasSpans) {
            var lineTxt = lyrDecEnt(body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
            if (!lineTxt) continue;
            out.push("[" + lyrFmtTs(ls) + "]" + lineTxt);
          } else {
            out.push("[" + lyrFmtTs(ls) + "]" + words.join("") + (isNaN(le) ? "" : "<" + lyrFmtTs(le) + ">"));
          }
        }
        return out.join("\n");
      } catch (e) {
        return "";
      }
    }
    function lyrWordJsonToLrc(j) {
      try {
        var lines = null;
        if (j && Array.isArray(j.lyrics)) lines = j.lyrics;
        else if (j && j.data && Array.isArray(j.data.lyrics)) lines = j.data.lyrics;
        else if (Array.isArray(j)) lines = j;
        if (!lines || !lines.length) return "";
        var num = function (o, keys) {
          for (var i = 0; i < keys.length; i++) {
            if (o && typeof o[keys[i]] === "number") return o[keys[i]];
          }
          return NaN;
        };
        var out = [];
        for (var i = 0; i < lines.length; i++) {
          var ln = lines[i];
          if (!ln || typeof ln !== "object") continue;
          var ls = num(ln, ["startTime", "start", "begin", "time"]);
          if (isNaN(ls)) continue;
          if (ls % 1 !== 0) ls = Math.round(ls * 1000);
          var le = num(ln, ["endTime", "end", "finish"]);
          var ws = null;
          if (Array.isArray(ln.words)) ws = ln.words;
          else if (Array.isArray(ln.syllables)) ws = ln.syllables;
          else if (Array.isArray(ln.data)) ws = ln.data;
          var parts = [];
          if (ws) {
            for (var k = 0; k < ws.length; k++) {
              var w = ws[k];
              var wt = null;
              if (typeof w === "string") wt = w;
              else if (w && typeof w === "object") {
                if (typeof w.word === "string") wt = w.word;
                else if (typeof w.text === "string") wt = w.text;
                else if (typeof w.token === "string") wt = w.token;
                else if (typeof w.data === "string") wt = w.data;
              }
              if (!wt) continue;
              var wst = num(w || {}, ["startTime", "start", "begin", "time"]);
              if (isNaN(wst)) wst = ls;
              else if (wst % 1 !== 0) wst = Math.round(wst * 1000);
              parts.push("<" + lyrFmtTs(wst) + ">" + wt);
            }
          }
          if (!parts.length) {
            var lt = (typeof ln.text === "string" && ln.text) || (typeof ln.line === "string" && ln.line) ||
              (typeof ln.data === "string" && ln.data) || "";
            if (!lt) continue;
            out.push("[" + lyrFmtTs(ls) + "]" + lt);
          } else {
            out.push("[" + lyrFmtTs(ls) + "]" + parts.join("") + (isNaN(le) ? "" : "<" + lyrFmtTs(le) + ">"));
          }
        }
        return out.join("\n");
      } catch (e) {
        return "";
      }
    }
    function lyrTrackInfo(track) {
      var name = "";
      var artist = "";
      var album = "";
      var dur = 0;
      var isrc = "";
      try {
        name = (track && (track.name || track.title)) || "";
        var a = track && track.artist;
        artist = (typeof a === "string") ? a : ((a && (a.name || a.title)) || "");
        var al = track && track.album;
        album = (typeof al === "string") ? al : ((al && (al.title || al.name)) || "");
        dur = (track && typeof track.duration === "number") ? track.duration : 0;
        if (dur > 10000) dur = Math.round(dur / 1000);
        isrc = (track && typeof track.isrc === "string" && track.isrc) || "";
      } catch (e) {}
      return { name: name, artist: artist, album: album, duration: dur, isrc: isrc };
    }
    function lyrFetchJson(url, opts) {
      return Promise.resolve().then(function () {
        return fetch(url, opts || {});
      }).then(function (r) {
        if (!r || !r.ok) throw new Error("HTTP " + (r && r.status));
        return r.json();
      });
    }
    function lyrFetchText(url) {
      return Promise.resolve().then(function () {
        return fetch(url, { headers: { "Accept": "application/ttml+xml, application/xml, text/xml, */*" } });
      }).then(function (r) {
        if (!r || !r.ok) throw new Error("HTTP " + (r && r.status));
        return r.text();
      });
    }
    function lyrBini(info) {
      var qs = [];
      if (info.isrc) qs.push("isrc=" + encodeURIComponent(info.isrc));
      if (info.name) qs.push("track=" + encodeURIComponent(info.name));
      if (info.artist) qs.push("artist=" + encodeURIComponent(info.artist));
      if (info.album) qs.push("album=" + encodeURIComponent(info.album));
      if (info.duration) qs.push("duration=" + encodeURIComponent(String(Math.round(info.duration))));
      if (!qs.length) return Promise.resolve(null);
      return lyrFetchJson("https://lyrics-api.binimum.org/?" + qs.join("&")).then(function (j) {
        var results = (j && j.results) || [];
        var u = null;
        for (var i = 0; i < results.length; i++) {
          if (results[i] && results[i].lyricsUrl) { u = results[i].lyricsUrl; break; }
        }
        if (!u) return null;
        return lyrFetchText(u).then(function (ttml) {
          var lrc = lyrTtmlToLrc(ttml);
          return lrc || null;
        }).catch(function () { return null; });
      }).catch(function () { return null; });
    }
    function lyrUnison(info) {
      if (!info.name) return Promise.resolve(null);
      var qs = "song=" + encodeURIComponent(info.name) + "&artist=" + encodeURIComponent(info.artist || "");
      if (info.album) qs += "&album=" + encodeURIComponent(info.album);
      if (info.duration) qs += "&duration=" + encodeURIComponent(String(Math.round(info.duration)));
      return lyrFetchJson("https://unison.boidu.dev/lyrics?" + qs).then(function (j) {
        var lrc = lyrWordJsonToLrc(j);
        return lrc || null;
      }).catch(function () { return null; });
    }
    function lyrLyricsPlus(info) {
      var hosts = ["https://lyricsplus.binimum.org", "https://lyricsplus.prjktla.workers.dev",
        "https://lyrics-plus-backend.vercel.app", "https://lyricsplus-seven.vercel.app"];
      var qs = "title=" + encodeURIComponent(info.name || "") + "&artist=" + encodeURIComponent(info.artist || "");
      if (info.isrc) qs += "&isrc=" + encodeURIComponent(info.isrc);
      if (info.album) qs += "&album=" + encodeURIComponent(info.album);
      if (info.duration) qs += "&duration=" + encodeURIComponent(String(Math.round(info.duration)));
      var tryHost = function (idx) {
        if (idx >= hosts.length) return Promise.resolve(null);
        return lyrFetchJson(hosts[idx] + "/v2/lyrics/get?" + qs).then(function (j) {
          var lrc = lyrWordJsonToLrc(j) || lyrWordJsonToLrc(j && j.lyrics);
          return lrc || null;
        }).catch(function () { return tryHost(idx + 1); });
      };
      return tryHost(0);
    }
    function lyrGenius(info) {
      if (!info.name) return Promise.resolve(null);
      var url = "https://fetch-genius.samidy.workers.dev/?title=" + encodeURIComponent(info.name) +
        "&artist=" + encodeURIComponent(info.artist || "");
      return lyrFetchJson(url).then(function (j) {
        var t = j && (j.lyrics || j.plainLyrics || j.text);
        if (typeof t === "string" && t.length) return t;
        return null;
      }).catch(function () { return null; });
    }
    function lyrLrclib(info) {
      if (!info.name || !info.artist) return Promise.resolve(null);
      var qs = "track_name=" + encodeURIComponent(info.name) + "&artist_name=" + encodeURIComponent(info.artist);
      if (info.album) qs += "&album_name=" + encodeURIComponent(info.album);
      if (info.duration) qs += "&duration=" + encodeURIComponent(String(Math.round(info.duration)));
      return lyrFetchJson("https://lrclib.net/api/get?" + qs).then(function (j) {
        if (!j) return null;
        return j.syncedLyrics || j.plainLyrics || null;
      }).catch(function () { return null; });
    }
    function spineLyricsFetch(track, appFetch) {
      var info = lyrTrackInfo(track);
      var key = (info.artist + "\u0000" + info.name + "\u0000" + info.album).toLowerCase();
      if (LYR_FETCH_MEMO[key]) return LYR_FETCH_MEMO[key];
      var appFallback = function () {
        if (typeof appFetch === "function") {
          return Promise.resolve().then(function () { return appFetch(track); }).then(function (s) {
            if (s && typeof s === "string" && s.length) return s;
            return null;
          }).catch(function () { return null; });
        }
        return Promise.resolve(null);
      };
      var p = lyrBini(info).then(function (lrc) {
        if (lrc) return lrc;
        return lyrLrclib(info).then(function (r2) {
          if (r2) return r2;
          return lyrUnison(info).then(function (r3) {
            if (r3) return r3;
            return lyrLyricsPlus(info).then(function (r4) {
              if (r4) return r4;
              return lyrGenius(info).then(function (r5) {
                if (r5) return r5;
                return appFallback();
              });
            });
          });
        });
      }).catch(appFallback).then(function (res) {
        if (!res || typeof res !== "string" || !res.length) {
          try { delete LYR_FETCH_MEMO[key]; } catch (e2) {}
          return null;
        }
        LYR.lastSource = res.indexOf("<") === 0 ? "?" : (/\[\d{1,3}:\d{2}/.test(res) ? (/<\d{2}:\d{2}\.\d{2,3}>/.test(res) ? "word-synced" : "line-synced") : "plain");
        return res;
      });
      LYR_FETCH_MEMO[key] = p;
      return p;
    }

    function initLyrics(spine) {
      if (LYR.state === "installed" || LYR.state === "watching") {
        return LYR;
      }
      try {
        LYR.on = spine.prefs.get("lyricsView", true) !== false;
      } catch (e) {}
      function processLyricsModule(idStr, ex) {
        try {
          if (!ex || typeof ex !== "object") return false;
          var d = (ex.__esModule && ex.default !== undefined) ? ex.default : null;
          var inner = (d && typeof d === "object" && typeof d.type === "function") ? d.type : null;
          var fnName = "";
          if (typeof d === "function") fnName = d.name || d.displayName || "";
          else if (inner) fnName = inner.name || inner.displayName || "";
          var named = fnName === "LyricsView";
          var usable = (typeof d === "function") || !!inner;
          var isLyrics = named || idStr === "2644" ||
            !!(d && d.__spineLyricsProxy === true);
          if (!isLyrics) return false;
          if (!LYR.orig && usable && !(d && d.__spineLyricsProxy === true)) {
            LYR.orig = d;
          }
          if (!LYR.orig) return false;
          var V = LYR.view || buildLyricsView(spine);
          if (!V) {
            LYR.state = "no-view";
            return false;
          }
          LYR.view = V;
          if (ex.__esModule && ex.default === LYR.orig) {
            var sw = trySetDefault(ex, makeLyricsProxy(LYR));
            LYR.swap = sw && sw.ok ? "ok" : "fail:" + ((sw && sw.reason) || "?");
          }
          LYR.state = "installed";
          LYR.via = LYR.via || "scan:" + idStr;
          return true;
        } catch (e) {
          return false;
        }
      }
      function sweepLyrics() {
        try {
          if (LYR.state === "installed") return true;
          var mm = spine.metro.mirror() || {};
          if (mm["2644"] && mm["2644"].exports) {
            if (processLyricsModule("2644", mm["2644"].exports)) return true;
          }
          for (var k in mm) {
            var rec = mm[k];
            if (!rec || !rec.exports) continue;
            var exv = rec.exports;
            if (!exv || typeof exv !== "object") continue;
            var dv = (exv.__esModule && exv.default !== undefined) ? exv.default : null;
            var tn = "";
            if (typeof dv === "function") tn = dv.name || dv.displayName || "";
            else if (dv && dv.type && typeof dv.type === "function") tn = dv.type.displayName || dv.type.name || "";
            if (tn === "LyricsView" && processLyricsModule(String(k), exv)) return true;
          }
        } catch (e) {}
        return false;
      }
      try {
        spine.metro.pushCb(function (id, rec) {
          try {
            if (!rec.exports) return;
            processLyricsModule(String(id), rec.exports);
          } catch (e) {}
        });
        LYR.state = "watching";
      } catch (e) {
        LYR.state = "err:" + ((e && e.message) || String(e));
      }
      try {
        var sweeps = 0;
        (function swp() {
          try { if (sweepLyrics()) return; } catch (e1) {}
          sweeps++;
          if (sweeps < 12) {
            try { setTimeout(swp, 2000); } catch (e2) {}
          }
        })();
      } catch (e3) {}
      return LYR;
    }

    function buildPageShell(spine, route, title, sections) {
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
          children: title
        })].filter(function (x) { return x !== null; }));
      var Scroll = null;
      try {
        Scroll = (RN.Animated && typeof RN.Animated.ScrollView === "function") ? RN.Animated.ScrollView :
          ((typeof RN.ScrollView === "function") ? RN.ScrollView : null);
      } catch (eS) {}
      var kids = (sections || []).filter(function (x) { return x !== null; });
      var content = Scroll ? h(Scroll, {
        style: { flex: 1, width: pageWidth || undefined, alignSelf: "center" },
        contentContainerStyle: { paddingBottom: 100 }
      }, kids) : h(RN.View, {
        style: { flex: 1, width: pageWidth || undefined, alignSelf: "center" },
        children: kids
      });
      return h(RN.View, {
        style: [styles.settingsPageContainer, { backgroundColor: theme.background }],
        children: [header, content]
      });
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
      var onLyricsRow = function () {
        try {
          if (nav && typeof nav.navigate === "function") {
            nav.navigate("SpineLyrics", { theme: theme });
          }
        } catch (e) {}
      };
      var lyricsRow = h(pressType, {
        key: "spine-lyrics-row",
        style: [
          styles.settingsRowGrouped,
          styles.settingsRowFirst,
          styles.settingsRowLast,
          { borderBottomWidth: 0, backgroundColor: theme.card }
        ],
        onPress: onLyricsRow
      }, [
        h(RN.Text, { style: [styles.settingsRowText, { color: theme.primaryText }], children: "Lyrics settings" }),
        Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: "chevron-forward", size: 20, color: theme.secondaryText }) : null
      ].filter(function (x) { return x !== null; }));
      var lyricsGroup = (L && L.SettingsGroup) ? h(L.SettingsGroup, { theme: theme, children: lyricsRow }) : lyricsRow;
      var lyricsSection = h(RN.View, {
        style: styles.settingsSection,
        children: [
          h(RN.Text, {
            style: [styles.settingsSectionTitle, { color: theme.secondaryText, marginLeft: 16, marginBottom: 8 }],
            children: "Lyrics"
          }),
          lyricsGroup
        ]
      });
      var sections = [about, lyricsSection, exportSection, dangerSection];
      return buildPageShell(spine, route, "paras8", sections);
    }

    function buildLyricsPage(spine, route) {
      var R = ui.react();
      var RN = ui.rn();
      var L = ui.layout();
      if (!R || !RN) {
        return null;
      }
      var h = ui.h;
      var styles = (L && L.styles) || {};
      var Ion = ui.icons();
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
      var lyricsSection = null;
      try {
        lyricsSection = buildLyricsSection(spine, route, {
          theme: ((route && route.route && route.route.params) || {}).theme || {},
          styles: styles,
          h: h,
          RN: RN,
          pressType: pressType,
          L: L,
          Ion: Ion
        });
      } catch (e) {}
      return buildPageShell(spine, route, "Lyrics", [lyricsSection]);
    }

    
    
    
    
    
    
    
    
    
    
    
    
    function buildExportPage(spine, route) {
      var R = ui.react();
      if (!R || typeof R.createElement !== "function" || typeof R.useState !== "function") {
        return null;
      }
      return R.createElement(ExportPage, { spine: spine, route: route });
    }

    
    
    
    function exportTrackKey(t) {
      if (!t) return "";
      if (t.key) return "key:" + t.key;
      if (t.uri) return "uri:" + t.uri;
      return "meta:" + (t.title || "") + ":" + (t.artist || "") + ":" + (t.album || "");
    }
    function exportAlbumKey(t) {
      return ((t && t.artist) || "Unknown Artist") + "\u0000" + ((t && t.album) || "");
    }
    function groupExportAlbums(tracks) {
      var groups = [];
      var map = {};
      (tracks || []).forEach(function (t) {
        if (!t) return;
        var ak = exportAlbumKey(t);
        var g = map[ak];
        if (!g) {
          g = { key: ak, artist: t.artist || "Unknown Artist", album: t.album || "", tracks: [] };
          map[ak] = g;
          groups.push(g);
        }
        g.tracks.push(t);
      });
      return groups;
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
      var preTracks = null;
      try {
        var pp = (props.route && props.route.route && props.route.route.params) || {};
        if (Array.isArray(pp.tracks)) preTracks = pp.tracks;
      } catch (e) {}
      var tracksState = R.useState(preTracks || []);
      var loadingState = R.useState(!preTracks);
      var selModeState = R.useState(false);
      var selKeysState = R.useState([]);
      var expandedState = R.useState({});
      var coversState = R.useState({});
      var tracks = tracksState[0] || [];
      var setTracks = tracksState[1];
      var loading = loadingState[0] === true;
      var setLoading = loadingState[1];
      var selMode = selModeState[0] === true;
      var setSelMode = selModeState[1];
      var selKeys = selKeysState[0] || [];
      var setSelKeys = selKeysState[1];
      var expanded = expandedState[0] || {};
      var setExpanded = expandedState[1];
      var covers = coversState[0] || {};
      var setCovers = coversState[1];
      var mounted = true;
      R.useEffect(function () {
        if (!preTracks) {
          if (spine.exporter && typeof spine.exporter.listDownloads === "function") {
            Promise.resolve(spine.exporter.listDownloads(spine)).then(function (list) {
              if (!mounted) return;
              try { setTracks(list || []); } catch (e) {}
              try { setLoading(false); } catch (e) {}
            }).catch(function () {
              if (!mounted) return;
              try { setLoading(false); } catch (e) {}
            });
          } else {
            try { setLoading(false); } catch (e) {}
          }
        } else {
          try { setLoading(false); } catch (e) {}
        }
        return function () { mounted = false; };
      }, []);
      R.useEffect(function () {
        if (!spine.exporter || typeof spine.exporter.coverUri !== "function") return;
        var list = tracks || [];
        var done = {};
        var seq = Promise.resolve();
        list.forEach(function (t) {
          if (!t) return;
          var ak = exportAlbumKey(t);
          if (!ak || done[ak]) return;
          done[ak] = true;
          seq = seq.then(function () {
            return Promise.resolve(spine.exporter.coverUri(spine, t)).then(function (uri) {
              if (!mounted || !uri) return null;
              try {
                setCovers(function (prev) {
                  var n = {};
                  var k;
                  for (k in prev) n[k] = prev[k];
                  n[ak] = uri;
                  return n;
                });
              } catch (e) {}
              return null;
            }).catch(function () { return null; });
          });
        });
      }, [tracks]);
      try {
        return buildExportPageBody(props.spine, props.route, {
          busy: busy,
          setBusy: setBusy,
          status: status,
          setStatus: setStatus,
          meta: meta,
          setMeta: setMeta,
          tracks: tracks,
          setTracks: setTracks,
          loading: loading,
          setLoading: setLoading,
          selMode: selMode,
          setSelMode: setSelMode,
          selKeys: selKeys,
          setSelKeys: setSelKeys,
          expanded: expanded,
          setExpanded: setExpanded,
          covers: covers,
          setCovers: setCovers
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
      var tracks = fb.tracks || [];
      var setTracks = fb.setTracks || null;
      var loading = !!fb.loading;
      var setLoading = fb.setLoading || null;
      var selMode = !!fb.selMode;
      var setSelMode = fb.setSelMode || null;
      var selKeys = fb.selKeys || [];
      var setSelKeys = fb.setSelKeys || null;
      var expanded = fb.expanded || {};
      var setExpanded = fb.setExpanded || null;
      var covers = fb.covers || {};
      var setCovers = fb.setCovers || null;
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
      function toggleTrackSel(key) {
        if (!key || !setSelKeys) return;
        try {
          setSelKeys(function (prev) {
            var list = (prev || []).slice();
            var i = list.indexOf(key);
            if (i >= 0) list.splice(i, 1);
            else list.push(key);
            return list;
          });
        } catch (e) {}
      }
      function toggleExpanded(ak) {
        if (!ak || !setExpanded) return;
        try {
          setExpanded(function (prev) {
            var n = {};
            var k;
            for (k in prev) n[k] = prev[k];
            if (n[ak]) delete n[ak];
            else n[ak] = true;
            return n;
          });
        } catch (e) {}
      }
      function toggleAlbumSel(g) {
        if (!g || !setSelKeys) return;
        var keys = [];
        (g.tracks || []).forEach(function (t) {
          var k = exportTrackKey(t);
          if (k) keys.push(k);
        });
        var cur = selKeys || [];
        var all = keys.length > 0 && keys.every(function (k) { return cur.indexOf(k) >= 0; });
        try {
          setSelKeys(function (prev) {
            var list = (prev || []).slice();
            if (all) {
              keys.forEach(function (k) {
                var i = list.indexOf(k);
                if (i >= 0) list.splice(i, 1);
              });
            } else {
              keys.forEach(function (k) {
                if (list.indexOf(k) < 0) list.push(k);
              });
            }
            return list;
          });
        } catch (e) {}
      }
      function toggleSelectAll() {
        if (!setSelKeys) return;
        var keys = [];
        (tracks || []).forEach(function (t) {
          var k = exportTrackKey(t);
          if (k) keys.push(k);
        });
        var cur = selKeys || [];
        var all = keys.length > 0 && keys.every(function (k) { return cur.indexOf(k) >= 0; });
        try {
          setSelKeys(all ? [] : keys);
        } catch (e) {}
      }
      function cancelSelection() {
        if (setSelMode) { try { setSelMode(false); } catch (e) {} }
        if (setSelKeys) { try { setSelKeys([]); } catch (e2) {} }
      }
      function runExport() {
        if (exporting) return;
        exporting = true;
        if (setBusy) {
          try { setBusy(true); } catch (e) {}
        }
        setFeedback("Preparing files...");
        var selected = null;
        if (selMode) {
          var keys = {};
          (selKeys || []).forEach(function (k) { if (k) keys[k] = true; });
          selected = (tracks || []).filter(function (t) { return keys[exportTrackKey(t)]; });
        } else if (tracks && tracks.length) {
          selected = tracks;
        }
        if (selMode && (!selected || !selected.length)) {
          exporting = false;
          if (setBusy) {
            try { setBusy(false); } catch (e) {}
          }
          setFeedback("");
          ui.Alert("Export music", "Select at least one track to export.", [{ text: "OK" }]);
          return;
        }
        var opts = { metaFormat: meta };
        if (selected && selected.length) opts.tracks = selected;
        var p = null;
        try {
          if (spine.exporter && typeof spine.exporter.exportMusic === "function") {
            p = spine.exporter.exportMusic(spine, function (idx, total, msg) {
              setFeedback((total > 1 ? "(" + idx + "/" + total + ") " : "") + (msg || "Exporting..."));
            }, opts);
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
                if (!(sh && sh.ok)) {
                  var where = Array.isArray(res.uri) ? res.uri.join(" , ") : res.uri;
                  ui.Alert("Export music", (Array.isArray(res.uri) ? "Arquivos prontos: " : "Arquivo criado: ") + where + (sh && sh.reason ? " (share: " + sh.reason + ")" : ""), [{ text: "OK" }]);
                }
                try {
                  var fs2 = spine.storage && spine.storage.fs ? spine.storage.fs() : null;
                  if (fs2 && typeof fs2.deleteAsync === "function" && res && res.exportDir) {
                    fs2.deleteAsync(res.exportDir, { idempotent: true }).catch(function () {});
                  }
                } catch (e3) {}
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
      var nSel = selKeys.length;
      var backBtn = null;
      var headerActions = null;
      if (selMode) {
        var allSel = tracks.length > 0 && tracks.every(function (t) { return selKeys.indexOf(exportTrackKey(t)) >= 0; });
        backBtn = h(pressType, {
          style: styles.backButtonContainer,
          onPress: cancelSelection,
          hitSlop: 10
        }, Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: "close", size: 32, color: theme.primaryText }) : null);
        headerActions = h(RN.View, { style: { flexDirection: "row", alignItems: "center", gap: 4 } }, [
          h(pressType, {
            key: "spine-export-selectall",
            onPress: toggleSelectAll,
            hitSlop: 8,
            style: { minWidth: 40, minHeight: 40, alignItems: "center", justifyContent: "center" }
          }, [
            Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: allSel ? "checkbox" : "checkbox-outline", size: 24, color: theme.primaryText }) : null
          ].filter(function (x) { return x !== null; })),
          h(pressType, {
            key: "spine-export-run-row",
            onPress: runExport,
            disabled: nSel === 0,
            hitSlop: 8,
            style: [
              { minWidth: 40, minHeight: 40, alignItems: "center", justifyContent: "center" },
              (nSel === 0) ? { opacity: 0.35 } : null
            ].filter(function (x) { return x !== null; })
          }, [
            Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: "share-outline", size: 24, color: theme.primaryText }) : null
          ].filter(function (x) { return x !== null; }))
        ]);
      } else {
        backBtn = h(pressType, {
          style: styles.backButtonContainer,
          onPress: goBack,
          hitSlop: 10
        }, Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: "chevron-back", size: 32, color: theme.primaryText }) : null);
        headerActions = h(RN.View, { style: { flexDirection: "row", alignItems: "center", gap: 4 } }, [
          h(pressType, {
            key: "spine-export-select",
            onPress: function () {
              if (setSelMode) { try { setSelMode(true); } catch (e) {} }
              if (setSelKeys) { try { setSelKeys([]); } catch (e2) {} }
            },
            hitSlop: 8,
            style: { paddingHorizontal: 10, paddingVertical: 8 }
          }, [
            h(RN.Text, { style: { fontSize: 16, fontWeight: "600", color: theme.accent || theme.primaryText }, children: "Select" })
          ]),
          h(pressType, {
            key: "spine-export-run-row",
            onPress: runExport,
            hitSlop: 8,
            style: { minWidth: 40, minHeight: 40, alignItems: "center", justifyContent: "center" }
          }, [
            Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: "download-outline", size: 24, color: theme.primaryText }) : null
          ].filter(function (x) { return x !== null; }))
        ]);
      }
      var header = h(RN.View, { style: styles.settingsPageHeader }, [
        blurEl,
        backBtn,
        h(RN.View, { style: { flex: 1, paddingLeft: 4, paddingRight: 4 } }, [
          h(RN.Text, { style: [styles.settingsPageTitle, { color: theme.primaryText }], children: selMode ? (nSel + " Selected") : "Export music" })
        ]),
        headerActions
      ].filter(function (x) { return x !== null; }));

      
      
      var albumGroups = groupExportAlbums(tracks);
      function albumCard(g, idx) {
        var ak = g.key;
        var isExpanded = expanded[ak] === true;
        var cover = covers[ak] || null;
        var cur = selKeys || [];
        var nSelAlb = 0;
        (g.tracks || []).forEach(function (t) {
          if (cur.indexOf(exportTrackKey(t)) >= 0) nSelAlb++;
        });
        var allSelAlb = g.tracks.length > 0 && nSelAlb === g.tracks.length;
        var someSelAlb = nSelAlb > 0;
        var ImageC = null;
        try { if (RN.Image && typeof RN.Image === "function") ImageC = RN.Image; } catch (e) {}
        var artStyle = { width: 64, height: 64, borderRadius: 8 };
        var artEl = null;
        if (cover && ImageC) {
          artEl = h(ImageC, { style: artStyle, source: { uri: cover } });
        } else {
          artEl = h(RN.View, { style: [artStyle, { backgroundColor: theme.border, alignItems: "center", justifyContent: "center" }] }, [
            Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: "disc-outline", size: 32, color: theme.secondaryText }) : null
          ].filter(function (x) { return x !== null; }));
        }
        var infoEl = h(RN.View, { style: { flex: 1, marginLeft: 12, marginRight: 8 } }, [
          h(RN.Text, { style: { color: theme.primaryText, fontSize: 17, fontWeight: "600", marginBottom: 4 }, numberOfLines: 1, children: g.album || "Unknown Album" }),
          h(RN.Text, { style: { color: theme.secondaryText, fontSize: 14, marginBottom: 4 }, numberOfLines: 1, children: g.artist + " \u2022 " + g.tracks.length + " " + (g.tracks.length === 1 ? "track" : "tracks") })
        ]);
        var trailing = null;
        if (selMode) {
          var cname = allSelAlb ? "checkbox" : (someSelAlb ? "remove-circle" : "square-outline");
          trailing = h(pressType, {
            key: "spine-export-albumcheck-" + ak,
            onPress: function () { toggleAlbumSel(g); },
            hitSlop: 8,
            style: { padding: 8, marginRight: 2 }
          }, [
            Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: cname, size: 24, color: someSelAlb ? (theme.accent || theme.primaryText) : theme.secondaryText }) : null
          ].filter(function (x) { return x !== null; }));
        } else {
          trailing = Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: isExpanded ? "chevron-up" : "chevron-down", size: 24, color: theme.secondaryText }) : null;
        }
        var headerRow = h(pressType, {
          key: "spine-export-album-" + ak,
          style: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
          onPress: selMode ? function () { toggleAlbumSel(g); } : function () { toggleExpanded(ak); }
        }, [artEl, infoEl, trailing].filter(function (x) { return x !== null; }));
        var cardChildren = [headerRow];
        if (isExpanded) {
          var rows = [];
          (g.tracks || []).forEach(function (t, ti) {
            var rk = exportTrackKey(t);
            var r = buildTrackRow(t, rk, ti, g.tracks.length);
            if (r) rows.push(r);
          });
          cardChildren.push(h(RN.View, { style: { height: 0.5, marginHorizontal: 16, backgroundColor: theme.border } }));
          cardChildren.push(h(RN.View, { style: { paddingLeft: 8, paddingRight: 8, paddingBottom: 8 } }, rows));
        }
        return h(RN.View, {
          key: "spine-export-album-card-" + ak,
          style: { marginBottom: 8, marginHorizontal: 16, borderRadius: 12, borderWidth: 0.5, borderColor: theme.border, backgroundColor: theme.card, overflow: "hidden" }
        }, cardChildren);
      }
      function buildTrackRow(t, key, idx, total) {
        var isLast = idx === total - 1;
        var isSel = selKeys.indexOf(key) >= 0;
        var lead = null;
        if (selMode) {
          lead = h(pressType, {
            key: "spine-export-trackcheck-" + key,
            onPress: function () { toggleTrackSel(key); },
            hitSlop: 8,
            style: { padding: 8, marginRight: 2 }
          }, [
            Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: isSel ? "checkbox" : "square-outline", size: 22, color: isSel ? (theme.accent || theme.primaryText) : theme.secondaryText }) : null
          ].filter(function (x) { return x !== null; }));
        } else {
          lead = h(RN.View, { style: { width: 32, height: 32, borderRadius: 6, backgroundColor: theme.border, alignItems: "center", justifyContent: "center", marginRight: 12 } }, [
            Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: "musical-note", size: 16, color: theme.secondaryText }) : null
          ].filter(function (x) { return x !== null; }));
        }
        var sub = (t.artist || "") + ((t.album && t.album !== "Unknown Album") ? " \u2022 " + t.album : "");
        return h(pressType, {
          key: "spine-export-track-" + key,
          onPress: selMode ? function () { toggleTrackSel(key); } : null,
          style: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: isLast ? 0 : 0.5, borderBottomColor: theme.border }
        }, [
          lead,
          h(RN.View, { style: { flex: 1 } }, [
            h(RN.Text, { style: { color: theme.primaryText, fontSize: 15, fontWeight: "500" }, numberOfLines: 1, children: t.title || t.filename }),
            h(RN.Text, { style: { color: theme.secondaryText, fontSize: 12, marginTop: 2 }, numberOfLines: 1, children: sub })
          ])
        ].filter(function (x) { return x !== null; }));
      }
      var bodyEl = null;
      if (loading) {
        var ai2 = null;
        try { ai2 = RN.ActivityIndicator; } catch (e) {}
        bodyEl = h(RN.View, { style: { flex: 1, justifyContent: "center", alignItems: "center" } }, [
          (typeof ai2 === "function" || (ai2 && typeof ai2.render === "function")) ? h(ai2, { size: "large", color: theme.accent }) : null
        ].filter(function (x) { return x !== null; }));
      } else if (!tracks.length) {
        bodyEl = h(RN.View, { style: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 } }, [
          Ion && Ion.Ionicons ? h(Ion.Ionicons, { name: "download-outline", size: 64, color: theme.secondaryText }) : null,
          h(RN.Text, { style: { fontSize: 20, fontWeight: "600", marginTop: 16, color: theme.secondaryText }, children: "No downloaded tracks" }),
          h(RN.Text, { style: { fontSize: 14, marginTop: 8, textAlign: "center", color: theme.secondaryText }, children: "Downloaded music will appear here" })
        ].filter(function (x) { return x !== null; }));
      } else {
        var statsLine = tracks.length + " " + (tracks.length === 1 ? "track" : "tracks") + " downloaded" + (albumGroups.length ? " \u2022 " + albumGroups.length + " " + (albumGroups.length === 1 ? "album" : "albums") : "");
        var sv = null;
        try { sv = RN.ScrollView; } catch (e) {}
        var scrollEl = null;
        if (typeof sv === "function") {
          scrollEl = h(sv, { style: { flex: 1 }, contentContainerStyle: { paddingBottom: 100 } }, albumGroups.map(function (g, i) { return albumCard(g, i); }));
        } else {
          scrollEl = h(RN.View, { style: { flex: 1 } }, albumGroups.map(function (g, i) { return albumCard(g, i); }));
        }
        bodyEl = h(RN.View, { style: { flex: 1 } }, [
          h(RN.Text, { style: { paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: theme.secondaryText }, children: statsLine }),
          scrollEl
        ]);
      }
      var content = h(RN.View, {
        style: { flex: 1, width: pageWidth || undefined, alignSelf: "center" },
        children: [bodyEl].filter(function (x) { return x !== null; })
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
        var s3 = injectScreen(ch, "SpineLyrics", "spine-lyrics", buildLyricsPage);
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
        var out = null;
        try {
          out = ui.injectIntoSettings(el, props, {
            title: "paras8",
            label: "paras8 Settings",
            key: "spine-row-modules",
            onPress: function () { onPressRow(props); }
          });
        } catch (eInj) {
          spine.error("settings.inject", eInj);
          return el;
        }
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

    try {
      initLyrics(spine);
    } catch (e) {}

    function ensureOrig() {
      if (st.Orig) return true;
      var cands = [];
      try {
        cands = findAll(byName("SettingsPage")) || [];
      } catch (e) {}
      if (!cands.length && st.exps) {
        cands = [{ module: st.exps }];
      }
      for (var i = 0; i < cands.length; i++) {
        var exps = cands[i] && cands[i].module;
        if (!exps) continue;
        var Orig = interop(exps);
        if (Orig && typeof Orig === "function" && Orig.__spineProxy !== true && Orig[TOKEN] !== true) {
          st.exps = exps;
          st.Orig = Orig;
          return true;
        }
      }
      return false;
    }

    function applyOnce() {
      if (!ensureOrig()) {
        st.lastFail = "no-orig proxy=" + (st.OrigProxy ? 1 : 0) + " mirror=" + (spine.metro.mirror() ? Object.keys(spine.metro.mirror()).length : -1);
        return false;
      }
      if (st.Wrapped && st.Wrapped[TOKEN]) return true;

      if (!st.jsxRichHooked) {
        var r = hookJsxRuntime(st);
        st.jsxRichHooked = true;
        st.hooked = r.hooked || st.hooked;
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
        
        
        try {
          g.__SPINE_SCAN_BUSY__ = 0;
          var pre0 = g.__SPINE_PRE__;
          if (pre0) pre0.scanState = undefined;
        } catch (e0) {}
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