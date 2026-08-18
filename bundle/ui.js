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