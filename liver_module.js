var CFG = {
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
var DEF_QUALITY = "HI_RES_LOSSLESS";
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
  if (v === undefined || v === null || v === "") return dflt;
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    if (v.value !== undefined && v.value !== null && v.value !== "") return String(v.value);
    if (v.defaultValue !== undefined && v.defaultValue !== null && v.defaultValue !== "") return String(v.defaultValue);
  }
  return dflt;
}
function selectedQuality(ctx, preferred) {
  if (ctx && ctx.settings) {
    var s = readSetting(ctx, "quality", "");
    if (s) return s;
  }
  return normQ(preferred || DEF_QUALITY);
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

var TIDAL_API = "https://not-use-my-tidal-niggas.francescone.workers.dev";
var TIDAL_SEARCH = "https://lol.samidy.workers.dev";
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
  return throttled("tdl", TIDAL_SEARCH + "/search/?s=" + encodeURIComponent(q), { headers: { "Accept": "application/json" } }).then(okJson).then(function (d) {
    var items = unwrapTidal(d);
    if (!items.length) throw new Error("tdl: empty");
    var parts = splitQuery(q);
    var kept = items.filter(function (it) { return exactMatchOrInverse(it, parts); });
    if (!kept.length) kept = items.slice(0, 1);
    return kept.slice(0, n).map(function (t) { return mapTidal(t, "tdl"); });
  });
}
function tdlStream(id, q) {
  var chain = q === QUALITY.LOW || q === QUALITY.HIGH ? ["AACLC", "HEAACV1"] : q === QUALITY.HIRES ? ["FLAC_HIRES", "FLAC", "AACLC", "HEAACV1"] : ["FLAC", "AACLC", "HEAACV1"];
  return ladder(chain, function (fmt) {
    return throttled("at", TIDAL_API + "/trackManifests/?id=" + encodeURIComponent(id) + "&formats=" + fmt, { headers: { "Accept": "application/json" } }).then(okJson).then(function (d) {
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
      if (isPreviewUrl(uri)) throw new Error("atm: preview");
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
}
function tidalByIsrc(isrc, q) {
  return throttled("tdl", TIDAL_SEARCH + "/search/?i=" + encodeURIComponent(isrc), { headers: { "Accept": "application/json" } }).then(okJson).then(function (d) {
    var items = unwrapTidal(d);
    if (!items.length) throw new Error("tdl: isrc miss");
    return tdlStream(String(items[0].id), q);
  });
}
function deezerByIsrc(isrc, q) {
  return throttled("dzr", CFG.deezerPub + "/track/isrc:" + encodeURIComponent(isrc)).then(okJson).then(function (d) {
    if (!d || d.error || d.id == null) throw new Error("dzr: isrc miss");
    if (d.readable === false) throw new Error("dzr: preview");
    return octStream(String(d.id), [q], false);
  });
}
function resolveIsrc(isrc, q) {
  isrc = String(isrc || "").toUpperCase();
  if (!ISRC_RE.test(isrc)) return Promise.reject(new Error("bad isrc (not ISRC format)"));
  return deezerByIsrc(isrc, q).then(null, function () {
    return tidalByIsrc(isrc, q);
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
function isPreviewUrl(u) {
  return /cdnt-preview|preview/i.test(u || "");
}
function mintOct(id) {
  return throttled("oct", CFG.octave + "/api/track/" + encodeURIComponent(id)).then(okJson).then(function (j) {
    if (!j || !j.url) throw new Error("oct: no url");
    if (isPreviewUrl(j.url)) throw new Error("oct: preview");
    lruPut(octTokens, id, j.url, CFG.tokenTtl);
    return j.url;
  });
}
function octStream(id, chain, flex) {
  var cached = lruGet(octTokens, id, CFG.tokenTtl);
  var p = cached ? Promise.resolve(cached) : retryOnce(function () { return mintOct(id); });
  return p.then(function (url) {
    if (isPreviewUrl(url)) throw new Error("oct: preview");
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
function deezerReadable(id) {
  return throttled("dzr", CFG.deezerPub + "/track/" + encodeURIComponent(id)).then(okJson).then(function (d) {
    if (!d || d.id == null) throw new Error("dzr: miss");
    return d.readable !== false;
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
  else if (p.type === "oct" || p.type === "dzr") flow = deezerReadable(p.value).then(function (ok) {
    if (!ok) return isrcFromDeezer(p.value).then(function (isrc) {
      if (!ISRC_RE.test(isrc)) return Promise.reject(new Error("oct: not readable"));
      return ladder(chain, function (q) { return resolveIsrc(isrc, q); });
    });
    return octStream(p.value, chain, flex);
  });
  else if (p.type === "tdl") flow = ladder(chain, function (q) { return retryOnce(function () { return tdlStream(p.value, q); }); });
  else flow = octStream(p.value, chain, flex);
  return flow.then(function (r) {
    r.track = r.track || {};
    r.track.id = id;
    r.streamType = r.streamType || "direct";
    r.codec = r.codec || r.track.codec || null;
    if (r.codec) r.codec = String(r.codec).toLowerCase();
    r.mimeType = r.mimeType || r.track.mimeType || (r.codec ? "audio/" + String(r.codec).toLowerCase() : null);
    r.audioQuality = r.audioQuality || r.track.audioQuality || null;
    r.bitrate = r.bitrate || r.track.bitrate || null;
    r.bitDepth = r.bitDepth || r.track.bitDepth || null;
    r.sampleRate = r.sampleRate || r.track.sampleRate || null;
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
  if (p.type === "tdl") {
    return throttled("tdl", TIDAL_SEARCH + "/album/?id=" + encodeURIComponent(p.value), { headers: { "Accept": "application/json" } }).then(okJson).then(function (d) {
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
  version: "3.2.0",
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
      defaultValue: DEF_QUALITY
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