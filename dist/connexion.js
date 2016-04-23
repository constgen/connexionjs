"format amd";
(function(global) {

  var defined = {};

  // indexOf polyfill for IE8
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++)
      if (this[i] === item)
        return i;
    return -1;
  }

  var getOwnPropertyDescriptor = true;
  try {
    Object.getOwnPropertyDescriptor({ a: 0 }, 'a');
  }
  catch(e) {
    getOwnPropertyDescriptor = false;
  }

  var defineProperty;
  (function () {
    try {
      if (!!Object.defineProperty({}, 'a', {}))
        defineProperty = Object.defineProperty;
    }
    catch (e) {
      defineProperty = function(obj, prop, opt) {
        try {
          obj[prop] = opt.value || opt.get.call(obj);
        }
        catch(e) {}
      }
    }
  })();

  function register(name, deps, declare) {
    if (arguments.length === 4)
      return registerDynamic.apply(this, arguments);
    doRegister(name, {
      declarative: true,
      deps: deps,
      declare: declare
    });
  }

  function registerDynamic(name, deps, executingRequire, execute) {
    doRegister(name, {
      declarative: false,
      deps: deps,
      executingRequire: executingRequire,
      execute: execute
    });
  }

  function doRegister(name, entry) {
    entry.name = name;

    // we never overwrite an existing define
    if (!(name in defined))
      defined[name] = entry;

    // we have to normalize dependencies
    // (assume dependencies are normalized for now)
    // entry.normalizedDeps = entry.deps.map(normalize);
    entry.normalizedDeps = entry.deps;
  }


  function buildGroups(entry, groups) {
    groups[entry.groupIndex] = groups[entry.groupIndex] || [];

    if (indexOf.call(groups[entry.groupIndex], entry) != -1)
      return;

    groups[entry.groupIndex].push(entry);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];

      // not in the registry means already linked / ES6
      if (!depEntry || depEntry.evaluated)
        continue;

      // now we know the entry is in our unlinked linkage group
      var depGroupIndex = entry.groupIndex + (depEntry.declarative != entry.declarative);

      // the group index of an entry is always the maximum
      if (depEntry.groupIndex === undefined || depEntry.groupIndex < depGroupIndex) {

        // if already in a group, remove from the old group
        if (depEntry.groupIndex !== undefined) {
          groups[depEntry.groupIndex].splice(indexOf.call(groups[depEntry.groupIndex], depEntry), 1);

          // if the old group is empty, then we have a mixed depndency cycle
          if (groups[depEntry.groupIndex].length == 0)
            throw new TypeError("Mixed dependency cycle detected");
        }

        depEntry.groupIndex = depGroupIndex;
      }

      buildGroups(depEntry, groups);
    }
  }

  function link(name) {
    var startEntry = defined[name];

    startEntry.groupIndex = 0;

    var groups = [];

    buildGroups(startEntry, groups);

    var curGroupDeclarative = !!startEntry.declarative == groups.length % 2;
    for (var i = groups.length - 1; i >= 0; i--) {
      var group = groups[i];
      for (var j = 0; j < group.length; j++) {
        var entry = group[j];

        // link each group
        if (curGroupDeclarative)
          linkDeclarativeModule(entry);
        else
          linkDynamicModule(entry);
      }
      curGroupDeclarative = !curGroupDeclarative; 
    }
  }

  // module binding records
  var moduleRecords = {};
  function getOrCreateModuleRecord(name) {
    return moduleRecords[name] || (moduleRecords[name] = {
      name: name,
      dependencies: [],
      exports: {}, // start from an empty module and extend
      importers: []
    })
  }

  function linkDeclarativeModule(entry) {
    // only link if already not already started linking (stops at circular)
    if (entry.module)
      return;

    var module = entry.module = getOrCreateModuleRecord(entry.name);
    var exports = entry.module.exports;

    var declaration = entry.declare.call(global, function(name, value) {
      module.locked = true;

      if (typeof name == 'object') {
        for (var p in name)
          exports[p] = name[p];
      }
      else {
        exports[name] = value;
      }

      for (var i = 0, l = module.importers.length; i < l; i++) {
        var importerModule = module.importers[i];
        if (!importerModule.locked) {
          for (var j = 0; j < importerModule.dependencies.length; ++j) {
            if (importerModule.dependencies[j] === module) {
              importerModule.setters[j](exports);
            }
          }
        }
      }

      module.locked = false;
      return value;
    }, entry.name);

    module.setters = declaration.setters;
    module.execute = declaration.execute;

    // now link all the module dependencies
    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];
      var depModule = moduleRecords[depName];

      // work out how to set depExports based on scenarios...
      var depExports;

      if (depModule) {
        depExports = depModule.exports;
      }
      else if (depEntry && !depEntry.declarative) {
        depExports = depEntry.esModule;
      }
      // in the module registry
      else if (!depEntry) {
        depExports = load(depName);
      }
      // we have an entry -> link
      else {
        linkDeclarativeModule(depEntry);
        depModule = depEntry.module;
        depExports = depModule.exports;
      }

      // only declarative modules have dynamic bindings
      if (depModule && depModule.importers) {
        depModule.importers.push(module);
        module.dependencies.push(depModule);
      }
      else
        module.dependencies.push(null);

      // run the setter for this dependency
      if (module.setters[i])
        module.setters[i](depExports);
    }
  }

  // An analog to loader.get covering execution of all three layers (real declarative, simulated declarative, simulated dynamic)
  function getModule(name) {
    var exports;
    var entry = defined[name];

    if (!entry) {
      exports = load(name);
      if (!exports)
        throw new Error("Unable to load dependency " + name + ".");
    }

    else {
      if (entry.declarative)
        ensureEvaluated(name, []);

      else if (!entry.evaluated)
        linkDynamicModule(entry);

      exports = entry.module.exports;
    }

    if ((!entry || entry.declarative) && exports && exports.__useDefault)
      return exports['default'];

    return exports;
  }

  function linkDynamicModule(entry) {
    if (entry.module)
      return;

    var exports = {};

    var module = entry.module = { exports: exports, id: entry.name };

    // AMD requires execute the tree first
    if (!entry.executingRequire) {
      for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
        var depName = entry.normalizedDeps[i];
        var depEntry = defined[depName];
        if (depEntry)
          linkDynamicModule(depEntry);
      }
    }

    // now execute
    entry.evaluated = true;
    var output = entry.execute.call(global, function(name) {
      for (var i = 0, l = entry.deps.length; i < l; i++) {
        if (entry.deps[i] != name)
          continue;
        return getModule(entry.normalizedDeps[i]);
      }
      throw new TypeError('Module ' + name + ' not declared as a dependency.');
    }, exports, module);

    if (output)
      module.exports = output;

    // create the esModule object, which allows ES6 named imports of dynamics
    exports = module.exports;
 
    if (exports && exports.__esModule) {
      entry.esModule = exports;
    }
    else {
      entry.esModule = {};
      
      // don't trigger getters/setters in environments that support them
      if ((typeof exports == 'object' || typeof exports == 'function') && exports !== global) {
        if (getOwnPropertyDescriptor) {
          var d;
          for (var p in exports)
            if (d = Object.getOwnPropertyDescriptor(exports, p))
              defineProperty(entry.esModule, p, d);
        }
        else {
          var hasOwnProperty = exports && exports.hasOwnProperty;
          for (var p in exports) {
            if (!hasOwnProperty || exports.hasOwnProperty(p))
              entry.esModule[p] = exports[p];
          }
         }
       }
      entry.esModule['default'] = exports;
      defineProperty(entry.esModule, '__useDefault', {
        value: true
      });
    }
  }

  /*
   * Given a module, and the list of modules for this current branch,
   *  ensure that each of the dependencies of this module is evaluated
   *  (unless one is a circular dependency already in the list of seen
   *  modules, in which case we execute it)
   *
   * Then we evaluate the module itself depth-first left to right 
   * execution to match ES6 modules
   */
  function ensureEvaluated(moduleName, seen) {
    var entry = defined[moduleName];

    // if already seen, that means it's an already-evaluated non circular dependency
    if (!entry || entry.evaluated || !entry.declarative)
      return;

    // this only applies to declarative modules which late-execute

    seen.push(moduleName);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      if (indexOf.call(seen, depName) == -1) {
        if (!defined[depName])
          load(depName);
        else
          ensureEvaluated(depName, seen);
      }
    }

    if (entry.evaluated)
      return;

    entry.evaluated = true;
    entry.module.execute.call(global);
  }

  // magical execution function
  var modules = {};
  function load(name) {
    if (modules[name])
      return modules[name];

    // node core modules
    if (name.substr(0, 6) == '@node/')
      return require(name.substr(6));

    var entry = defined[name];

    // first we check if this module has already been defined in the registry
    if (!entry)
      throw "Module " + name + " not present.";

    // recursively ensure that the module and all its 
    // dependencies are linked (with dependency group handling)
    link(name);

    // now handle dependency execution in correct order
    ensureEvaluated(name, []);

    // remove from the registry
    defined[name] = undefined;

    // exported modules get __esModule defined for interop
    if (entry.declarative)
      defineProperty(entry.module.exports, '__esModule', { value: true });

    // return the defined module object
    return modules[name] = entry.declarative ? entry.module.exports : entry.esModule;
  };

  return function(mains, depNames, declare) {
    return function(formatDetect) {
      formatDetect(function(deps) {
        var System = {
          _nodeRequire: typeof require != 'undefined' && require.resolve && typeof process != 'undefined' && require,
          register: register,
          registerDynamic: registerDynamic,
          get: load, 
          set: function(name, module) {
            modules[name] = module; 
          },
          newModule: function(module) {
            return module;
          }
        };
        System.set('@empty', {});

        // register external dependencies
        for (var i = 0; i < depNames.length; i++) (function(depName, dep) {
          if (dep && dep.__esModule)
            System.register(depName, [], function(_export) {
              return {
                setters: [],
                execute: function() {
                  for (var p in dep)
                    if (p != '__esModule' && !(typeof p == 'object' && p + '' == 'Module'))
                      _export(p, dep[p]);
                }
              };
            });
          else
            System.registerDynamic(depName, [], false, function() {
              return dep;
            });
        })(depNames[i], arguments[i]);

        // register modules in this bundle
        declare(System);

        // load mains
        var firstLoad = load(mains[0]);
        if (mains.length > 1)
          for (var i = 1; i < mains.length; i++)
            load(mains[i]);

        if (firstLoad.__useDefault)
          return firstLoad['default'];
        else
          return firstLoad;
      });
    };
  };

})(typeof self != 'undefined' ? self : global)
/* (['mainModule'], ['external-dep'], function($__System) {
  System.register(...);
})
(function(factory) {
  if (typeof define && define.amd)
    define(['external-dep'], factory);
  // etc UMD / module pattern
})*/

(["1"], [], function($__System) {

(function(__global) {
  var loader = $__System;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++)
      if (this[i] === item)
        return i;
    return -1;
  }

  function readMemberExpression(p, value) {
    var pParts = p.split('.');
    while (pParts.length)
      value = value[pParts.shift()];
    return value;
  }

  // bare minimum ignores for IE8
  var ignoredGlobalProps = ['_g', 'sessionStorage', 'localStorage', 'clipboardData', 'frames', 'frameElement', 'external', 'mozAnimationStartTime', 'webkitStorageInfo', 'webkitIndexedDB'];

  var globalSnapshot;

  function forEachGlobal(callback) {
    if (Object.keys)
      Object.keys(__global).forEach(callback);
    else
      for (var g in __global) {
        if (!hasOwnProperty.call(__global, g))
          continue;
        callback(g);
      }
  }

  function forEachGlobalValue(callback) {
    forEachGlobal(function(globalName) {
      if (indexOf.call(ignoredGlobalProps, globalName) != -1)
        return;
      try {
        var value = __global[globalName];
      }
      catch (e) {
        ignoredGlobalProps.push(globalName);
      }
      callback(globalName, value);
    });
  }

  loader.set('@@global-helpers', loader.newModule({
    prepareGlobal: function(moduleName, exportName, globals) {
      // disable module detection
      var curDefine = __global.define;
       
      __global.define = undefined;
      __global.exports = undefined;
      if (__global.module && __global.module.exports)
        __global.module = undefined;

      // set globals
      var oldGlobals;
      if (globals) {
        oldGlobals = {};
        for (var g in globals) {
          oldGlobals[g] = __global[g];
          __global[g] = globals[g];
        }
      }

      // store a complete copy of the global object in order to detect changes
      if (!exportName) {
        globalSnapshot = {};

        forEachGlobalValue(function(name, value) {
          globalSnapshot[name] = value;
        });
      }

      // return function to retrieve global
      return function() {
        var globalValue;

        if (exportName) {
          globalValue = readMemberExpression(exportName, __global);
        }
        else {
          var singleGlobal;
          var multipleExports;
          var exports = {};

          forEachGlobalValue(function(name, value) {
            if (globalSnapshot[name] === value)
              return;
            if (typeof value == 'undefined')
              return;
            exports[name] = value;

            if (typeof singleGlobal != 'undefined') {
              if (!multipleExports && singleGlobal !== value)
                multipleExports = true;
            }
            else {
              singleGlobal = value;
            }
          });
          globalValue = multipleExports ? exports : singleGlobal;
        }

        // revert globals
        if (oldGlobals) {
          for (var g in oldGlobals)
            __global[g] = oldGlobals[g];
        }
        __global.define = curDefine;

        return globalValue;
      };
    }
  }));

})(typeof self != 'undefined' ? self : global);

(function() {
  var loader = $__System;
  
  if (typeof window != 'undefined' && typeof document != 'undefined' && window.location)
    var windowOrigin = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');

  loader.set('@@cjs-helpers', loader.newModule({
    getPathVars: function(moduleId) {
      // remove any plugin syntax
      var pluginIndex = moduleId.lastIndexOf('!');
      var filename;
      if (pluginIndex != -1)
        filename = moduleId.substr(0, pluginIndex);
      else
        filename = moduleId;

      var dirname = filename.split('/');
      dirname.pop();
      dirname = dirname.join('/');

      if (filename.substr(0, 8) == 'file:///') {
        filename = filename.substr(7);
        dirname = dirname.substr(7);

        // on windows remove leading '/'
        if (isWindows) {
          filename = filename.substr(1);
          dirname = dirname.substr(1);
        }
      }
      else if (windowOrigin && filename.substr(0, windowOrigin.length) === windowOrigin) {
        filename = filename.substr(windowOrigin.length);
        dirname = dirname.substr(windowOrigin.length);
      }

      return {
        filename: filename,
        dirname: dirname
      };
    }
  }));
})();

$__System.registerDynamic("2", ["3", "4", "5"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var environment = $__require('3'),
      emitter = $__require('4'),
      ConnexionEvent = $__require('5');
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("6", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
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
      }).then(callback).catch(function(err) {
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("5", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var ConnexionEvent = function(origin) {
    this.emitter = origin && origin.emitter || '';
    this.scope = origin && origin.scope || '';
    this.isCanceled = false;
    this.type = (origin && origin.type) || '*';
    this.timeStamp = (origin && ('timeStamp' in origin)) ? origin.timeStamp : new Date().getTime();
    this.detail = origin && origin.detail;
    this.detail = (this.detail && typeof this.detail === 'object') ? this.detail : {};
    this.key = ConnexionEvent.key;
  };
  ConnexionEvent.prototype.cancel = function() {
    this.isCanceled = true;
  };
  ConnexionEvent.key = Math.round(Math.random() * Math.pow(10, 15));
  module.exports = ConnexionEvent;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("3", [], true, function($__require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var $__pathVars = $__System.get('@@cjs-helpers').getPathVars(module.id),
      __filename = $__pathVars.filename,
      __dirname = $__pathVars.dirname;
  (function(self, nodeGlobal, browserWindow, undefined) {
    'use strict';
    var window = self.window || browserWindow || {},
        document = window.document || {},
        location = window.location || {},
        global = nodeGlobal || (('top' in window) ? (window.top.global || {}) : {}),
        isNodeJs = ('require' in global) && ('process' in global) && (typeof __dirname !== 'undefined') && (global.global === global);
    exports.window = window;
    exports.global = global;
    exports.location = location;
    exports.isNodeJs = isNodeJs;
    exports.undefined = undefined;
  }(this, (typeof global !== 'undefined') ? global : null, (typeof window !== 'undefined') ? window : null));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("7", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("8", [], false, function(__require, __exports, __module) {
  var _retrieveGlobal = $__System.get("@@global-helpers").prepareGlobal(__module.id, null, null);
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

$__System.registerDynamic("4", ["6", "5", "3", "7", "8"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var setAsyncTask = $__require('6').setAsync,
      ConnexionEvent = $__require('5'),
      environment = $__require('3'),
      Observable = $__require('7'),
      es6collections = $__require('8'),
      WeakMap = es6collections.WeakMap || environment.global.WeakMap,
      isNodeJs = environment.isNodeJs;
  function createObserver(callback) {
    var observer = function(event) {
      if (event.isCanceled) {
        return;
      }
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
            if (~index) {
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1", ["2", "3", "4"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  'format cjs';
  var connexion = exports;
  connexion.version = '0.4.0';
  connexion.chanel = $__require('2');
  var DOMWindow = $__require('3').window,
      emitter = $__require('4');
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
  global.define = __define;
  return module.exports;
});

})
(function(factory) {
  if (typeof define == 'function' && define.amd)
    define([], factory);
  else
    factory();
});
//# sourceMappingURL=connexion.js.map