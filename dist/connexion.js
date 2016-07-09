!function(e){function r(e,r,o){return 4===arguments.length?t.apply(this,arguments):void n(e,{declarative:!0,deps:r,declare:o})}function t(e,r,t,o){n(e,{declarative:!1,deps:r,executingRequire:t,execute:o})}function n(e,r){r.name=e,e in p||(p[e]=r),r.normalizedDeps=r.deps}function o(e,r){if(r[e.groupIndex]=r[e.groupIndex]||[],-1==v.call(r[e.groupIndex],e)){r[e.groupIndex].push(e);for(var t=0,n=e.normalizedDeps.length;n>t;t++){var a=e.normalizedDeps[t],u=p[a];if(u&&!u.evaluated){var d=e.groupIndex+(u.declarative!=e.declarative);if(void 0===u.groupIndex||u.groupIndex<d){if(void 0!==u.groupIndex&&(r[u.groupIndex].splice(v.call(r[u.groupIndex],u),1),0==r[u.groupIndex].length))throw new TypeError("Mixed dependency cycle detected");u.groupIndex=d}o(u,r)}}}}function a(e){var r=p[e];r.groupIndex=0;var t=[];o(r,t);for(var n=!!r.declarative==t.length%2,a=t.length-1;a>=0;a--){for(var u=t[a],i=0;i<u.length;i++){var s=u[i];n?d(s):l(s)}n=!n}}function u(e){return x[e]||(x[e]={name:e,dependencies:[],exports:{},importers:[]})}function d(r){if(!r.module){var t=r.module=u(r.name),n=r.module.exports,o=r.declare.call(e,function(e,r){if(t.locked=!0,"object"==typeof e)for(var o in e)n[o]=e[o];else n[e]=r;for(var a=0,u=t.importers.length;u>a;a++){var d=t.importers[a];if(!d.locked)for(var i=0;i<d.dependencies.length;++i)d.dependencies[i]===t&&d.setters[i](n)}return t.locked=!1,r},r.name);t.setters=o.setters,t.execute=o.execute;for(var a=0,i=r.normalizedDeps.length;i>a;a++){var l,s=r.normalizedDeps[a],c=p[s],v=x[s];v?l=v.exports:c&&!c.declarative?l=c.esModule:c?(d(c),v=c.module,l=v.exports):l=f(s),v&&v.importers?(v.importers.push(t),t.dependencies.push(v)):t.dependencies.push(null),t.setters[a]&&t.setters[a](l)}}}function i(e){var r,t=p[e];if(t)t.declarative?c(e,[]):t.evaluated||l(t),r=t.module.exports;else if(r=f(e),!r)throw new Error("Unable to load dependency "+e+".");return(!t||t.declarative)&&r&&r.__useDefault?r["default"]:r}function l(r){if(!r.module){var t={},n=r.module={exports:t,id:r.name};if(!r.executingRequire)for(var o=0,a=r.normalizedDeps.length;a>o;o++){var u=r.normalizedDeps[o],d=p[u];d&&l(d)}r.evaluated=!0;var c=r.execute.call(e,function(e){for(var t=0,n=r.deps.length;n>t;t++)if(r.deps[t]==e)return i(r.normalizedDeps[t]);throw new TypeError("Module "+e+" not declared as a dependency.")},t,n);c&&(n.exports=c),t=n.exports,t&&t.__esModule?r.esModule=t:r.esModule=s(t)}}function s(r){if(r===e)return r;var t={};if("object"==typeof r||"function"==typeof r)if(g){var n;for(var o in r)(n=Object.getOwnPropertyDescriptor(r,o))&&h(t,o,n)}else{var a=r&&r.hasOwnProperty;for(var o in r)(!a||r.hasOwnProperty(o))&&(t[o]=r[o])}return t["default"]=r,h(t,"__useDefault",{value:!0}),t}function c(r,t){var n=p[r];if(n&&!n.evaluated&&n.declarative){t.push(r);for(var o=0,a=n.normalizedDeps.length;a>o;o++){var u=n.normalizedDeps[o];-1==v.call(t,u)&&(p[u]?c(u,t):f(u))}n.evaluated||(n.evaluated=!0,n.module.execute.call(e))}}function f(e){if(D[e])return D[e];if("@node/"==e.substr(0,6))return y(e.substr(6));var r=p[e];if(!r)throw"Module "+e+" not present.";return a(e),c(e,[]),p[e]=void 0,r.declarative&&h(r.module.exports,"__esModule",{value:!0}),D[e]=r.declarative?r.module.exports:r.esModule}var p={},v=Array.prototype.indexOf||function(e){for(var r=0,t=this.length;t>r;r++)if(this[r]===e)return r;return-1},g=!0;try{Object.getOwnPropertyDescriptor({a:0},"a")}catch(m){g=!1}var h;!function(){try{Object.defineProperty({},"a",{})&&(h=Object.defineProperty)}catch(e){h=function(e,r,t){try{e[r]=t.value||t.get.call(e)}catch(n){}}}}();var x={},y="undefined"!=typeof System&&System._nodeRequire||"undefined"!=typeof require&&require.resolve&&"undefined"!=typeof process&&require,D={"@empty":{}};return function(e,n,o){return function(a){a(function(a){for(var u={_nodeRequire:y,register:r,registerDynamic:t,get:f,set:function(e,r){D[e]=r},newModule:function(e){return e}},d=0;d<n.length;d++)(function(e,r){r&&r.__esModule?D[e]=r:D[e]=s(r)})(n[d],arguments[d]);o(u);var i=f(e[0]);if(e.length>1)for(var d=1;d<e.length;d++)f(e[d]);return i.__useDefault?i["default"]:i})}}}("undefined"!=typeof self?self:global)

(["1"], [], function($__System) {

!function(e){function r(e,r){for(var n=e.split(".");n.length;)r=r[n.shift()];return r}function n(n){if("string"==typeof n)return r(n,e);if(!(n instanceof Array))throw new Error("Global exports must be a string or array.");for(var t={},o=!0,f=0;f<n.length;f++){var i=r(n[f],e);o&&(t["default"]=i,o=!1),t[n[f].split(".").pop()]=i}return t}function t(r){if(Object.keys)Object.keys(e).forEach(r);else for(var n in e)a.call(e,n)&&r(n)}function o(r){t(function(n){if(-1==l.call(s,n)){try{var t=e[n]}catch(o){s.push(n)}r(n,t)}})}var f,i=$__System,a=Object.prototype.hasOwnProperty,l=Array.prototype.indexOf||function(e){for(var r=0,n=this.length;n>r;r++)if(this[r]===e)return r;return-1},s=["_g","sessionStorage","localStorage","clipboardData","frames","frameElement","external","mozAnimationStartTime","webkitStorageInfo","webkitIndexedDB","mozInnerScreenY","mozInnerScreenX"];i.set("@@global-helpers",i.newModule({prepareGlobal:function(r,t,i){var a=e.define;e.define=void 0;var l;if(i){l={};for(var s in i)l[s]=e[s],e[s]=i[s]}return t||(f={},o(function(e,r){f[e]=r})),function(){var r;if(t)r=n(t);else{r={};var i,s;o(function(e,n){f[e]!==n&&"undefined"!=typeof n&&(r[e]=n,"undefined"!=typeof i?s||i===n||(s=!0):i=n)}),r=s?r:i}if(l)for(var u in l)e[u]=l[u];return e.define=a,r}}}))}("undefined"!=typeof self?self:global);
$__System.registerDynamic("2", [], false, function($__require, $__exports, $__module) {
  var _retrieveGlobal = $__System.get("@@global-helpers").prepareGlobal($__module.id, null, null);
  (function() {
    [].forEach || (Array.prototype.forEach = function(g, b) {
      if (this == null) {
        throw new TypeError("this is null or not defined");
      }
      var d,
          c,
          e,
          f = Object(this),
          a = f.length >>> 0;
      if ({}.toString.call(g) != "[object Function]") {
        throw new TypeError(g + " is not a function");
      }
      if (b) {
        d = b;
      }
      c = 0;
      while (c < a) {
        if (c in f) {
          e = f[c];
          g.call(d, e, c, f);
        }
        c++;
      }
    });
    [].map || (Array.prototype.map = function(i, h) {
      if (this == null) {
        throw new TypeError("this is null or not defined");
      }
      if ({}.toString.call(i) != "[object Function]") {
        throw new TypeError(i + " is not a function");
      }
      var b,
          a,
          c,
          d,
          g,
          f = Object(this),
          e = f.length >>> 0;
      h && (b = h);
      a = new Array(e);
      c = 0;
      while (c < e) {
        if (c in f) {
          d = f[c];
          g = i.call(b, d, c, f);
          a[c] = g;
        }
        c++;
      }
      return a;
    });
    [].filter || (Array.prototype.filter = function(b) {
      if (this == null) {
        throw new TypeError("this is null or not defined");
      }
      if (typeof b != "function") {
        throw new TypeError(b + " is not a function");
      }
      var f = Object(this),
          a = f.length >>> 0,
          e = [],
          d = arguments[1],
          c,
          g;
      for (c = 0; c < a; c++) {
        if (c in f) {
          g = f[c];
          if (b.call(d, g, c, f)) {
            e.push(g);
          }
        }
      }
      return e;
    });
    [].some || (Array.prototype.some = function(b) {
      if (this == null) {
        throw new TypeError("this is null or not defined");
      }
      if (typeof b != "function") {
        throw new TypeError(b + " is not a function");
      }
      var e = Object(this),
          a = e.length >>> 0,
          d = arguments[1],
          c;
      for (c = 0; c < a; c++) {
        if (c in e && b.call(d, e[c], c, e)) {
          return true;
        }
      }
      return false;
    });
    (function() {}).bind || (Function.prototype.bind = function(a) {
      if (typeof this !== "function") {
        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
      }
      var e = Array.prototype.slice.call(arguments, 1),
          d = this,
          b = function() {},
          c = function() {
            return d.apply(this instanceof b && a ? this : a, e.concat(Array.prototype.slice.call(arguments)));
          };
      b.prototype = this.prototype;
      c.prototype = new b();
      return c;
    });
    Object.create = Object.create || (function() {
      function F() {}
      return function(o) {
        if (arguments.length != 1) {
          throw new Error("Object.create implementation only accepts one parameter.");
        }
        F.prototype = o;
        return new F();
      };
    }());
    if (!Array.prototype.indexOf) {
      Array.prototype.indexOf = function(searchElement, fromIndex) {
        var k;
        if (this == null) {
          throw new TypeError('"this" is null or not defined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (len === 0) {
          return -1;
        }
        var n = +fromIndex || 0;
        if (Math.abs(n) === Infinity) {
          n = 0;
        }
        if (n >= len) {
          return -1;
        }
        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        while (k < len) {
          if (k in O && O[k] === searchElement) {
            return k;
          }
          k++;
        }
        return -1;
      };
    }
    if (!Object.keys) {
      Object.keys = (function() {
        'use strict';
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
            dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'],
            dontEnumsLength = dontEnums.length;
        return function(obj) {
          if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
            throw new TypeError('Object.keys called on non-object');
          }
          var result = [],
              prop,
              i;
          for (prop in obj) {
            if (hasOwnProperty.call(obj, prop)) {
              result.push(prop);
            }
          }
          if (hasDontEnumBug) {
            for (i = 0; i < dontEnumsLength; i++) {
              if (hasOwnProperty.call(obj, dontEnums[i])) {
                result.push(dontEnums[i]);
              }
            }
          }
          return result;
        };
      }());
    }
    if (('document' in this) && document.documentElement && !document.documentElement.insertAdjacentHTML) {
      HTMLElement.prototype.insertAdjacentHTML = function(position, text) {
        var node,
            elem = this,
            htmlContainer = document.createElement('div'),
            docFragment = document.createDocumentFragment();
        htmlContainer.innerHTML = text;
        while (node = htmlContainer.firstChild) {
          docFragment.appendChild(node);
        }
        switch (position.toLowerCase()) {
          case 'beforebegin':
            elem.parentNode.insertBefore(docFragment, elem);
            break;
          case 'afterbegin':
            elem.insertBefore(docFragment, elem.firstChild);
            break;
          case 'beforeend':
            elem.appendChild(docFragment);
            break;
          case 'afterend':
            elem.parentNode.insertBefore(docFragment, elem.nextSibling);
            break;
        }
        ;
      };
    }
    ;
  })();
  return _retrieveGlobal();
});

$__System.registerDynamic("3", [], false, function($__require, $__exports, $__module) {
  var _retrieveGlobal = $__System.get("@@global-helpers").prepareGlobal($__module.id, null, null);
  (function() {
    (function(e) {
      function f(a, c) {
        function b(a) {
          if (!this || this.constructor !== b)
            return new b(a);
          this._keys = [];
          this._values = [];
          this._itp = [];
          this.objectOnly = c;
          a && v.call(this, a);
        }
        c || w(a, "size", {get: x});
        a.constructor = b;
        b.prototype = a;
        return b;
      }
      function v(a) {
        this.add ? a.forEach(this.add, this) : a.forEach(function(a) {
          this.set(a[0], a[1]);
        }, this);
      }
      function d(a) {
        this.has(a) && (this._keys.splice(b, 1), this._values.splice(b, 1), this._itp.forEach(function(a) {
          b < a[0] && a[0]--;
        }));
        return -1 < b;
      }
      function m(a) {
        return this.has(a) ? this._values[b] : void 0;
      }
      function n(a, c) {
        if (this.objectOnly && c !== Object(c))
          throw new TypeError("Invalid value used as weak collection key");
        if (c != c || 0 === c)
          for (b = a.length; b-- && !y(a[b], c); )
            ;
        else
          b = a.indexOf(c);
        return -1 < b;
      }
      function p(a) {
        return n.call(this, this._values, a);
      }
      function q(a) {
        return n.call(this, this._keys, a);
      }
      function r(a, c) {
        this.has(a) ? this._values[b] = c : this._values[this._keys.push(a) - 1] = c;
        return this;
      }
      function t(a) {
        this.has(a) || this._values.push(a);
        return this;
      }
      function h() {
        (this._keys || 0).length = this._values.length = 0;
      }
      function z() {
        return k(this._itp, this._keys);
      }
      function l() {
        return k(this._itp, this._values);
      }
      function A() {
        return k(this._itp, this._keys, this._values);
      }
      function B() {
        return k(this._itp, this._values, this._values);
      }
      function k(a, c, b) {
        var g = [0],
            e = !1;
        a.push(g);
        return {next: function() {
            var f,
                d = g[0];
            !e && d < c.length ? (f = b ? [c[d], b[d]] : c[d], g[0]++) : (e = !0, a.splice(a.indexOf(g), 1));
            return {
              done: e,
              value: f
            };
          }};
      }
      function x() {
        return this._values.length;
      }
      function u(a, c) {
        for (var b = this.entries(); ; ) {
          var d = b.next();
          if (d.done)
            break;
          a.call(c, d.value[1], d.value[0], this);
        }
      }
      var b,
          w = Object.defineProperty,
          y = function(a, b) {
            return isNaN(a) ? isNaN(b) : a === b;
          };
      "undefined" == typeof WeakMap && (e.WeakMap = f({
        "delete": d,
        clear: h,
        get: m,
        has: q,
        set: r
      }, !0));
      "undefined" != typeof Map && "function" === typeof(new Map).values && (new Map).values().next || (e.Map = f({
        "delete": d,
        has: q,
        get: m,
        set: r,
        keys: z,
        values: l,
        entries: A,
        forEach: u,
        clear: h
      }));
      "undefined" != typeof Set && "function" === typeof(new Set).values && (new Set).values().next || (e.Set = f({
        has: p,
        add: t,
        "delete": d,
        clear: h,
        keys: l,
        values: l,
        entries: B,
        forEach: u
      }));
      "undefined" == typeof WeakSet && (e.WeakSet = f({
        "delete": d,
        add: t,
        clear: h,
        has: p
      }, !0));
    })("undefined" != typeof exports && "undefined" != typeof global ? global : window);
  })();
  return _retrieveGlobal();
});

$__System.registerDynamic("4", ["5", "6", "7"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var environment = $__require('5'),
      emitter = $__require('6'),
      ConnexionEvent = $__require('7');
  var channel = exports,
      eventKey = ConnexionEvent.key,
      emitterEmit = emitter.emit,
      globalScope = environment.global,
      isNodeJs = environment.isNodeJs,
      connextionMessageRegExp = /^__([A-Za-z]+?)__:/;
  var whenGuiReady = new Promise(function(resolve) {
    if (globalScope.process) {
      var timerId = setInterval(function() {
        if (globalScope.window) {
          clearInterval(timerId);
          var gui = globalScope.window.nwDispatcher.requireNwGui();
          resolve(gui);
        }
      }, 10);
    }
  });
  channel.getAllChildWindows = function(topWin) {
    var wins = [],
        frames = topWin.frames,
        win,
        i = frames.length;
    while (i--) {
      win = frames[i];
      wins.push(win);
      wins = wins.concat(channel.getAllChildWindows(win));
    }
    return wins;
  };
  channel.getCurrentNWWindow = function() {
    return whenGuiReady.then(function(gui) {
      return gui.Window.get();
    });
  };
  channel.sendMessage = function(connexionMessage) {
    var browserWindow = globalScope.window || {},
        location = browserWindow.location,
        origin = location && (location.origin || (location.protocol + '//' + location.host)) || '*',
        browserFrames = browserWindow.top && [browserWindow.top].concat(channel.getAllChildWindows(browserWindow.top)) || [];
    origin = '*';
    if (isNodeJs) {
      channel.getCurrentNWWindow().then(function(nwWindow) {
        browserFrames.forEach(function(win) {
          nwWindow.eval(win.frameElement || null, 'window.postMessage(\'' + connexionMessage + '\', "' + origin + '");');
        });
      });
    } else {
      browserFrames.forEach(function(win) {
        try {
          win.postMessage(connexionMessage, origin);
        } catch (err) {
          console.error(err, connexionMessage);
        }
      });
    }
  };
  channel.sendEvent = function(event) {
    var connexionMessage = channel._createEvent(event);
    channel.sendMessage(connexionMessage);
  };
  channel.sendSetup = function(setup) {
    var connexionMessage = channel._createSetup(setup);
    channel.sendMessage(connexionMessage);
  };
  channel.sendSetupResponse = function(setup) {
    var connexionMessage = channel._createSetupResponse(setup);
    channel.sendMessage(connexionMessage);
  };
  channel.onMessage = function(handler, messageType, once) {
    var browserWindow = globalScope.window;
    if (browserWindow && browserWindow.addEventListener) {
      browserWindow.addEventListener('message', function onMessagePosted(e) {
        var isMessageEventWorking = this.MessageEvent && this.MessageEvent.length,
            event = isMessageEventWorking ? (new this.MessageEvent('message', e)) : e,
            message = event.data,
            connectionCretaria,
            connectionType,
            connectionMatch,
            data;
        if (message && typeof message === 'string') {
          connectionMatch = message.match(connextionMessageRegExp);
          if (connectionMatch) {
            connectionCretaria = connectionMatch[0];
            connectionType = connectionMatch[1];
            if (connectionType === messageType) {
              data = JSON.parse(message.substr(connectionCretaria.length));
            }
          }
        }
        if (data && ((('key' in data) && data.key !== eventKey) || (data.length && data[0].event.key !== eventKey))) {
          if (once) {
            this.removeEventListener('message', onMessagePosted, false);
          }
          handler(data);
        }
      }, false);
    }
    browserWindow = undefined;
  };
  channel.onEvent = function(handler) {
    return channel.onMessage(function(event) {
      if (event && event.key !== eventKey) {
        handler(event);
      }
    }, 'connexionEvent');
  };
  channel.onSetup = function(handler) {
    return channel.onMessage(handler, 'connexionSetup');
  };
  channel.onceSetupResponse = function(handler) {
    return channel.onMessage(handler, 'connexionSetupResponse', true);
  };
  channel.invokeEvent = function(event) {
    return emitterEmit.call(emitter, event);
  };
  channel._createEvent = function(event) {
    return '__connexionEvent__:' + JSON.stringify(event);
  };
  channel._createSetup = function(setupData) {
    return '__connexionSetup__:' + JSON.stringify([{event: {key: eventKey}}]);
  };
  channel._createSetupResponse = function(setupData) {
    return '__connexionSetupResponse__:' + JSON.stringify(setupData);
  };
  channel.getStreamsData = function() {
    var eventStreams = emitter.subjects,
        eventTypes = Object.keys(eventStreams);
    return eventTypes.map(function(eventType) {
      var stream = eventStreams[eventType];
      return {
        name: eventType,
        event: stream.value
      };
    });
  };
  channel.setStreamsData = function(streamsData) {
    var eventStreams = emitter.subjects;
    streamsData.forEach(function(data) {
      var name = data.name,
          event = data.event,
          stream,
          streamValue;
      if (!name || name === '*') {
        return;
      }
      if (!event.timeStamp) {
        return;
      }
      if (!(name in eventStreams)) {
        channel.invokeEvent(event);
      } else {
        stream = eventStreams[name];
        streamValue = stream.value;
        if (event.timeStamp > streamValue.timeStamp) {
          channel.invokeEvent(event);
        }
      }
    });
  };
  channel.attachMessageHandlers = function() {
    channel.onEvent(channel.invokeEvent);
    channel.onSetup(function(setup) {
      channel.sendSetupResponse(channel.getStreamsData());
      channel.setStreamsData(setup);
    });
    channel.onceSetupResponse(channel.setStreamsData);
  };
  channel.sendSetup(channel.getStreamsData());
  emitter.emit = function(type, detail) {
    var event = emitterEmit.call(emitter, type, detail);
    channel.sendEvent(event);
    return event;
  };
  if (isNodeJs) {
    channel.getCurrentNWWindow().then(function(win) {
      win.on('loaded', function() {
        var browserWindow = globalScope.window;
        if (!browserWindow.__ConnexionNodeChannel) {
          browserWindow.__ConnexionNodeChannel = true;
          channel.attachMessageHandlers();
        }
      });
    });
  } else {
    channel.attachMessageHandlers();
  }
  return module.exports;
});

$__System.registerDynamic("8", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var stack = [],
      ids = {},
      idCounter = 0,
      implementation,
      createTask,
      cancelTask = function() {};
  if (typeof Promise !== 'undefined') {
    createTask = function(callback) {
      new Promise(function(resolve, reject) {
        implementation = {reject: reject};
        resolve();
      }).then(callback)['catch'](function(err) {
        console.error(err);
      });
    };
    cancelTask = function() {
      implementation.reject();
    };
  } else {
    createTask = function(callback) {
      implementation = setTimeout(callback, 0);
    };
    cancelTask = function() {
      clearTimeout(implementation);
    };
  }
  exports.setAsync = function(taskFunc) {
    if (typeof taskFunc !== 'function') {
      return;
    }
    var id = idCounter++;
    ids[id] = taskFunc;
    if (stack.length) {
      stack.push(taskFunc);
    } else {
      stack.push(taskFunc);
      createTask(function() {
        var task;
        while (stack.length) {
          task = stack.shift();
          task();
        }
      });
    }
    return id;
  };
  exports.clearAsync = function(id) {
    if (typeof id !== 'number' || !(id in ids) || !stack.length) {
      return;
    }
    var task,
        i = -1;
    while (++i in stack) {
      task = stack[i];
      if (task === ids[id]) {
        stack.splice(i, 1);
        delete ids[id];
      }
    }
    if (!stack.length) {
      cancelTask();
    }
  };
  return module.exports;
});

$__System.registerDynamic("7", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var ConnexionEvent = function(origin) {
    this.emitter = origin && origin.emitter || '';
    this.scope = origin && origin.scope || '';
    this.type = (origin && origin.type) || '*';
    this.timeStamp = (origin && ('timeStamp' in origin)) ? origin.timeStamp : new Date().getTime();
    this.detail = origin && origin.detail;
    this.detail = (this.detail && typeof this.detail === 'object') ? this.detail : {};
    this.key = ConnexionEvent.key;
  };
  ConnexionEvent.key = Math.round(Math.random() * Math.pow(10, 15));
  module.exports = ConnexionEvent;
  return module.exports;
});

$__System.registerDynamic("5", [], true, function($__require, exports, module) {
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __filename = 'environment.js',
      __dirname = '';
  (function(self, nodeGlobal, browserWindow, undefined) {
    'use strict';
    var window = self.window || browserWindow || {},
        location = window.location || {},
        global = nodeGlobal || (('top' in window) ? (window.top.global || {}) : {}),
        isNodeJs = ('require' in global) && ('process' in global) && (typeof __dirname !== 'undefined') && (global.global === global);
    exports.window = window;
    exports.global = global;
    exports.location = location;
    exports.isNodeJs = isNodeJs;
    exports.undefined = undefined;
  }(this, (typeof global !== 'undefined') ? global : null, (typeof window !== 'undefined') ? window : null));
  return module.exports;
});

$__System.registerDynamic("9", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var Observable = function(initialValue) {
    this.value = initialValue;
    this.observers = [];
  };
  Observable.prototype.emit = function(value) {
    var i = -1,
        observers = this.observers;
    this.value = value;
    while (++i in observers) {
      observers[i](value);
    }
    return this;
  };
  Observable.prototype.listen = function(callback) {
    this.observers.push(callback);
    return this;
  };
  Observable.prototype.observe = function(callback) {
    this.observers.push(callback);
    callback(this.value);
    return this;
  };
  Observable.prototype.unsubscribe = function(callback) {
    var index;
    if (callback === undefined) {
      this.observers.length = 0;
    } else {
      index = this.observers.indexOf(callback);
      while (~index) {
        this.observers.splice(index, 1);
        index = this.observers.indexOf(callback);
      }
    }
    return this;
  };
  module.exports = Observable;
  return module.exports;
});

$__System.registerDynamic("6", ["8", "7", "5", "9"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var setAsyncTask = $__require('8').setAsync,
      ConnexionEvent = $__require('7'),
      environment = $__require('5'),
      Observable = $__require('9'),
      isNodeJs = environment.isNodeJs;
  function createObserver(callback) {
    var observer = function(event) {
      callback(event.detail, event);
    };
    observer.callback = callback;
    return observer;
  }
  var Emitter = function() {
    this.subjects = Object.create(null);
    this.subscriptions = Object.create(null);
  };
  Emitter.prototype._ensureSubjectExists = function(name) {
    var subject = this.subjects[name];
    if (!subject) {
      subject = new Observable(new ConnexionEvent({
        type: name,
        timeStamp: 0
      }));
      this.subscriptions[name] = new WeakMap();
      this.subjects[name] = subject;
    }
    return subject;
  };
  Emitter.prototype._ensureSubjectDestroyed = function(name) {
    var subject = this.subjects[name];
    if (subject) {
      this.subscriptions[name] = undefined;
      this.subjects[name] = undefined;
    }
    return subject;
  };
  Emitter.prototype.emit = function(eventType, detail) {
    var subject,
        commonSubject,
        eventData = eventType,
        event;
    if ((typeof eventType === 'string') || (eventType instanceof String)) {
      event = new ConnexionEvent({
        type: eventType,
        detail: detail,
        scope: isNodeJs ? 'nodejs' : 'window',
        emitter: isNodeJs ? 'nodejs' : (environment.global.name || '')
      });
    } else if ((typeof eventData === 'object') && !(eventData instanceof Array)) {
      event = new ConnexionEvent(eventData);
      eventType = event.type;
    }
    subject = this._ensureSubjectExists(eventType);
    commonSubject = this._ensureSubjectExists('*');
    setAsyncTask(subject.emit.bind(subject, event));
    if (eventType !== '*') {
      setAsyncTask(commonSubject.emit.bind(commonSubject, event));
    }
    return event;
  };
  Emitter.prototype.listen = function(eventType, handler) {
    var listeners,
        subject,
        observer,
        observers;
    if (typeof eventType === 'object' && eventType) {
      listeners = eventType;
      for (eventType in listeners) {
        this.listen(eventType, listeners[eventType]);
      }
    } else if (eventType && handler) {
      subject = this._ensureSubjectExists(eventType);
      observer = createObserver(handler);
      subject.listen(observer);
      observers = this.subscriptions[eventType].get(handler) || [];
      observers.push(observer);
      this.subscriptions[eventType].set(handler, observers);
    }
    return observer;
  };
  Emitter.prototype.observe = function(eventType, handler) {
    var listeners,
        subject,
        observer,
        observers;
    if (typeof eventType === 'object' && eventType) {
      listeners = eventType;
      for (eventType in listeners) {
        this.observe(eventType, listeners[eventType]);
      }
    } else if (eventType && handler) {
      subject = this._ensureSubjectExists(eventType);
      observer = createObserver(handler);
      subject.observe(observer);
      observers = this.subscriptions[eventType].get(handler) || [];
      observers.push(observer);
      this.subscriptions[eventType].set(handler, observers);
    }
    return observer;
  };
  Emitter.prototype.unsubscribe = function(eventType, handler) {
    var listeners,
        subject,
        subjects,
        observer,
        observers,
        i;
    if (!eventType && !handler) {
      subjects = this.subjects;
      for (eventType in subjects) {
        this.unsubscribe(eventType);
      }
    } else if (typeof eventType === 'object' && eventType) {
      listeners = eventType;
      for (eventType in listeners) {
        this.unsubscribe(eventType, listeners[eventType]);
      }
    } else if (eventType && !handler) {
      subject = this.subjects[eventType];
      if (subject) {
        subject.unsubscribe();
        this._ensureSubjectDestroyed(eventType);
      }
    } else if (eventType && handler) {
      subject = this.subjects[eventType];
      listeners = this.subscriptions[eventType];
      if (listeners) {
        if ('callback' in handler) {
          observer = handler;
          handler = observer.callback;
          subject.unsubscribe(observer);
          observer.callback = undefined;
          observers = listeners.get(handler);
          if (observers) {
            i = observers.indexOf(observer);
            if (~i) {
              observers.splice(i, 1);
            }
          }
        } else {
          observers = listeners.get(handler);
          if (observers) {
            i = -1;
            while (++i in observers) {
              observer = observers[i];
              setAsyncTask(subject.unsubscribe.bind(subject, observer));
              observer.callback = undefined;
            }
            listeners.delete(handler);
          }
        }
      }
    }
    return this;
  };
  module.exports = new Emitter();
  return module.exports;
});

$__System.registerDynamic("1", ["2", "3", "4", "5", "6"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  'format cjs';
  var connexion = exports;
  $__require('2');
  $__require('3');
  connexion.version = '0.4.2';
  connexion.chanel = $__require('4');
  var DOMWindow = $__require('5').window,
      emitter = $__require('6');
  connexion.listen = function(type, handler) {
    emitter.listen(type, handler);
    return this;
  };
  connexion.observe = function(type, handler) {
    emitter.observe(type, handler);
    return this;
  };
  connexion.unsubscribe = function(type, handler) {
    emitter.unsubscribe(type, handler);
    return this;
  };
  connexion.emit = function(type, detail) {
    emitter.emit(type, detail);
    return this;
  };
  DOMWindow.connexion = connexion;
  return module.exports;
});

})
(function(factory) {
  if (typeof define == 'function' && define.amd)
    define([], factory);
  else if (typeof module == 'object' && module.exports && typeof require == 'function')
    module.exports = factory();
  else
    factory();
});
//# sourceMappingURL=connexion.js.map