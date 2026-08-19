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