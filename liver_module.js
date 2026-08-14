var CFG = {
  geolier: "https://raw.githubusercontent.com/KissAnotherDay/Geolier2-8spine/main/Qobuz_tidal.8spine",
  octave: "https://api.octavestreaming.com",
  deezerPub: "https://api.deezer.com",
  tokenTtl: 900000,
  searchTtl: 180000,
  lruMax: 60,
  sem: 4,
  gap: 800,
  octGap: 1200,
  retryDelay: 600,
  timeout: 9000
};

var UA = { "Accept": "application/json" };
var ISRC_RE = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/i;

function md5(str) {
  function rl(n, c) { return (n << c) | (n >>> (32 - c)); }
  function au(x, y) {
    var l = (x & 0xFFFF) + (y & 0xFFFF);
    var m = (x >> 16) + (y >> 16) + (l >> 16);
    return (m << 16) | (l & 0xFFFF);
  }
  function cmn(q, a, b, x, s, t) { return au(rl(au(au(a, q), au(x, t)), s), b); }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
  function toBlocks(s) {
    var n = s.length, nblk = ((n + 8) >> 6) + 1, blks = [], i;
    for (i = 0; i < nblk * 16; i++) blks[i] = 0;
    for (i = 0; i < n; i++) blks[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
    blks[i >> 2] |= 0x80 << ((i % 4) * 8);
    blks[nblk * 16 - 2] = n * 8;
    return blks;
  }
  function toHex(num) {
    var s = "", j;
    for (j = 0; j < 4; j++) s += ("0" + ((num >> (j * 8)) & 0xFF).toString(16)).slice(-2);
    return s;
  }
  var input = unescape(encodeURIComponent(String(str)));
  var x = toBlocks(input);
  var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, i;
  for (i = 0; i < x.length; i += 16) {
    var oa = a, ob = b, oc = c, od = d;
    a = ff(a, b, c, d, x[i], 7, -680876936); d = ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = ff(c, d, a, b, x[i + 2], 17, 606105819); b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = ff(a, b, c, d, x[i + 4], 7, -176418897); d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = ff(c, d, a, b, x[i + 6], 17, -1473231341); b = ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = ff(a, b, c, d, x[i + 8], 7, 1770035416); d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = ff(c, d, a, b, x[i + 10], 17, -42063); b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = ff(a, b, c, d, x[i + 12], 7, 1804603682); d = ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = ff(c, d, a, b, x[i + 14], 17, -1502002290); b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = gg(a, b, c, d, x[i + 1], 5, -165796510); d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = gg(c, d, a, b, x[i + 11], 14, 643717713); b = gg(b, c, d, a, x[i], 20, -373897302);
    a = gg(a, b, c, d, x[i + 5], 5, -701558691); d = gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = gg(c, d, a, b, x[i + 15], 14, -660478335); b = gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = gg(a, b, c, d, x[i + 9], 5, 568446438); d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = gg(c, d, a, b, x[i + 3], 14, -187363961); b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = gg(a, b, c, d, x[i + 13], 5, -1444681467); d = gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = gg(c, d, a, b, x[i + 7], 14, 1735328473); b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = hh(a, b, c, d, x[i + 5], 4, -378558); d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = hh(c, d, a, b, x[i + 11], 16, 1839030562); b = hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = hh(a, b, c, d, x[i + 1], 4, -1530992060); d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = hh(c, d, a, b, x[i + 7], 16, -155497632); b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = hh(a, b, c, d, x[i + 13], 4, 681279174); d = hh(d, a, b, c, x[i], 11, -358537222);
    c = hh(c, d, a, b, x[i + 3], 16, -722521979); b = hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = hh(a, b, c, d, x[i + 9], 4, -640364487); d = hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = hh(c, d, a, b, x[i + 15], 16, 530742520); b = hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = ii(a, b, c, d, x[i], 6, -198630844); d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = ii(c, d, a, b, x[i + 14], 15, -1416354905); b = ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = ii(a, b, c, d, x[i + 12], 6, 1700485571); d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = ii(c, d, a, b, x[i + 10], 15, -1051523); b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = ii(a, b, c, d, x[i + 8], 6, 1873313359); d = ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = ii(c, d, a, b, x[i + 6], 15, -1560198380); b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = ii(a, b, c, d, x[i + 4], 6, -145523070); d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = ii(c, d, a, b, x[i + 2], 15, 718787259); b = ii(b, c, d, a, x[i + 9], 21, -343485551);
    a = au(a, oa); b = au(b, ob); c = au(c, oc); d = au(d, od);
  }
  return toHex(a) + toHex(b) + toHex(c) + toHex(d);
}

function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function okJson(res) {
  if (!res || !res.ok) throw new Error((res && res.status) ? ("http " + res.status) : "net fail");
  return res.json();
}
function lruPut(map, key, val, ttl) {
  map[key] = { v: val, ts: Date.now() };
  var keys = Object.keys(map);
  if (keys.length > CFG.lruMax) {
    var oldest = keys[0];
    for (var i = 1; i < keys.length; i++) if (map[keys[i]].ts < map[oldest].ts) oldest = keys[i];
    delete map[oldest];
  }
}
function lruGet(map, key, ttl) {
  var e = map[key];
  if (e && (Date.now() - e.ts) < ttl) return e.v;
  return null;
}
function retryOnce(fn) {
  return Promise.resolve().then(fn).then(null, function (e) {
    return delay(CFG.retryDelay).then(fn, function () { throw e; });
  });
}

var slots = {}, lastIn = {};
function throttled(name, url, opt) {
  var h = opt && opt.headers ? opt.headers : UA;
  var gap = (name === "oct" || name === "at") ? CFG.octGap : CFG.gap;
  var since = lastIn[name] || 0;
  var need = Math.max(0, gap - (Date.now() - since));
  lastIn[name] = Date.now() + need;
  var acquire = function () {
    var s = slots[name] || 0;
    if (s < CFG.sem) { slots[name] = s + 1; return Promise.resolve(true); }
    if (need > 0) { slots[name] = 1; return Promise.resolve(true); }
    var start = Date.now();
    return new Promise(function (r) {
      (function poll() {
        if ((slots[name] || 0) < CFG.sem) { slots[name] = (slots[name] || 0) + 1; r(true); }
        else if (Date.now() - start > CFG.timeout) r(false);
        else setTimeout(poll, 40);
      })();
    });
  };
  return acquire().then(function (ok) {
    if (!ok) throw new Error(name + ": busy");
    var proc = fetch(url, { headers: h }).then(function (res) {
      slots[name] = Math.max(0, (slots[name] || 1) - 1);
      return res;
    }, function (e) {
      slots[name] = Math.max(0, (slots[name] || 1) - 1);
      throw e;
    });
    return Promise.race([proc, delay(CFG.timeout).then(function () {
      slots[name] = Math.max(0, (slots[name] || 1) - 1);
      throw new Error(name + ": timeout");
    })]);
  });
}
function ladder(fmts, fn) {
  var i = 0;
  var tryNext = function (lastErr) {
    if (i >= fmts.length) return Promise.reject(lastErr || new Error("ladder exhausted"));
    var fmt = fmts[i];
    i++;
    return Promise.resolve().then(function () { return fn(fmt); }).then(null, tryNext);
  };
  return tryNext();
}
var QUALITY = { LOW: "LOW", HIGH: "HIGH", LOSSLESS: "LOSSLESS", HIRES: "HI_RES_LOSSLESS" };
var QUALITY_FALLBACKS = {
  HI_RES_LOSSLESS: ["LOSSLESS", "HIGH", "LOW"],
  LOSSLESS: ["HIGH", "LOW"],
  HIGH: ["LOSSLESS", "LOW"],
  LOW: ["HIGH", "LOSSLESS"]
};
function readSetting(ctx, key, dflt) {
  if (!ctx || !ctx.settings) return dflt;
  var v = ctx.settings[key];
  if (v && typeof v === "object") {
    if ("value" in v && v.value !== undefined && v.value !== null && v.value !== "") return String(v.value);
    if ("defaultValue" in v) return String(v.defaultValue);
  }
  return dflt;
}
function selectedQuality(ctx, preferred) {
  if (ctx && ctx.settings && ctx.settings.quality) {
    var s = readSetting(ctx, "quality", "");
    if (s) return s;
  }
  return normQ(preferred);
}
function normQ(q) {
  var s = String(q || "").toUpperCase();
  if (s.indexOf("HIRES") !== -1 || s.indexOf("HI_RES") !== -1) return QUALITY.HIRES;
  if (s.indexOf("LOSS") !== -1 || s.indexOf("FLAC") !== -1) return QUALITY.LOSSLESS;
  if (s === "LOW" || s === "128" || s.indexOf("MP3_128") !== -1) return QUALITY.LOW;
  return QUALITY.HIGH;
}
function strictMode(ctx) {
  return readSetting(ctx, "fallbackMode", "flexible") === "strict";
}
function qualityChain(ctx, target) {
  if (strictMode(ctx)) return [target];
  var chain = [target].concat(QUALITY_FALLBACKS[target] || []);
  var seen = {};
  return chain.filter(function (q) {
    if (!q || seen[q]) return false;
    seen[q] = true;
    return true;
  });
}
function wantFor(q) { return q === QUALITY.HIRES || q === QUALITY.LOSSLESS ? "lossless" : q === QUALITY.LOW ? "128" : "320"; }
function withQuality(url, want) { return url.replace(/\/audio\/[^?]+/, "/audio/" + want); }
function qInfo(want) {
  if (want === "lossless") return { audioQuality: "LOSSLESS", bitrate: -1, codec: "FLAC" };
  var b = parseInt(want, 10);
  return { audioQuality: b >= 320 ? "HIGH" : "LOW", bitrate: b, codec: "MP3" };
}
function searchQualityLabel(q) {
  if (q === QUALITY.LOW) return "MP3 128kbps";
  if (q === QUALITY.HIGH) return "MP3 320kbps";
  if (q === QUALITY.HIRES) return "HI-RES FLAC 24-bit";
  return "FLAC 16-bit/44.1 kHz";
}
function splitQuery(q) {
  var clean = String(q || "").replace(/\s+\([^)]*\)$/i, "").trim();
  var parts = clean.split(/\s+-\s+/);
  return { title: parts[0] || "", artist: parts.length > 1 ? parts[1] : "" };
}
function norm(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function titleCore(s) { return norm(String(s || "").replace(/\([^)]*\)|\[[^\]]*\]/g, " ")); }
function artistsOf(t) {
  if (t.artists && t.artists.length) return t.artists.map(function (a) { return a.name; }).join(", ");
  if (t.performer && t.performer.name) return t.performer.name;
  if (t.artist) return t.artist.name || t.artist;
  return t.artistName || "";
}
function exactMatchOrInverse(item, parts) {
  var itTitle = norm(item.title || item.name || "");
  var itArtist = norm(artistsOf(item));
  var t1 = norm(parts.title), a1 = norm(parts.artist);
  var t2 = norm(parts.artist), a2 = norm(parts.title);
  var c1 = titleCore(parts.title), c2 = titleCore(parts.artist);
  var itCore = titleCore(item.title || item.name || "");
  if (!t1) return true;
  if ((itCore === c1 || itCore === c2) && (
    (!a1 || itArtist === a1 || (itArtist.length > 3 && a1 && itArtist.indexOf(a1) !== -1)) ||
    (!a2 || itArtist === a2 || (itArtist.length > 3 && a2 && itArtist.indexOf(a2) !== -1)))) return true;
  if (itTitle === t1 || itTitle === t2) return true;
  return false;
}
function nameOf(a) { return typeof a === "string" ? a : ((a && a.name) || ""); }
var geoCache = null, geoFetching = null, geoNextTry = 0;
function loadGeo(force) {
  if (geoCache && Date.now() - geoCache.ts < 43200000 && !force) return Promise.resolve(geoCache);
  if (Date.now() < geoNextTry && !force) return Promise.reject(new Error("creds backoff"));
  if (geoFetching) return geoFetching;
  geoFetching = fetch(CFG.geolier, { headers: UA }).then(function (res) {
    if (!res.ok) throw new Error("http " + res.status);
    return res.text();
  }).then(function (src) {
    var g = { ts: Date.now() };
    var grab = function (name) {
      var m = src.match(new RegExp("(?:var|let|const)\\s+" + name + "\\s*=\\s*[\"']([^\"']+)[\"']"));
      if (m && m[1]) g[name.toLowerCase()] = m[1];
    };
    grab("APP_ID"); grab("USER_TOKEN"); grab("SECRET"); grab("BASE"); grab("TIDAL_API"); grab("TIDAL_SEARCH");
    if (!g.app_id || !g.user_token || !g.secret) throw new Error("creds missing");
    if (!g.base) g.base = "https://www.qobuz.com/api.json/0.2";
    if (!g.tidalapi) g.tidalapi = "https://tidal-come-one.francescone.workers.dev";
    if (!g.tidalsearch) g.tidalsearch = "https://lol.samidy.workers.dev";
    g.md5 = md5;
    geoCache = g;
    geoFetching = null;
    return g;
  }).then(null, function (e) {
    geoFetching = null;
    geoNextTry = Date.now() + 120000;
    throw e;
  });
  return geoFetching;
}
function qobuzUrl(path, params) {
  var p = [];
  for (var k in params) p.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
  return path + "?" + p.join("&");
}
function qbReq(path, params) {
  return loadGeo().then(function (g) {
    var p = params || {};
    p.app_id = g.app_id;
    p.user_auth_token = g.user_token;
    return fetch(g.base + qobuzUrl(path, p), { headers: { "Accept": "application/json" } }).then(function (res) {
      if (!res.ok) throw new Error("http " + res.status);
      return res.json();
    });
  });
}
function qbSearch(q, n) {
  return qbReq("/track/search", { query: q, limit: n }).then(function (d) {
    var items = (d && d.tracks && d.tracks.items) || [];
    if (!items.length) throw new Error("qbz: empty");
    return items;
  });
}
function qbTrackIsrc(id) {
  return qbReq("/track/get", { track_id: id }).then(function (d) {
    if (!d || !d.isrc) throw new Error("qbz: no isrc");
    return String(d.isrc).toUpperCase();
  });
}
function qbStreamUrl(id, fid) {
  return loadGeo().then(function (g) {
    if (!g.md5) throw new Error("qbz: no md5");
    var ts = Math.floor(Date.now() / 1000);
    var sig = g.md5("trackgetFileUrlformat_id" + fid + "intentstreamtrack_id" + id + ts + g.secret);
    var url = g.base + "/track/getFileUrl?app_id=" + encodeURIComponent(g.app_id) + "&user_auth_token=" + encodeURIComponent(g.user_token) +
      "&track_id=" + encodeURIComponent(id) + "&format_id=" + fid + "&intent=stream&request_ts=" + ts + "&request_sig=" + sig;
    return fetch(url, { headers: { "Accept": "application/json" } }).then(function (res) {
      if (!res.ok) throw new Error("http " + res.status);
      return res.json();
    });
  });
}
function mapQobuz(t) {
  var depth = t.maximum_bit_depth || 16;
  var rate = t.maximum_sampling_rate || 44.1;
  if (rate >= 1000) rate = rate / 1000;
  return {
    id: "qbz:" + t.id,
    title: t.title || "",
    artist: (t.performer && t.performer.name) || "",
    album: (t.album && t.album.title) || "",
    albumId: (t.album && t.album.id != null) ? "qbz:" + t.album.id : null,
    duration: t.duration || 0,
    albumCover: (t.album && t.album.image && (t.album.image.large || t.album.image.medium || t.album.image.small)) || "",
    explicit: !!t.parental_advice,
    audioQuality: "FLAC " + depth + "-bit / " + rate + " kHz",
    availableQualities: ["FLAC"],
    bitDepth: depth,
    sampleRate: rate,
    isrc: t.isrc || null,
    streamable: t.streamable !== false,
    _moduleTrack: t
  };
}
function qbzStream(id, q) {
  var fids = q === QUALITY.HIRES ? [27, 6, 5] : q === QUALITY.LOSSLESS ? [6, 5] : [5];
  return ladder(fids, function (fid) {
    return retryOnce(function () { return qbStreamUrl(id, fid); }).then(function (data) {
      if (!data || !data.url) throw new Error("qbz: no url");
      var bd = data.bit_depth || (fid === 27 ? 24 : 16);
      var sr = data.sampling_rate || (fid === 27 ? 192 : 44.1);
      if (sr >= 1000) sr = sr / 1000;
      return {
        streamUrl: data.url,
        track: { audioQuality: "FLAC " + bd + "-bit / " + sr + " kHz", bitrate: -1, codec: "FLAC" },
        mimeType: "audio/flac"
      };
    });
  });
}
function qbzByIsrc(isrc, q) {
  return qbSearch(isrc, 1).then(function (items) {
    var t = items[0];
    if (!t || !t.streamable || t.isrc !== isrc) throw new Error("qbz: isrc miss");
    return qbzStream(String(t.id), q);
  });
}
function unwrapTidal(d) {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.items)) return d.items;
  if (d.data) {
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d.data.items)) return d.data.items;
    if (Array.isArray(d.data.tracks)) return d.data.tracks;
    if (d.data.data && Array.isArray(d.data.data.items)) return d.data.data.items;
  }
  return [];
}
function mapTidal(t, prefix) {
  var artist = artistsOf(t);
  return {
    id: prefix + ":" + t.id,
    title: t.title || t.name || "",
    artist: artist,
    album: (t.album && t.album.title) || "",
    albumId: (t.album && t.album.id != null) ? (prefix + ":" + t.album.id) : null,
    duration: t.duration || 0,
    albumCover: (t.album && (t.album.cover || t.album.image)) ? "https://resources.tidal.com/images/" + String(t.album.cover || t.album.image).replace(/-/g, "/") + "/1280x1280.jpg" : "",
    explicit: !!t.explicit,
    audioQuality: "FLAC 16-bit / 44.1 kHz",
    isrc: t.isrc || null,
    availableQualities: ["LOSSLESS", "HIGH", "LOW"],
    _moduleTrack: t
  };
}
function tidalSearchLane(q, n) {
  return loadGeo().then(function (g) {
    return throttled("tdl", g.tidalsearch + "/search/?s=" + encodeURIComponent(q), { headers: { "Accept": "application/json" } }).then(okJson).then(function (d) {
      var items = unwrapTidal(d);
      if (!items.length) throw new Error("tdl: empty");
      var parts = splitQuery(q);
      var kept = items.filter(function (it) { return exactMatchOrInverse(it, parts); });
      if (!kept.length) kept = items.slice(0, 1);
      return kept.slice(0, n).map(function (t) { return mapTidal(t, "tdl"); });
    });
  });
}
function tdlStream(id, q) {
  return loadGeo().then(function (g) {
    var chain = q === QUALITY.LOW || q === QUALITY.HIGH ? ["AACLC", "HEAACV1"] : q === QUALITY.HIRES ? ["FLAC_HIRES", "FLAC", "AACLC", "HEAACV1"] : ["FLAC", "AACLC", "HEAACV1"];
    return ladder(chain, function (fmt) {
      return throttled("at", g.tidalapi + "/trackManifests/?id=" + encodeURIComponent(id) + "&formats=" + fmt, { headers: { "Accept": "application/json" } }).then(okJson).then(function (d) {
        var node = (d && d.data) || d || {};
        var attrs = node.attributes || node;
        if (attrs && attrs.isError) {
          var ie = attrs.isError;
          throw new Error("atm: " + ((ie && (ie.detail || ie.error || ie.status)) || "isError"));
        }
        if (attrs && attrs.trackPresentation === "PREVIEW") throw new Error("atm: preview");
        var uri = attrs && attrs.uri;
        if (!uri && attrs && attrs.manifest) {
          var o = JSON.parse(atob(attrs.manifest));
          uri = (o.urls || (o.url ? [o.url] : []))[0];
        }
        if (!uri) throw new Error("atm: no uri");
        var ql = fmt === "FLAC_HIRES" ? { audioQuality: "HI-RES FLAC 24-bit", bitrate: -1, codec: "FLAC" }
          : fmt === "FLAC" ? { audioQuality: "FLAC 16-bit / 44.1 kHz", bitrate: -1, codec: "FLAC" }
          : fmt === "AACLC" ? { audioQuality: "HIGH", bitrate: 320, codec: "AAC" }
          : { audioQuality: "LOW", bitrate: 96, codec: "AAC" };
        return {
          streamUrl: uri,
          track: ql,
          mimeType: fmt.indexOf("FLAC") === 0 ? "audio/flac" : "audio/mp4"
        };
      });
    });
  });
}
function tidalByIsrc(isrc, q) {
  return loadGeo().then(function (g) {
    return throttled("tdl", g.tidalsearch + "/search/?i=" + encodeURIComponent(isrc), { headers: { "Accept": "application/json" } }).then(okJson).then(function (d) {
      var items = unwrapTidal(d);
      if (!items.length) throw new Error("tdl: isrc miss");
      return tdlStream(String(items[0].id), q);
    });
  });
}
function deezerByIsrc(isrc, q) {
  return throttled("dzr", CFG.deezerPub + "/track/isrc:" + encodeURIComponent(isrc)).then(okJson).then(function (d) {
    if (!d || d.error || d.id == null) throw new Error("dzr: isrc miss");
    return octStream(String(d.id), [q], false);
  });
}
function resolveIsrc(isrc, q) {
  if (!ISRC_RE.test(String(isrc || ""))) return Promise.reject(new Error("bad isrc (not ISRC format)"));
  return deezerByIsrc(isrc, q).then(null, function () {
    return qbzByIsrc(isrc, q).then(null, function () {
      return tidalByIsrc(isrc, q);
    });
  });
}
var octTokens = {}, scache = {};
function mapDeezerTrack(t, lbl) {
  var album = t.album || {};
  return {
    id: String(t.id),
    title: t.title || "",
    artist: nameOf(t.artist),
    album: typeof album === "string" ? album : (album.title || ""),
    albumId: album && album.id != null ? String(album.id) : null,
    duration: t.duration || 0,
    albumCover: (album.cover_big || album.cover_medium || album.cover_xl) || "",
    explicit: !!t.explicit,
    audioQuality: lbl,
    availableQualities: ["HI_RES_LOSSLESS", "LOSSLESS", "HIGH", "LOW"],
    _moduleTrack: t
  };
}
function octSearch(q, n, lbl) {
  return throttled("oct", CFG.octave + "/api/search?q=" + encodeURIComponent(q)).then(okJson).then(function (d) {
    var items = (d && d.tracks) || [];
    if (!items.length) throw new Error("oct: empty");
    return items.slice(0, n).map(function (t) { return mapDeezerTrack(t, lbl); });
  });
}
function qbLane(q, n) {
  return qbSearch(q, n).then(function (items) {
    var parts = splitQuery(q);
    var kept = items.filter(function (it) { return exactMatchOrInverse(it, parts); });
    if (!kept.length) kept = items.slice(0, 1);
    return kept.slice(0, n).map(mapQobuz);
  });
}
function mintOct(id) {
  return throttled("oct", CFG.octave + "/api/track/" + encodeURIComponent(id)).then(okJson).then(function (j) {
    if (!j || !j.url) throw new Error("oct: no url");
    lruPut(octTokens, id, j.url, CFG.tokenTtl);
    return j.url;
  });
}
function octStream(id, chain, flex) {
  var cached = lruGet(octTokens, id, CFG.tokenTtl);
  var p = cached ? Promise.resolve(cached) : retryOnce(function () { return mintOct(id); });
  return p.then(function (url) {
    var want = wantFor(chain[0]);
    return {
      streamUrl: withQuality(url, want),
      track: qInfo(want)
    };
  }).catch(function (e) {
    if (!flex) throw e;
    return isrcFromDeezer(id).then(function (isrc) {
      if (!ISRC_RE.test(isrc)) throw e;
      return ladder(chain, function (q) { return resolveIsrc(isrc, q); });
    }, function () { throw e; });
  });
}
function isrcFromDeezer(id) {
  return throttled("dzr", CFG.deezerPub + "/track/" + encodeURIComponent(id)).then(okJson).then(function (d) {
    if (!d || !d.isrc) throw new Error("dzr: no isrc");
    return String(d.isrc).toUpperCase();
  });
}
function parseTrackId(id) {
  var s = String(id || "");
  var m = s.match(/^([a-z]{2,4}):(.+)$/i);
  if (m) return { type: m[1].toLowerCase(), value: m[2] };
  if (ISRC_RE.test(s)) return { type: "isrc", value: s.toUpperCase() };
  return { type: "oct", value: s.replace(/\D/g, "") };
}
function getTrackStreamUrl(trackId, quality, ctx) {
  var id = String(trackId || "");
  var target = normQ(selectedQuality(ctx, quality));
  var chain = qualityChain(ctx, target);
  var flex = !strictMode(ctx);
  var p = parseTrackId(id);
  var flow;
  if (p.type === "isrc") flow = ladder(chain, function (q) { return resolveIsrc(p.value, q); });
  else if (p.type === "oct" || p.type === "dzr") flow = octStream(p.value, chain, flex);
  else if (p.type === "qbz") flow = ladder(chain, function (q) { return qbzStream(p.value, q); }).then(null, function (e) {
    if (!flex) return Promise.reject(e);
    return qbTrackIsrc(p.value).then(function (isrc) {
      if (!ISRC_RE.test(isrc)) return Promise.reject(e);
      return ladder(chain, function (q) { return resolveIsrc(isrc, q); });
    }, function () { return Promise.reject(e); });
  });
  else if (p.type === "tdl") flow = ladder(chain, function (q) { return retryOnce(function () { return tdlStream(p.value, q); }); });
  else flow = octStream(p.value, chain, flex);
  return flow.then(function (r) {
    r.track = r.track || {};
    r.track.id = id;
    return r;
  });
}

function searchTracks(query, limit, ctx) {
  var n = (limit && limit > 0) ? limit : 20;
  var lbl = searchQualityLabel(normQ(selectedQuality(ctx, null)));
  var key = String(query) + "|" + n + "|" + lbl;
  var hit = lruGet(scache, key, CFG.searchTtl);
  if (hit) return Promise.resolve(JSON.parse(JSON.stringify(hit)));
  var attempt = function (fn, rest) {
    return fn().then(function (tracks) {
      if (!tracks.length && rest.length) return attempt(rest[0], rest.slice(1));
      var meta = { tracks: tracks, total: tracks.length };
      lruPut(scache, key, meta, CFG.searchTtl);
      return meta;
    }, function () {
      if (!rest.length) return { tracks: [], total: 0 };
      return attempt(rest[0], rest.slice(1));
    });
  };
  return attempt(function () { return octSearch(query, n, lbl); }, [
    function () { return qbLane(query, n); },
    function () { return tidalSearchLane(query, n); }
  ]);
}
function getAlbum(id) {
  var p = parseTrackId(String(id || ""));
  var deezerLike = function (d, prefix) {
    if (!d || d.error) throw new Error("album error");
    return {
      album: {
        id: prefix + ":" + d.id,
        title: d.title || "",
        artist: (d.artist && d.artist.name) || "",
        cover: d.cover_big || d.cover_medium || "",
        releaseDate: d.release_date || "",
        nbTracks: d.nb_tracks || 0
      },
      tracks: ((d.tracks && d.tracks.data) || []).map(function (t) {
        var album = t.album || {};
        return {
          id: prefix + ":" + t.id,
          title: t.title || "",
          artist: (t.artist && t.artist.name) || "",
          album: (typeof album === "string" ? album : (album.title || "")),
          albumId: (album && album.id != null) ? (prefix + ":" + album.id) : null,
          duration: t.duration || 0,
          albumCover: (album.cover_big || album.cover_medium) || "",
          explicit: !!t.explicit_lyrics,
          audioQuality: "FLAC 16-bit / 44.1 kHz",
          availableQualities: ["HI_RES_LOSSLESS", "LOSSLESS", "HIGH", "LOW"],
          _moduleTrack: t
        };
      })
    };
  };
  if (p.type === "oct" || p.type === "dzr") {
    return throttled("dzr", CFG.deezerPub + "/album/" + encodeURIComponent(p.value)).then(okJson).then(function (d) {
      return deezerLike(d, p.type);
    });
  }
  if (p.type === "qbz") {
    return qbReq("/album/get", { album_id: p.value }).then(function (d) {
      if (!d || !d.title) throw new Error("qbz: album error");
      return {
        album: {
          id: "qbz:" + d.id,
          title: d.title || "",
          artist: (d.artist && d.artist.name) || "",
          cover: (d.image && (d.image.large || d.image.medium || d.image.small)) || "",
          releaseDate: d.release_date || "",
          nbTracks: ((d.tracks && d.tracks.items) || []).length
        },
        tracks: ((d.tracks && d.tracks.items) || []).map(mapQobuz)
      };
    });
  }
  if (p.type === "tdl") {
    return loadGeo().then(function (g) {
      return throttled("tdl", g.tidalsearch + "/album/?id=" + encodeURIComponent(p.value), { headers: { "Accept": "application/json" } }).then(okJson).then(function (d) {
        var a = (d && d.data) || {};
        var items = ((a.items) || []).map(function (x) { return x && x.item ? x.item : x; }).filter(function (t) { return t && t.id; });
        if (!items.length) throw new Error("tdl: album empty");
        return {
          album: {
            id: "tdl:" + a.id,
            title: a.title || "",
            artist: (a.artist && a.artist.name) || "",
            cover: a.cover ? "https://resources.tidal.com/images/" + String(a.cover).replace(/-/g, "/") + "/1280x1280.jpg" : "",
            releaseDate: a.releaseDate || "",
            nbTracks: items.length
          },
          tracks: items.map(function (t) { return mapTidal(t, "tdl"); })
        };
      });
    });
  }
  return Promise.reject(new Error("unsupported " + p.type));
}

function getArtist(id) {
  var p = parseTrackId(String(id || ""));
  var num = p.value.replace(/\D/g, "");
  if (!num) return Promise.reject(new Error("oct: bad artist id"));
  return throttled("oct", CFG.octave + "/api/artist/" + encodeURIComponent(num) + "/similar").then(okJson).then(function (j) {
    if (!j || !j.artist) throw new Error("oct: no artist");
    var a = j.artist;
    return {
      artist: { id: String(a.id || ""), name: a.name || "", picture: a.picture_big || a.picture_medium || a.picture_xl || "" },
      tracks: (j.top || []).map(function (t) { return mapDeezerTrack(t, "FLAC 16-bit / 44.1 kHz"); }),
      albums: (j.albums || []).map(function (al) {
        var x = al && al.album ? al.album : (al || {});
        return { id: String(x.id || ""), title: x.title || "", cover: x.cover_big || x.cover_medium || "" };
      }),
      related: (j.related || []).map(function (r) {
        return { id: String(r.id || ""), name: r.name || "", nbFan: r.nbFan || 0, picture: r.picture_big || r.picture_medium || "" };
      })
    };
  });
}

return {
  id: "liver",
  name: "Liver",
  author: "Livie",
  version: "3.1.1",
  description: "best module in the universe",
  labels: ["MP3", "FLAC", "LOSSLESS", "MULTI-SOURCE"],

  settings: {
    quality: {
      type: "selector",
      label: "Audio Quality",
      description: "Select preferred streaming quality",
      options: [
        { label: "Data Saver (MP3 128kbps)", value: "LOW" },
        { label: "High Quality (MP3 320kbps)", value: "HIGH" },
        { label: "Lossless (FLAC 16-bit/44.1kHz)", value: "LOSSLESS" },
        { label: "Hi-Res Lossless (FLAC 24-bit)", value: "HI_RES_LOSSLESS" }
      ],
      defaultValue: "HI_RES_LOSSLESS"
    },
    fallbackMode: {
      type: "selector",
      label: "Quality Fallback",
      description: "Fallback if preferred quality is unavailable",
      options: [
        { label: "Flexible", value: "flexible" },
        { label: "Strict", value: "strict" }
      ],
      defaultValue: "flexible"
    }
  },

  searchTracks: searchTracks,
  getTrackStreamUrl: getTrackStreamUrl,
  getAlbum: getAlbum,
  getArtist: getArtist
};
