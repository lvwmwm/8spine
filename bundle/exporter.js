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

  function makeRnShareFilter(m) {
    var srcF = null;
    try { srcF = m.bySourceSubstring("normalizeShareOpenOptions"); } catch (e) {}
    return function (exps, meta) {
      function good(x) {
        if (!x || typeof x !== "object") return false;
        return typeof x.open === "function" &&
          typeof x.shareSingle === "function" &&
          typeof x.isPackageInstalled === "function";
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

  function resolveRNShare() {
    
    
    return memoResolve("rnshare", function () {
      return findModuleAsyncMulti([
        makeRnShareFilter,
        function (m) { return m.bySourceSubstring("normalizeShareOpenOptions"); }
      ], unwrapRnShare);
    });
  }

  function unwrapRnShare(ex) {
    if (ex && typeof ex.open === "function" && typeof ex.shareSingle === "function") return ex;
    if (ex && ex.default && typeof ex.default.open === "function" && typeof ex.default.shareSingle === "function") return ex.default;
    return null;
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
      return buildZip(spine, tracks, onProgress, metaFormat).then(function (bz) {
        if (!bz) {
          return Promise.reject(new Error("Zip build failed"));
        }
        var zipBytes = bz.zip || bz.b64;
        if (!zipBytes) {
          return Promise.reject(new Error("Zip build failed"));
        }
        return writeZip(spine, zipBytes).then(function (w) {
          return {
            mode: "zip",
            uri: w.uri,
            name: w.name,
            count: tracks.length,
            tracks: tracks,
            manifest: bz.manifest,
            metaFormat: bz.metaFormat,
            zip: bz.zip,
            b64: null,
            exportDir: null
          };
        });
      });
    });
  }

  
  
  function shareZip(spine, uri, opts) {
    opts = opts || {};
    var isList = Array.isArray(uri);
    var uris = isList ? uri : [uri];
    if (isList) {
      return shareList(spine, uris, opts);
    }
    return shareSingle(spine, uris[0], opts);
  }

  function shareList(spine, uris, opts) {
    return resolveRNShare().then(function (rn) {
      var after = { ok: false };
      if (rn && typeof rn.open === "function") {
        return Promise.resolve(rn.open({
          urls: uris,
          type: opts.mimeType || "audio/*",
          title: opts.dialogTitle || "Export music",
          failOnCancel: false
        })).then(function (r) {
          after.ok = !!(r && (r.success || r.dismissedAction));
          after.reason = (!after.ok && r && r.message) ? String(r.message) : null;
          return cleanupExport(spine, opts, after);
        }).catch(function (e) {
          after.ok = false;
          after.reason = (e && e.message) || String(e);
          return after;
        });
      }
      return shareSingle(spine, uris[0], opts).then(function (r) {
        after.ok = r.ok;
        after.reason = r.reason;
        return after;
      });
    });
  }

  function cleanupExport(spine, opts, after) {
    if (opts.exportDir && spine && spine.storage) {
      var cfs = spine.storage.fs();
      if (cfs && typeof cfs.deleteAsync === "function") {
        after.cleanup = cfs.deleteAsync(opts.exportDir, { idempotent: true }).catch(function () {});
      }
    }
    return after;
  }

  function shareSingle(spine, uri, opts) {
    opts = opts || {};
    return resolveSharing().then(function (sharing) {
      if (!sharing || typeof sharing.shareAsync !== "function") {
        return { ok: false, reason: "share-nao-disponivel" };
      }
      var avail = (typeof sharing.isAvailableAsync === "function")
        ? Promise.resolve(sharing.isAvailableAsync())
        : Promise.resolve(true);
      return Promise.resolve(avail).then(function (ok) {
        if (!ok) return { ok: false, reason: "share-indisponivel" };
        return Promise.resolve(sharing.shareAsync(uri, {
          mimeType: opts.mimeType || "application/zip",
          dialogTitle: opts.dialogTitle || "Export music",
          UTI: opts.uti || "public.zip-archive"
        })).then(function () {
          return { ok: true };
        }).catch(function (e) {
          return { ok: false, reason: (e && e.message) || String(e) };
        });
      });
    });
  }

  
  
  
  
  function warmup() {
    return Promise.all([
      resolveBuffer().catch(function () { return null; }),
      resolveSharing().catch(function () { return null; }),
      resolveRNShare().catch(function () { return null; })
    ]).then(function (r) {
      return { buffer: !!r[0], sharing: !!r[1], rnshare: !!r[2] };
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
