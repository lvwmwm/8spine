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
