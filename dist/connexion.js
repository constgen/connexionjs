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

(function(__global) {
  var loader = $__System;
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++)
      if (this[i] === item)
        return i;
    return -1;
  }

  var commentRegEx = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
  var cjsRequirePre = "(?:^|[^$_a-zA-Z\\xA0-\\uFFFF.])";
  var cjsRequirePost = "\\s*\\(\\s*(\"([^\"]+)\"|'([^']+)')\\s*\\)";
  var fnBracketRegEx = /\(([^\)]*)\)/;
  var wsRegEx = /^\s+|\s+$/g;
  
  var requireRegExs = {};

  function getCJSDeps(source, requireIndex) {

    // remove comments
    source = source.replace(commentRegEx, '');

    // determine the require alias
    var params = source.match(fnBracketRegEx);
    var requireAlias = (params[1].split(',')[requireIndex] || 'require').replace(wsRegEx, '');

    // find or generate the regex for this requireAlias
    var requireRegEx = requireRegExs[requireAlias] || (requireRegExs[requireAlias] = new RegExp(cjsRequirePre + requireAlias + cjsRequirePost, 'g'));

    requireRegEx.lastIndex = 0;

    var deps = [];

    var match;
    while (match = requireRegEx.exec(source))
      deps.push(match[2] || match[3]);

    return deps;
  }

  /*
    AMD-compatible require
    To copy RequireJS, set window.require = window.requirejs = loader.amdRequire
  */
  function require(names, callback, errback, referer) {
    // in amd, first arg can be a config object... we just ignore
    if (typeof names == 'object' && !(names instanceof Array))
      return require.apply(null, Array.prototype.splice.call(arguments, 1, arguments.length - 1));

    // amd require
    if (typeof names == 'string' && typeof callback == 'function')
      names = [names];
    if (names instanceof Array) {
      var dynamicRequires = [];
      for (var i = 0; i < names.length; i++)
        dynamicRequires.push(loader['import'](names[i], referer));
      Promise.all(dynamicRequires).then(function(modules) {
        if (callback)
          callback.apply(null, modules);
      }, errback);
    }

    // commonjs require
    else if (typeof names == 'string') {
      var module = loader.get(names);
      return module.__useDefault ? module['default'] : module;
    }

    else
      throw new TypeError('Invalid require');
  }

  function define(name, deps, factory) {
    if (typeof name != 'string') {
      factory = deps;
      deps = name;
      name = null;
    }
    if (!(deps instanceof Array)) {
      factory = deps;
      deps = ['require', 'exports', 'module'].splice(0, factory.length);
    }

    if (typeof factory != 'function')
      factory = (function(factory) {
        return function() { return factory; }
      })(factory);

    // in IE8, a trailing comma becomes a trailing undefined entry
    if (deps[deps.length - 1] === undefined)
      deps.pop();

    // remove system dependencies
    var requireIndex, exportsIndex, moduleIndex;
    
    if ((requireIndex = indexOf.call(deps, 'require')) != -1) {
      
      deps.splice(requireIndex, 1);

      // only trace cjs requires for non-named
      // named defines assume the trace has already been done
      if (!name)
        deps = deps.concat(getCJSDeps(factory.toString(), requireIndex));
    }

    if ((exportsIndex = indexOf.call(deps, 'exports')) != -1)
      deps.splice(exportsIndex, 1);
    
    if ((moduleIndex = indexOf.call(deps, 'module')) != -1)
      deps.splice(moduleIndex, 1);

    var define = {
      name: name,
      deps: deps,
      execute: function(req, exports, module) {

        var depValues = [];
        for (var i = 0; i < deps.length; i++)
          depValues.push(req(deps[i]));

        module.uri = module.id;

        module.config = function() {};

        // add back in system dependencies
        if (moduleIndex != -1)
          depValues.splice(moduleIndex, 0, module);
        
        if (exportsIndex != -1)
          depValues.splice(exportsIndex, 0, exports);
        
        if (requireIndex != -1) 
          depValues.splice(requireIndex, 0, function(names, callback, errback) {
            if (typeof names == 'string' && typeof callback != 'function')
              return req(names);
            return require.call(loader, names, callback, errback, module.id);
          });

        var output = factory.apply(exportsIndex == -1 ? __global : exports, depValues);

        if (typeof output == 'undefined' && module)
          output = module.exports;

        if (typeof output != 'undefined')
          return output;
      }
    };

    // anonymous define
    if (!name) {
      // already defined anonymously -> throw
      if (lastModule.anonDefine)
        throw new TypeError('Multiple defines for anonymous module');
      lastModule.anonDefine = define;
    }
    // named define
    else {
      // if we don't have any other defines,
      // then let this be an anonymous define
      // this is just to support single modules of the form:
      // define('jquery')
      // still loading anonymously
      // because it is done widely enough to be useful
      if (!lastModule.anonDefine && !lastModule.isBundle) {
        lastModule.anonDefine = define;
      }
      // otherwise its a bundle only
      else {
        // if there is an anonDefine already (we thought it could have had a single named define)
        // then we define it now
        // this is to avoid defining named defines when they are actually anonymous
        if (lastModule.anonDefine && lastModule.anonDefine.name)
          loader.registerDynamic(lastModule.anonDefine.name, lastModule.anonDefine.deps, false, lastModule.anonDefine.execute);

        lastModule.anonDefine = null;
      }

      // note this is now a bundle
      lastModule.isBundle = true;

      // define the module through the register registry
      loader.registerDynamic(name, define.deps, false, define.execute);
    }
  }
  define.amd = {};

  // adds define as a global (potentially just temporarily)
  function createDefine(loader) {
    lastModule.anonDefine = null;
    lastModule.isBundle = false;

    // ensure no NodeJS environment detection
    var oldModule = __global.module;
    var oldExports = __global.exports;
    var oldDefine = __global.define;

    __global.module = undefined;
    __global.exports = undefined;
    __global.define = define;

    return function() {
      __global.define = oldDefine;
      __global.module = oldModule;
      __global.exports = oldExports;
    };
  }

  var lastModule = {
    isBundle: false,
    anonDefine: null
  };

  loader.set('@@amd-helpers', loader.newModule({
    createDefine: createDefine,
    require: require,
    define: define,
    lastModule: lastModule
  }));
  loader.amdDefine = define;
  loader.amdRequire = require;
})(typeof self != 'undefined' ? self : global);

"bundle";
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
  var Stack = [],
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
      }).then(callback);
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
  exports.setAsyncTask = function(taskFunc) {
    if (typeof taskFunc !== 'function') {
      return;
    }
    var id = idCounter++;
    ids[id] = taskFunc;
    if (Stack.length) {
      Stack.push(taskFunc);
    } else {
      Stack.push(taskFunc);
      createTask(function() {
        var task;
        while (Stack.length) {
          task = Stack.shift();
          task();
        }
      });
    }
    return id;
  };
  exports.clearAsyncTask = function(id) {
    if (typeof id !== 'number' || !(id in ids) || !Stack.length) {
      return;
    }
    var task,
        i = -1;
    while (++i in Stack) {
      task = Stack[i];
      if (task === ids[id]) {
        Stack.splice(i, 1);
        delete ids[id];
      }
    }
    if (!Stack.length) {
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
    if (!('head' in document)) {
      document.head = (document.getElementsByTagName && document.getElementsByTagName('head')[0]) || document.documentElement;
    }
    if ('createElement' in document) {
      document.createElement('template');
      document.createElement('content');
    }
    exports.window = window;
    exports.global = global;
    exports.location = location;
    exports.isNodeJs = isNodeJs;
    exports.undefined = undefined;
  }(this, (typeof global !== 'undefined') ? global : null, (typeof window !== 'undefined') ? window : null));
  global.define = __define;
  return module.exports;
});

(function() {
var _removeDefine = $__System.get("@@amd-helpers").createDefine();
;
(function(undefined) {
  var objectTypes = {
    'function': true,
    'object': true
  };
  function checkGlobal(value) {
    return (value && value.Object === Object) ? value : null;
  }
  var freeExports = (objectTypes[typeof exports] && exports && !exports.nodeType) ? exports : null;
  var freeModule = (objectTypes[typeof module] && module && !module.nodeType) ? module : null;
  var freeGlobal = checkGlobal(freeExports && freeModule && typeof global === 'object' && global);
  var freeSelf = checkGlobal(objectTypes[typeof self] && self);
  var freeWindow = checkGlobal(objectTypes[typeof window] && window);
  var moduleExports = (freeModule && freeModule.exports === freeExports) ? freeExports : null;
  var thisGlobal = checkGlobal(objectTypes[typeof this] && this);
  var root = freeGlobal || ((freeWindow !== (thisGlobal && thisGlobal.window)) && freeWindow) || freeSelf || thisGlobal || Function('return this')();
  var Rx = {
    internals: {},
    config: {Promise: root.Promise},
    helpers: {}
  };
  var noop = Rx.helpers.noop = function() {},
      identity = Rx.helpers.identity = function(x) {
        return x;
      },
      defaultNow = Rx.helpers.defaultNow = Date.now,
      defaultComparer = Rx.helpers.defaultComparer = function(x, y) {
        return isEqual(x, y);
      },
      defaultSubComparer = Rx.helpers.defaultSubComparer = function(x, y) {
        return x > y ? 1 : (x < y ? -1 : 0);
      },
      defaultKeySerializer = Rx.helpers.defaultKeySerializer = function(x) {
        return x.toString();
      },
      defaultError = Rx.helpers.defaultError = function(err) {
        throw err;
      },
      isPromise = Rx.helpers.isPromise = function(p) {
        return !!p && typeof p.subscribe !== 'function' && typeof p.then === 'function';
      },
      isFunction = Rx.helpers.isFunction = (function() {
        var isFn = function(value) {
          return typeof value == 'function' || false;
        };
        if (isFn(/x/)) {
          isFn = function(value) {
            return typeof value == 'function' && toString.call(value) == '[object Function]';
          };
        }
        return isFn;
      }());
  function cloneArray(arr) {
    var len = arr.length,
        a = new Array(len);
    for (var i = 0; i < len; i++) {
      a[i] = arr[i];
    }
    return a;
  }
  var errorObj = {e: {}};
  function tryCatcherGen(tryCatchTarget) {
    return function tryCatcher() {
      try {
        return tryCatchTarget.apply(this, arguments);
      } catch (e) {
        errorObj.e = e;
        return errorObj;
      }
    };
  }
  var tryCatch = Rx.internals.tryCatch = function tryCatch(fn) {
    if (!isFunction(fn)) {
      throw new TypeError('fn must be a function');
    }
    return tryCatcherGen(fn);
  };
  function thrower(e) {
    throw e;
  }
  Rx.config.longStackSupport = false;
  var hasStacks = false,
      stacks = tryCatch(function() {
        throw new Error();
      })();
  hasStacks = !!stacks.e && !!stacks.e.stack;
  var rStartingLine = captureLine(),
      rFileName;
  var STACK_JUMP_SEPARATOR = 'From previous event:';
  function makeStackTraceLong(error, observable) {
    if (hasStacks && observable.stack && typeof error === 'object' && error !== null && error.stack && error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1) {
      var stacks = [];
      for (var o = observable; !!o; o = o.source) {
        if (o.stack) {
          stacks.unshift(o.stack);
        }
      }
      stacks.unshift(error.stack);
      var concatedStacks = stacks.join('\n' + STACK_JUMP_SEPARATOR + '\n');
      error.stack = filterStackString(concatedStacks);
    }
  }
  function filterStackString(stackString) {
    var lines = stackString.split('\n'),
        desiredLines = [];
    for (var i = 0,
        len = lines.length; i < len; i++) {
      var line = lines[i];
      if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
        desiredLines.push(line);
      }
    }
    return desiredLines.join('\n');
  }
  function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);
    if (!fileNameAndLineNumber) {
      return false;
    }
    var fileName = fileNameAndLineNumber[0],
        lineNumber = fileNameAndLineNumber[1];
    return fileName === rFileName && lineNumber >= rStartingLine && lineNumber <= rEndingLine;
  }
  function isNodeFrame(stackLine) {
    return stackLine.indexOf('(module.js:') !== -1 || stackLine.indexOf('(node.js:') !== -1;
  }
  function captureLine() {
    if (!hasStacks) {
      return;
    }
    try {
      throw new Error();
    } catch (e) {
      var lines = e.stack.split('\n');
      var firstLine = lines[0].indexOf('@') > 0 ? lines[1] : lines[2];
      var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
      if (!fileNameAndLineNumber) {
        return;
      }
      rFileName = fileNameAndLineNumber[0];
      return fileNameAndLineNumber[1];
    }
  }
  function getFileNameAndLineNumber(stackLine) {
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
      return [attempt1[1], Number(attempt1[2])];
    }
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
      return [attempt2[1], Number(attempt2[2])];
    }
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
      return [attempt3[1], Number(attempt3[2])];
    }
  }
  var EmptyError = Rx.EmptyError = function() {
    this.message = 'Sequence contains no elements.';
    Error.call(this);
  };
  EmptyError.prototype = Object.create(Error.prototype);
  EmptyError.prototype.name = 'EmptyError';
  var ObjectDisposedError = Rx.ObjectDisposedError = function() {
    this.message = 'Object has been disposed';
    Error.call(this);
  };
  ObjectDisposedError.prototype = Object.create(Error.prototype);
  ObjectDisposedError.prototype.name = 'ObjectDisposedError';
  var ArgumentOutOfRangeError = Rx.ArgumentOutOfRangeError = function() {
    this.message = 'Argument out of range';
    Error.call(this);
  };
  ArgumentOutOfRangeError.prototype = Object.create(Error.prototype);
  ArgumentOutOfRangeError.prototype.name = 'ArgumentOutOfRangeError';
  var NotSupportedError = Rx.NotSupportedError = function(message) {
    this.message = message || 'This operation is not supported';
    Error.call(this);
  };
  NotSupportedError.prototype = Object.create(Error.prototype);
  NotSupportedError.prototype.name = 'NotSupportedError';
  var NotImplementedError = Rx.NotImplementedError = function(message) {
    this.message = message || 'This operation is not implemented';
    Error.call(this);
  };
  NotImplementedError.prototype = Object.create(Error.prototype);
  NotImplementedError.prototype.name = 'NotImplementedError';
  var notImplemented = Rx.helpers.notImplemented = function() {
    throw new NotImplementedError();
  };
  var notSupported = Rx.helpers.notSupported = function() {
    throw new NotSupportedError();
  };
  var $iterator$ = (typeof Symbol === 'function' && Symbol.iterator) || '_es6shim_iterator_';
  if (root.Set && typeof new root.Set()['@@iterator'] === 'function') {
    $iterator$ = '@@iterator';
  }
  var doneEnumerator = Rx.doneEnumerator = {
    done: true,
    value: undefined
  };
  var isIterable = Rx.helpers.isIterable = function(o) {
    return o && o[$iterator$] !== undefined;
  };
  var isArrayLike = Rx.helpers.isArrayLike = function(o) {
    return o && o.length !== undefined;
  };
  Rx.helpers.iterator = $iterator$;
  var bindCallback = Rx.internals.bindCallback = function(func, thisArg, argCount) {
    if (typeof thisArg === 'undefined') {
      return func;
    }
    switch (argCount) {
      case 0:
        return function() {
          return func.call(thisArg);
        };
      case 1:
        return function(arg) {
          return func.call(thisArg, arg);
        };
      case 2:
        return function(value, index) {
          return func.call(thisArg, value, index);
        };
      case 3:
        return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
    }
    return function() {
      return func.apply(thisArg, arguments);
    };
  };
  var dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'],
      dontEnumsLength = dontEnums.length;
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag = '[object Function]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag = '[object Object]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      weakMapTag = '[object WeakMap]';
  var arrayBufferTag = '[object ArrayBuffer]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
  var objectProto = Object.prototype,
      hasOwnProperty = objectProto.hasOwnProperty,
      objToString = objectProto.toString,
      MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
  var keys = Object.keys || (function() {
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
  function equalObjects(object, other, equalFunc, isLoose, stackA, stackB) {
    var objProps = keys(object),
        objLength = objProps.length,
        othProps = keys(other),
        othLength = othProps.length;
    if (objLength !== othLength && !isLoose) {
      return false;
    }
    var index = objLength,
        key;
    while (index--) {
      key = objProps[index];
      if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
        return false;
      }
    }
    var skipCtor = isLoose;
    while (++index < objLength) {
      key = objProps[index];
      var objValue = object[key],
          othValue = other[key],
          result;
      if (!(result === undefined ? equalFunc(objValue, othValue, isLoose, stackA, stackB) : result)) {
        return false;
      }
      skipCtor || (skipCtor = key === 'constructor');
    }
    if (!skipCtor) {
      var objCtor = object.constructor,
          othCtor = other.constructor;
      if (objCtor !== othCtor && ('constructor' in object && 'constructor' in other) && !(typeof objCtor === 'function' && objCtor instanceof objCtor && typeof othCtor === 'function' && othCtor instanceof othCtor)) {
        return false;
      }
    }
    return true;
  }
  function equalByTag(object, other, tag) {
    switch (tag) {
      case boolTag:
      case dateTag:
        return +object === +other;
      case errorTag:
        return object.name === other.name && object.message === other.message;
      case numberTag:
        return (object !== +object) ? other !== +other : object === +other;
      case regexpTag:
      case stringTag:
        return object === (other + '');
    }
    return false;
  }
  var isObject = Rx.internals.isObject = function(value) {
    var type = typeof value;
    return !!value && (type === 'object' || type === 'function');
  };
  function isObjectLike(value) {
    return !!value && typeof value === 'object';
  }
  function isLength(value) {
    return typeof value === 'number' && value > -1 && value % 1 === 0 && value <= MAX_SAFE_INTEGER;
  }
  var isHostObject = (function() {
    try {
      Object({'toString': 0} + '');
    } catch (e) {
      return function() {
        return false;
      };
    }
    return function(value) {
      return typeof value.toString !== 'function' && typeof(value + '') === 'string';
    };
  }());
  function isTypedArray(value) {
    return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
  }
  var isArray = Array.isArray || function(value) {
    return isObjectLike(value) && isLength(value.length) && objToString.call(value) === arrayTag;
  };
  function arraySome(array, predicate) {
    var index = -1,
        length = array.length;
    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }
  function equalArrays(array, other, equalFunc, isLoose, stackA, stackB) {
    var index = -1,
        arrLength = array.length,
        othLength = other.length;
    if (arrLength !== othLength && !(isLoose && othLength > arrLength)) {
      return false;
    }
    while (++index < arrLength) {
      var arrValue = array[index],
          othValue = other[index],
          result;
      if (result !== undefined) {
        if (result) {
          continue;
        }
        return false;
      }
      if (isLoose) {
        if (!arraySome(other, function(othValue) {
          return arrValue === othValue || equalFunc(arrValue, othValue, isLoose, stackA, stackB);
        })) {
          return false;
        }
      } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, isLoose, stackA, stackB))) {
        return false;
      }
    }
    return true;
  }
  function baseIsEqualDeep(object, other, equalFunc, isLoose, stackA, stackB) {
    var objIsArr = isArray(object),
        othIsArr = isArray(other),
        objTag = arrayTag,
        othTag = arrayTag;
    if (!objIsArr) {
      objTag = objToString.call(object);
      if (objTag === argsTag) {
        objTag = objectTag;
      } else if (objTag !== objectTag) {
        objIsArr = isTypedArray(object);
      }
    }
    if (!othIsArr) {
      othTag = objToString.call(other);
      if (othTag === argsTag) {
        othTag = objectTag;
      }
    }
    var objIsObj = objTag === objectTag && !isHostObject(object),
        othIsObj = othTag === objectTag && !isHostObject(other),
        isSameTag = objTag === othTag;
    if (isSameTag && !(objIsArr || objIsObj)) {
      return equalByTag(object, other, objTag);
    }
    if (!isLoose) {
      var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
          othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');
      if (objIsWrapped || othIsWrapped) {
        return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, isLoose, stackA, stackB);
      }
    }
    if (!isSameTag) {
      return false;
    }
    stackA || (stackA = []);
    stackB || (stackB = []);
    var length = stackA.length;
    while (length--) {
      if (stackA[length] === object) {
        return stackB[length] === other;
      }
    }
    stackA.push(object);
    stackB.push(other);
    var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, isLoose, stackA, stackB);
    stackA.pop();
    stackB.pop();
    return result;
  }
  function baseIsEqual(value, other, isLoose, stackA, stackB) {
    if (value === other) {
      return true;
    }
    if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
      return value !== value && other !== other;
    }
    return baseIsEqualDeep(value, other, baseIsEqual, isLoose, stackA, stackB);
  }
  var isEqual = Rx.internals.isEqual = function(value, other) {
    return baseIsEqual(value, other);
  };
  var hasProp = {}.hasOwnProperty,
      slice = Array.prototype.slice;
  var inherits = Rx.internals.inherits = function(child, parent) {
    function __() {
      this.constructor = child;
    }
    __.prototype = parent.prototype;
    child.prototype = new __();
  };
  var addProperties = Rx.internals.addProperties = function(obj) {
    for (var sources = [],
        i = 1,
        len = arguments.length; i < len; i++) {
      sources.push(arguments[i]);
    }
    for (var idx = 0,
        ln = sources.length; idx < ln; idx++) {
      var source = sources[idx];
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    }
  };
  var addRef = Rx.internals.addRef = function(xs, r) {
    return new AnonymousObservable(function(observer) {
      return new BinaryDisposable(r.getDisposable(), xs.subscribe(observer));
    });
  };
  function arrayInitialize(count, factory) {
    var a = new Array(count);
    for (var i = 0; i < count; i++) {
      a[i] = factory();
    }
    return a;
  }
  var CompositeDisposable = Rx.CompositeDisposable = function() {
    var args = [],
        i,
        len;
    if (Array.isArray(arguments[0])) {
      args = arguments[0];
    } else {
      len = arguments.length;
      args = new Array(len);
      for (i = 0; i < len; i++) {
        args[i] = arguments[i];
      }
    }
    this.disposables = args;
    this.isDisposed = false;
    this.length = args.length;
  };
  var CompositeDisposablePrototype = CompositeDisposable.prototype;
  CompositeDisposablePrototype.add = function(item) {
    if (this.isDisposed) {
      item.dispose();
    } else {
      this.disposables.push(item);
      this.length++;
    }
  };
  CompositeDisposablePrototype.remove = function(item) {
    var shouldDispose = false;
    if (!this.isDisposed) {
      var idx = this.disposables.indexOf(item);
      if (idx !== -1) {
        shouldDispose = true;
        this.disposables.splice(idx, 1);
        this.length--;
        item.dispose();
      }
    }
    return shouldDispose;
  };
  CompositeDisposablePrototype.dispose = function() {
    if (!this.isDisposed) {
      this.isDisposed = true;
      var len = this.disposables.length,
          currentDisposables = new Array(len);
      for (var i = 0; i < len; i++) {
        currentDisposables[i] = this.disposables[i];
      }
      this.disposables = [];
      this.length = 0;
      for (i = 0; i < len; i++) {
        currentDisposables[i].dispose();
      }
    }
  };
  var Disposable = Rx.Disposable = function(action) {
    this.isDisposed = false;
    this.action = action || noop;
  };
  Disposable.prototype.dispose = function() {
    if (!this.isDisposed) {
      this.action();
      this.isDisposed = true;
    }
  };
  var disposableCreate = Disposable.create = function(action) {
    return new Disposable(action);
  };
  var disposableEmpty = Disposable.empty = {dispose: noop};
  var isDisposable = Disposable.isDisposable = function(d) {
    return d && isFunction(d.dispose);
  };
  var checkDisposed = Disposable.checkDisposed = function(disposable) {
    if (disposable.isDisposed) {
      throw new ObjectDisposedError();
    }
  };
  var disposableFixup = Disposable._fixup = function(result) {
    return isDisposable(result) ? result : disposableEmpty;
  };
  var SingleAssignmentDisposable = Rx.SingleAssignmentDisposable = function() {
    this.isDisposed = false;
    this.current = null;
  };
  SingleAssignmentDisposable.prototype.getDisposable = function() {
    return this.current;
  };
  SingleAssignmentDisposable.prototype.setDisposable = function(value) {
    if (this.current) {
      throw new Error('Disposable has already been assigned');
    }
    var shouldDispose = this.isDisposed;
    !shouldDispose && (this.current = value);
    shouldDispose && value && value.dispose();
  };
  SingleAssignmentDisposable.prototype.dispose = function() {
    if (!this.isDisposed) {
      this.isDisposed = true;
      var old = this.current;
      this.current = null;
      old && old.dispose();
    }
  };
  var SerialDisposable = Rx.SerialDisposable = function() {
    this.isDisposed = false;
    this.current = null;
  };
  SerialDisposable.prototype.getDisposable = function() {
    return this.current;
  };
  SerialDisposable.prototype.setDisposable = function(value) {
    var shouldDispose = this.isDisposed;
    if (!shouldDispose) {
      var old = this.current;
      this.current = value;
    }
    old && old.dispose();
    shouldDispose && value && value.dispose();
  };
  SerialDisposable.prototype.dispose = function() {
    if (!this.isDisposed) {
      this.isDisposed = true;
      var old = this.current;
      this.current = null;
    }
    old && old.dispose();
  };
  var BinaryDisposable = Rx.BinaryDisposable = function(first, second) {
    this._first = first;
    this._second = second;
    this.isDisposed = false;
  };
  BinaryDisposable.prototype.dispose = function() {
    if (!this.isDisposed) {
      this.isDisposed = true;
      var old1 = this._first;
      this._first = null;
      old1 && old1.dispose();
      var old2 = this._second;
      this._second = null;
      old2 && old2.dispose();
    }
  };
  var NAryDisposable = Rx.NAryDisposable = function(disposables) {
    this._disposables = disposables;
    this.isDisposed = false;
  };
  NAryDisposable.prototype.dispose = function() {
    if (!this.isDisposed) {
      this.isDisposed = true;
      for (var i = 0,
          len = this._disposables.length; i < len; i++) {
        this._disposables[i].dispose();
      }
      this._disposables.length = 0;
    }
  };
  var RefCountDisposable = Rx.RefCountDisposable = (function() {
    function InnerDisposable(disposable) {
      this.disposable = disposable;
      this.disposable.count++;
      this.isInnerDisposed = false;
    }
    InnerDisposable.prototype.dispose = function() {
      if (!this.disposable.isDisposed && !this.isInnerDisposed) {
        this.isInnerDisposed = true;
        this.disposable.count--;
        if (this.disposable.count === 0 && this.disposable.isPrimaryDisposed) {
          this.disposable.isDisposed = true;
          this.disposable.underlyingDisposable.dispose();
        }
      }
    };
    function RefCountDisposable(disposable) {
      this.underlyingDisposable = disposable;
      this.isDisposed = false;
      this.isPrimaryDisposed = false;
      this.count = 0;
    }
    RefCountDisposable.prototype.dispose = function() {
      if (!this.isDisposed && !this.isPrimaryDisposed) {
        this.isPrimaryDisposed = true;
        if (this.count === 0) {
          this.isDisposed = true;
          this.underlyingDisposable.dispose();
        }
      }
    };
    RefCountDisposable.prototype.getDisposable = function() {
      return this.isDisposed ? disposableEmpty : new InnerDisposable(this);
    };
    return RefCountDisposable;
  })();
  var ScheduledItem = Rx.internals.ScheduledItem = function(scheduler, state, action, dueTime, comparer) {
    this.scheduler = scheduler;
    this.state = state;
    this.action = action;
    this.dueTime = dueTime;
    this.comparer = comparer || defaultSubComparer;
    this.disposable = new SingleAssignmentDisposable();
  };
  ScheduledItem.prototype.invoke = function() {
    this.disposable.setDisposable(this.invokeCore());
  };
  ScheduledItem.prototype.compareTo = function(other) {
    return this.comparer(this.dueTime, other.dueTime);
  };
  ScheduledItem.prototype.isCancelled = function() {
    return this.disposable.isDisposed;
  };
  ScheduledItem.prototype.invokeCore = function() {
    return disposableFixup(this.action(this.scheduler, this.state));
  };
  var Scheduler = Rx.Scheduler = (function() {
    function Scheduler() {}
    Scheduler.isScheduler = function(s) {
      return s instanceof Scheduler;
    };
    var schedulerProto = Scheduler.prototype;
    schedulerProto.schedule = function(state, action) {
      throw new NotImplementedError();
    };
    schedulerProto.scheduleFuture = function(state, dueTime, action) {
      var dt = dueTime;
      dt instanceof Date && (dt = dt - this.now());
      dt = Scheduler.normalize(dt);
      if (dt === 0) {
        return this.schedule(state, action);
      }
      return this._scheduleFuture(state, dt, action);
    };
    schedulerProto._scheduleFuture = function(state, dueTime, action) {
      throw new NotImplementedError();
    };
    Scheduler.now = defaultNow;
    Scheduler.prototype.now = defaultNow;
    Scheduler.normalize = function(timeSpan) {
      timeSpan < 0 && (timeSpan = 0);
      return timeSpan;
    };
    return Scheduler;
  }());
  var normalizeTime = Scheduler.normalize,
      isScheduler = Scheduler.isScheduler;
  (function(schedulerProto) {
    function invokeRecImmediate(scheduler, pair) {
      var state = pair[0],
          action = pair[1],
          group = new CompositeDisposable();
      action(state, innerAction);
      return group;
      function innerAction(state2) {
        var isAdded = false,
            isDone = false;
        var d = scheduler.schedule(state2, scheduleWork);
        if (!isDone) {
          group.add(d);
          isAdded = true;
        }
        function scheduleWork(_, state3) {
          if (isAdded) {
            group.remove(d);
          } else {
            isDone = true;
          }
          action(state3, innerAction);
          return disposableEmpty;
        }
      }
    }
    function invokeRecDate(scheduler, pair) {
      var state = pair[0],
          action = pair[1],
          group = new CompositeDisposable();
      action(state, innerAction);
      return group;
      function innerAction(state2, dueTime1) {
        var isAdded = false,
            isDone = false;
        var d = scheduler.scheduleFuture(state2, dueTime1, scheduleWork);
        if (!isDone) {
          group.add(d);
          isAdded = true;
        }
        function scheduleWork(_, state3) {
          if (isAdded) {
            group.remove(d);
          } else {
            isDone = true;
          }
          action(state3, innerAction);
          return disposableEmpty;
        }
      }
    }
    schedulerProto.scheduleRecursive = function(state, action) {
      return this.schedule([state, action], invokeRecImmediate);
    };
    schedulerProto.scheduleRecursiveFuture = function(state, dueTime, action) {
      return this.scheduleFuture([state, action], dueTime, invokeRecDate);
    };
  }(Scheduler.prototype));
  (function(schedulerProto) {
    schedulerProto.schedulePeriodic = function(state, period, action) {
      if (typeof root.setInterval === 'undefined') {
        throw new NotSupportedError();
      }
      period = normalizeTime(period);
      var s = state,
          id = root.setInterval(function() {
            s = action(s);
          }, period);
      return disposableCreate(function() {
        root.clearInterval(id);
      });
    };
  }(Scheduler.prototype));
  var ImmediateScheduler = (function(__super__) {
    inherits(ImmediateScheduler, __super__);
    function ImmediateScheduler() {
      __super__.call(this);
    }
    ImmediateScheduler.prototype.schedule = function(state, action) {
      return disposableFixup(action(this, state));
    };
    return ImmediateScheduler;
  }(Scheduler));
  var immediateScheduler = Scheduler.immediate = new ImmediateScheduler();
  var CurrentThreadScheduler = (function(__super__) {
    var queue;
    function runTrampoline() {
      while (queue.length > 0) {
        var item = queue.dequeue();
        !item.isCancelled() && item.invoke();
      }
    }
    inherits(CurrentThreadScheduler, __super__);
    function CurrentThreadScheduler() {
      __super__.call(this);
    }
    CurrentThreadScheduler.prototype.schedule = function(state, action) {
      var si = new ScheduledItem(this, state, action, this.now());
      if (!queue) {
        queue = new PriorityQueue(4);
        queue.enqueue(si);
        var result = tryCatch(runTrampoline)();
        queue = null;
        if (result === errorObj) {
          thrower(result.e);
        }
      } else {
        queue.enqueue(si);
      }
      return si.disposable;
    };
    CurrentThreadScheduler.prototype.scheduleRequired = function() {
      return !queue;
    };
    return CurrentThreadScheduler;
  }(Scheduler));
  var currentThreadScheduler = Scheduler.currentThread = new CurrentThreadScheduler();
  var SchedulePeriodicRecursive = Rx.internals.SchedulePeriodicRecursive = (function() {
    function createTick(self) {
      return function tick(command, recurse) {
        recurse(0, self._period);
        var state = tryCatch(self._action)(self._state);
        if (state === errorObj) {
          self._cancel.dispose();
          thrower(state.e);
        }
        self._state = state;
      };
    }
    function SchedulePeriodicRecursive(scheduler, state, period, action) {
      this._scheduler = scheduler;
      this._state = state;
      this._period = period;
      this._action = action;
    }
    SchedulePeriodicRecursive.prototype.start = function() {
      var d = new SingleAssignmentDisposable();
      this._cancel = d;
      d.setDisposable(this._scheduler.scheduleRecursiveFuture(0, this._period, createTick(this)));
      return d;
    };
    return SchedulePeriodicRecursive;
  }());
  var scheduleMethod,
      clearMethod;
  var localTimer = (function() {
    var localSetTimeout,
        localClearTimeout = noop;
    if (!!root.setTimeout) {
      localSetTimeout = root.setTimeout;
      localClearTimeout = root.clearTimeout;
    } else if (!!root.WScript) {
      localSetTimeout = function(fn, time) {
        root.WScript.Sleep(time);
        fn();
      };
    } else {
      throw new NotSupportedError();
    }
    return {
      setTimeout: localSetTimeout,
      clearTimeout: localClearTimeout
    };
  }());
  var localSetTimeout = localTimer.setTimeout,
      localClearTimeout = localTimer.clearTimeout;
  (function() {
    var nextHandle = 1,
        tasksByHandle = {},
        currentlyRunning = false;
    clearMethod = function(handle) {
      delete tasksByHandle[handle];
    };
    function runTask(handle) {
      if (currentlyRunning) {
        localSetTimeout(function() {
          runTask(handle);
        }, 0);
      } else {
        var task = tasksByHandle[handle];
        if (task) {
          currentlyRunning = true;
          var result = tryCatch(task)();
          clearMethod(handle);
          currentlyRunning = false;
          if (result === errorObj) {
            thrower(result.e);
          }
        }
      }
    }
    var reNative = new RegExp('^' + String(toString).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/toString| for [^\]]+/g, '.*?') + '$');
    var setImmediate = typeof(setImmediate = freeGlobal && moduleExports && freeGlobal.setImmediate) == 'function' && !reNative.test(setImmediate) && setImmediate;
    function postMessageSupported() {
      if (!root.postMessage || root.importScripts) {
        return false;
      }
      var isAsync = false,
          oldHandler = root.onmessage;
      root.onmessage = function() {
        isAsync = true;
      };
      root.postMessage('', '*');
      root.onmessage = oldHandler;
      return isAsync;
    }
    if (isFunction(setImmediate)) {
      scheduleMethod = function(action) {
        var id = nextHandle++;
        tasksByHandle[id] = action;
        setImmediate(function() {
          runTask(id);
        });
        return id;
      };
    } else if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
      scheduleMethod = function(action) {
        var id = nextHandle++;
        tasksByHandle[id] = action;
        process.nextTick(function() {
          runTask(id);
        });
        return id;
      };
    } else if (postMessageSupported()) {
      var MSG_PREFIX = 'ms.rx.schedule' + Math.random();
      var onGlobalPostMessage = function(event) {
        if (typeof event.data === 'string' && event.data.substring(0, MSG_PREFIX.length) === MSG_PREFIX) {
          runTask(event.data.substring(MSG_PREFIX.length));
        }
      };
      root.addEventListener('message', onGlobalPostMessage, false);
      scheduleMethod = function(action) {
        var id = nextHandle++;
        tasksByHandle[id] = action;
        root.postMessage(MSG_PREFIX + currentId, '*');
        return id;
      };
    } else if (!!root.MessageChannel) {
      var channel = new root.MessageChannel();
      channel.port1.onmessage = function(e) {
        runTask(e.data);
      };
      scheduleMethod = function(action) {
        var id = nextHandle++;
        tasksByHandle[id] = action;
        channel.port2.postMessage(id);
        return id;
      };
    } else if ('document' in root && 'onreadystatechange' in root.document.createElement('script')) {
      scheduleMethod = function(action) {
        var scriptElement = root.document.createElement('script');
        var id = nextHandle++;
        tasksByHandle[id] = action;
        scriptElement.onreadystatechange = function() {
          runTask(id);
          scriptElement.onreadystatechange = null;
          scriptElement.parentNode.removeChild(scriptElement);
          scriptElement = null;
        };
        root.document.documentElement.appendChild(scriptElement);
        return id;
      };
    } else {
      scheduleMethod = function(action) {
        var id = nextHandle++;
        tasksByHandle[id] = action;
        localSetTimeout(function() {
          runTask(id);
        }, 0);
        return id;
      };
    }
  }());
  var DefaultScheduler = (function(__super__) {
    inherits(DefaultScheduler, __super__);
    function DefaultScheduler() {
      __super__.call(this);
    }
    function scheduleAction(disposable, action, scheduler, state) {
      return function schedule() {
        disposable.setDisposable(Disposable._fixup(action(scheduler, state)));
      };
    }
    function ClearDisposable(id) {
      this._id = id;
      this.isDisposed = false;
    }
    ClearDisposable.prototype.dispose = function() {
      if (!this.isDisposed) {
        this.isDisposed = true;
        clearMethod(this._id);
      }
    };
    function LocalClearDisposable(id) {
      this._id = id;
      this.isDisposed = false;
    }
    LocalClearDisposable.prototype.dispose = function() {
      if (!this.isDisposed) {
        this.isDisposed = true;
        localClearTimeout(this._id);
      }
    };
    DefaultScheduler.prototype.schedule = function(state, action) {
      var disposable = new SingleAssignmentDisposable(),
          id = scheduleMethod(scheduleAction(disposable, action, this, state));
      return new BinaryDisposable(disposable, new ClearDisposable(id));
    };
    DefaultScheduler.prototype._scheduleFuture = function(state, dueTime, action) {
      if (dueTime === 0) {
        return this.schedule(state, action);
      }
      var disposable = new SingleAssignmentDisposable(),
          id = localSetTimeout(scheduleAction(disposable, action, this, state), dueTime);
      return new BinaryDisposable(disposable, new LocalClearDisposable(id));
    };
    return DefaultScheduler;
  }(Scheduler));
  var defaultScheduler = Scheduler['default'] = Scheduler.async = new DefaultScheduler();
  function IndexedItem(id, value) {
    this.id = id;
    this.value = value;
  }
  IndexedItem.prototype.compareTo = function(other) {
    var c = this.value.compareTo(other.value);
    c === 0 && (c = this.id - other.id);
    return c;
  };
  var PriorityQueue = Rx.internals.PriorityQueue = function(capacity) {
    this.items = new Array(capacity);
    this.length = 0;
  };
  var priorityProto = PriorityQueue.prototype;
  priorityProto.isHigherPriority = function(left, right) {
    return this.items[left].compareTo(this.items[right]) < 0;
  };
  priorityProto.percolate = function(index) {
    if (index >= this.length || index < 0) {
      return;
    }
    var parent = index - 1 >> 1;
    if (parent < 0 || parent === index) {
      return;
    }
    if (this.isHigherPriority(index, parent)) {
      var temp = this.items[index];
      this.items[index] = this.items[parent];
      this.items[parent] = temp;
      this.percolate(parent);
    }
  };
  priorityProto.heapify = function(index) {
    +index || (index = 0);
    if (index >= this.length || index < 0) {
      return;
    }
    var left = 2 * index + 1,
        right = 2 * index + 2,
        first = index;
    if (left < this.length && this.isHigherPriority(left, first)) {
      first = left;
    }
    if (right < this.length && this.isHigherPriority(right, first)) {
      first = right;
    }
    if (first !== index) {
      var temp = this.items[index];
      this.items[index] = this.items[first];
      this.items[first] = temp;
      this.heapify(first);
    }
  };
  priorityProto.peek = function() {
    return this.items[0].value;
  };
  priorityProto.removeAt = function(index) {
    this.items[index] = this.items[--this.length];
    this.items[this.length] = undefined;
    this.heapify();
  };
  priorityProto.dequeue = function() {
    var result = this.peek();
    this.removeAt(0);
    return result;
  };
  priorityProto.enqueue = function(item) {
    var index = this.length++;
    this.items[index] = new IndexedItem(PriorityQueue.count++, item);
    this.percolate(index);
  };
  priorityProto.remove = function(item) {
    for (var i = 0; i < this.length; i++) {
      if (this.items[i].value === item) {
        this.removeAt(i);
        return true;
      }
    }
    return false;
  };
  PriorityQueue.count = 0;
  var Notification = Rx.Notification = (function() {
    function Notification() {}
    Notification.prototype._accept = function(onNext, onError, onCompleted) {
      throw new NotImplementedError();
    };
    Notification.prototype._acceptObserver = function(onNext, onError, onCompleted) {
      throw new NotImplementedError();
    };
    Notification.prototype.accept = function(observerOrOnNext, onError, onCompleted) {
      return observerOrOnNext && typeof observerOrOnNext === 'object' ? this._acceptObserver(observerOrOnNext) : this._accept(observerOrOnNext, onError, onCompleted);
    };
    Notification.prototype.toObservable = function(scheduler) {
      var self = this;
      isScheduler(scheduler) || (scheduler = immediateScheduler);
      return new AnonymousObservable(function(o) {
        return scheduler.schedule(self, function(_, notification) {
          notification._acceptObserver(o);
          notification.kind === 'N' && o.onCompleted();
        });
      });
    };
    return Notification;
  })();
  var OnNextNotification = (function(__super__) {
    inherits(OnNextNotification, __super__);
    function OnNextNotification(value) {
      this.value = value;
      this.kind = 'N';
    }
    OnNextNotification.prototype._accept = function(onNext) {
      return onNext(this.value);
    };
    OnNextNotification.prototype._acceptObserver = function(o) {
      return o.onNext(this.value);
    };
    OnNextNotification.prototype.toString = function() {
      return 'OnNext(' + this.value + ')';
    };
    return OnNextNotification;
  }(Notification));
  var OnErrorNotification = (function(__super__) {
    inherits(OnErrorNotification, __super__);
    function OnErrorNotification(error) {
      this.error = error;
      this.kind = 'E';
    }
    OnErrorNotification.prototype._accept = function(onNext, onError) {
      return onError(this.error);
    };
    OnErrorNotification.prototype._acceptObserver = function(o) {
      return o.onError(this.error);
    };
    OnErrorNotification.prototype.toString = function() {
      return 'OnError(' + this.error + ')';
    };
    return OnErrorNotification;
  }(Notification));
  var OnCompletedNotification = (function(__super__) {
    inherits(OnCompletedNotification, __super__);
    function OnCompletedNotification() {
      this.kind = 'C';
    }
    OnCompletedNotification.prototype._accept = function(onNext, onError, onCompleted) {
      return onCompleted();
    };
    OnCompletedNotification.prototype._acceptObserver = function(o) {
      return o.onCompleted();
    };
    OnCompletedNotification.prototype.toString = function() {
      return 'OnCompleted()';
    };
    return OnCompletedNotification;
  }(Notification));
  var notificationCreateOnNext = Notification.createOnNext = function(value) {
    return new OnNextNotification(value);
  };
  var notificationCreateOnError = Notification.createOnError = function(error) {
    return new OnErrorNotification(error);
  };
  var notificationCreateOnCompleted = Notification.createOnCompleted = function() {
    return new OnCompletedNotification();
  };
  var Observer = Rx.Observer = function() {};
  var observerCreate = Observer.create = function(onNext, onError, onCompleted) {
    onNext || (onNext = noop);
    onError || (onError = defaultError);
    onCompleted || (onCompleted = noop);
    return new AnonymousObserver(onNext, onError, onCompleted);
  };
  var AbstractObserver = Rx.internals.AbstractObserver = (function(__super__) {
    inherits(AbstractObserver, __super__);
    function AbstractObserver() {
      this.isStopped = false;
    }
    AbstractObserver.prototype.next = notImplemented;
    AbstractObserver.prototype.error = notImplemented;
    AbstractObserver.prototype.completed = notImplemented;
    AbstractObserver.prototype.onNext = function(value) {
      !this.isStopped && this.next(value);
    };
    AbstractObserver.prototype.onError = function(error) {
      if (!this.isStopped) {
        this.isStopped = true;
        this.error(error);
      }
    };
    AbstractObserver.prototype.onCompleted = function() {
      if (!this.isStopped) {
        this.isStopped = true;
        this.completed();
      }
    };
    AbstractObserver.prototype.dispose = function() {
      this.isStopped = true;
    };
    AbstractObserver.prototype.fail = function(e) {
      if (!this.isStopped) {
        this.isStopped = true;
        this.error(e);
        return true;
      }
      return false;
    };
    return AbstractObserver;
  }(Observer));
  var AnonymousObserver = Rx.AnonymousObserver = (function(__super__) {
    inherits(AnonymousObserver, __super__);
    function AnonymousObserver(onNext, onError, onCompleted) {
      __super__.call(this);
      this._onNext = onNext;
      this._onError = onError;
      this._onCompleted = onCompleted;
    }
    AnonymousObserver.prototype.next = function(value) {
      this._onNext(value);
    };
    AnonymousObserver.prototype.error = function(error) {
      this._onError(error);
    };
    AnonymousObserver.prototype.completed = function() {
      this._onCompleted();
    };
    return AnonymousObserver;
  }(AbstractObserver));
  var observableProto;
  var Observable = Rx.Observable = (function() {
    function makeSubscribe(self, subscribe) {
      return function(o) {
        var oldOnError = o.onError;
        o.onError = function(e) {
          makeStackTraceLong(e, self);
          oldOnError.call(o, e);
        };
        return subscribe.call(self, o);
      };
    }
    function Observable() {
      if (Rx.config.longStackSupport && hasStacks) {
        var oldSubscribe = this._subscribe;
        var e = tryCatch(thrower)(new Error()).e;
        this.stack = e.stack.substring(e.stack.indexOf('\n') + 1);
        this._subscribe = makeSubscribe(this, oldSubscribe);
      }
    }
    observableProto = Observable.prototype;
    Observable.isObservable = function(o) {
      return o && isFunction(o.subscribe);
    };
    observableProto.subscribe = observableProto.forEach = function(oOrOnNext, onError, onCompleted) {
      return this._subscribe(typeof oOrOnNext === 'object' ? oOrOnNext : observerCreate(oOrOnNext, onError, onCompleted));
    };
    observableProto.subscribeOnNext = function(onNext, thisArg) {
      return this._subscribe(observerCreate(typeof thisArg !== 'undefined' ? function(x) {
        onNext.call(thisArg, x);
      } : onNext));
    };
    observableProto.subscribeOnError = function(onError, thisArg) {
      return this._subscribe(observerCreate(null, typeof thisArg !== 'undefined' ? function(e) {
        onError.call(thisArg, e);
      } : onError));
    };
    observableProto.subscribeOnCompleted = function(onCompleted, thisArg) {
      return this._subscribe(observerCreate(null, null, typeof thisArg !== 'undefined' ? function() {
        onCompleted.call(thisArg);
      } : onCompleted));
    };
    return Observable;
  })();
  var ScheduledObserver = Rx.internals.ScheduledObserver = (function(__super__) {
    inherits(ScheduledObserver, __super__);
    function ScheduledObserver(scheduler, observer) {
      __super__.call(this);
      this.scheduler = scheduler;
      this.observer = observer;
      this.isAcquired = false;
      this.hasFaulted = false;
      this.queue = [];
      this.disposable = new SerialDisposable();
    }
    function enqueueNext(observer, x) {
      return function() {
        observer.onNext(x);
      };
    }
    function enqueueError(observer, e) {
      return function() {
        observer.onError(e);
      };
    }
    function enqueueCompleted(observer) {
      return function() {
        observer.onCompleted();
      };
    }
    ScheduledObserver.prototype.next = function(x) {
      this.queue.push(enqueueNext(this.observer, x));
    };
    ScheduledObserver.prototype.error = function(e) {
      this.queue.push(enqueueError(this.observer, e));
    };
    ScheduledObserver.prototype.completed = function() {
      this.queue.push(enqueueCompleted(this.observer));
    };
    function scheduleMethod(state, recurse) {
      var work;
      if (state.queue.length > 0) {
        work = state.queue.shift();
      } else {
        state.isAcquired = false;
        return;
      }
      var res = tryCatch(work)();
      if (res === errorObj) {
        state.queue = [];
        state.hasFaulted = true;
        return thrower(res.e);
      }
      recurse(state);
    }
    ScheduledObserver.prototype.ensureActive = function() {
      var isOwner = false;
      if (!this.hasFaulted && this.queue.length > 0) {
        isOwner = !this.isAcquired;
        this.isAcquired = true;
      }
      isOwner && this.disposable.setDisposable(this.scheduler.scheduleRecursive(this, scheduleMethod));
    };
    ScheduledObserver.prototype.dispose = function() {
      __super__.prototype.dispose.call(this);
      this.disposable.dispose();
    };
    return ScheduledObserver;
  }(AbstractObserver));
  var ObservableBase = Rx.ObservableBase = (function(__super__) {
    inherits(ObservableBase, __super__);
    function fixSubscriber(subscriber) {
      return subscriber && isFunction(subscriber.dispose) ? subscriber : isFunction(subscriber) ? disposableCreate(subscriber) : disposableEmpty;
    }
    function setDisposable(s, state) {
      var ado = state[0],
          self = state[1];
      var sub = tryCatch(self.subscribeCore).call(self, ado);
      if (sub === errorObj && !ado.fail(errorObj.e)) {
        thrower(errorObj.e);
      }
      ado.setDisposable(fixSubscriber(sub));
    }
    function ObservableBase() {
      __super__.call(this);
    }
    ObservableBase.prototype._subscribe = function(o) {
      var ado = new AutoDetachObserver(o),
          state = [ado, this];
      if (currentThreadScheduler.scheduleRequired()) {
        currentThreadScheduler.schedule(state, setDisposable);
      } else {
        setDisposable(null, state);
      }
      return ado;
    };
    ObservableBase.prototype.subscribeCore = notImplemented;
    return ObservableBase;
  }(Observable));
  var FlatMapObservable = Rx.FlatMapObservable = (function(__super__) {
    inherits(FlatMapObservable, __super__);
    function FlatMapObservable(source, selector, resultSelector, thisArg) {
      this.resultSelector = isFunction(resultSelector) ? resultSelector : null;
      this.selector = bindCallback(isFunction(selector) ? selector : function() {
        return selector;
      }, thisArg, 3);
      this.source = source;
      __super__.call(this);
    }
    FlatMapObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new InnerObserver(o, this.selector, this.resultSelector, this));
    };
    inherits(InnerObserver, AbstractObserver);
    function InnerObserver(observer, selector, resultSelector, source) {
      this.i = 0;
      this.selector = selector;
      this.resultSelector = resultSelector;
      this.source = source;
      this.o = observer;
      AbstractObserver.call(this);
    }
    InnerObserver.prototype._wrapResult = function(result, x, i) {
      return this.resultSelector ? result.map(function(y, i2) {
        return this.resultSelector(x, y, i, i2);
      }, this) : result;
    };
    InnerObserver.prototype.next = function(x) {
      var i = this.i++;
      var result = tryCatch(this.selector)(x, i, this.source);
      if (result === errorObj) {
        return this.o.onError(result.e);
      }
      isPromise(result) && (result = observableFromPromise(result));
      (isArrayLike(result) || isIterable(result)) && (result = Observable.from(result));
      this.o.onNext(this._wrapResult(result, x, i));
    };
    InnerObserver.prototype.error = function(e) {
      this.o.onError(e);
    };
    InnerObserver.prototype.completed = function() {
      this.o.onCompleted();
    };
    return FlatMapObservable;
  }(ObservableBase));
  var Enumerable = Rx.internals.Enumerable = function() {};
  function IsDisposedDisposable(state) {
    this._s = state;
    this.isDisposed = false;
  }
  IsDisposedDisposable.prototype.dispose = function() {
    if (!this.isDisposed) {
      this.isDisposed = true;
      this._s.isDisposed = true;
    }
  };
  var ConcatEnumerableObservable = (function(__super__) {
    inherits(ConcatEnumerableObservable, __super__);
    function ConcatEnumerableObservable(sources) {
      this.sources = sources;
      __super__.call(this);
    }
    function scheduleMethod(state, recurse) {
      if (state.isDisposed) {
        return;
      }
      var currentItem = tryCatch(state.e.next).call(state.e);
      if (currentItem === errorObj) {
        return state.o.onError(currentItem.e);
      }
      if (currentItem.done) {
        return state.o.onCompleted();
      }
      var currentValue = currentItem.value;
      isPromise(currentValue) && (currentValue = observableFromPromise(currentValue));
      var d = new SingleAssignmentDisposable();
      state.subscription.setDisposable(d);
      d.setDisposable(currentValue.subscribe(new InnerObserver(state, recurse)));
    }
    ConcatEnumerableObservable.prototype.subscribeCore = function(o) {
      var subscription = new SerialDisposable();
      var state = {
        isDisposed: false,
        o: o,
        subscription: subscription,
        e: this.sources[$iterator$]()
      };
      var cancelable = currentThreadScheduler.scheduleRecursive(state, scheduleMethod);
      return new NAryDisposable([subscription, cancelable, new IsDisposedDisposable(state)]);
    };
    function InnerObserver(state, recurse) {
      this._state = state;
      this._recurse = recurse;
      AbstractObserver.call(this);
    }
    inherits(InnerObserver, AbstractObserver);
    InnerObserver.prototype.next = function(x) {
      this._state.o.onNext(x);
    };
    InnerObserver.prototype.error = function(e) {
      this._state.o.onError(e);
    };
    InnerObserver.prototype.completed = function() {
      this._recurse(this._state);
    };
    return ConcatEnumerableObservable;
  }(ObservableBase));
  Enumerable.prototype.concat = function() {
    return new ConcatEnumerableObservable(this);
  };
  var CatchErrorObservable = (function(__super__) {
    function CatchErrorObservable(sources) {
      this.sources = sources;
      __super__.call(this);
    }
    inherits(CatchErrorObservable, __super__);
    function scheduleMethod(state, recurse) {
      if (state.isDisposed) {
        return;
      }
      var currentItem = tryCatch(state.e.next).call(state.e);
      if (currentItem === errorObj) {
        return state.o.onError(currentItem.e);
      }
      if (currentItem.done) {
        return state.lastError !== null ? state.o.onError(state.lastError) : state.o.onCompleted();
      }
      var currentValue = currentItem.value;
      isPromise(currentValue) && (currentValue = observableFromPromise(currentValue));
      var d = new SingleAssignmentDisposable();
      state.subscription.setDisposable(d);
      d.setDisposable(currentValue.subscribe(new InnerObserver(state, recurse)));
    }
    CatchErrorObservable.prototype.subscribeCore = function(o) {
      var subscription = new SerialDisposable();
      var state = {
        isDisposed: false,
        e: this.sources[$iterator$](),
        subscription: subscription,
        lastError: null,
        o: o
      };
      var cancelable = currentThreadScheduler.scheduleRecursive(state, scheduleMethod);
      return new NAryDisposable([subscription, cancelable, new IsDisposedDisposable(state)]);
    };
    function InnerObserver(state, recurse) {
      this._state = state;
      this._recurse = recurse;
      AbstractObserver.call(this);
    }
    inherits(InnerObserver, AbstractObserver);
    InnerObserver.prototype.next = function(x) {
      this._state.o.onNext(x);
    };
    InnerObserver.prototype.error = function(e) {
      this._state.lastError = e;
      this._recurse(this._state);
    };
    InnerObserver.prototype.completed = function() {
      this._state.o.onCompleted();
    };
    return CatchErrorObservable;
  }(ObservableBase));
  Enumerable.prototype.catchError = function() {
    return new CatchErrorObservable(this);
  };
  Enumerable.prototype.catchErrorWhen = function(notificationHandler) {
    var sources = this;
    return new AnonymousObservable(function(o) {
      var exceptions = new Subject(),
          notifier = new Subject(),
          handled = notificationHandler(exceptions),
          notificationDisposable = handled.subscribe(notifier);
      var e = sources[$iterator$]();
      var state = {isDisposed: false},
          lastError,
          subscription = new SerialDisposable();
      var cancelable = currentThreadScheduler.scheduleRecursive(null, function(_, self) {
        if (state.isDisposed) {
          return;
        }
        var currentItem = tryCatch(e.next).call(e);
        if (currentItem === errorObj) {
          return o.onError(currentItem.e);
        }
        if (currentItem.done) {
          if (lastError) {
            o.onError(lastError);
          } else {
            o.onCompleted();
          }
          return;
        }
        var currentValue = currentItem.value;
        isPromise(currentValue) && (currentValue = observableFromPromise(currentValue));
        var outer = new SingleAssignmentDisposable();
        var inner = new SingleAssignmentDisposable();
        subscription.setDisposable(new BinaryDisposable(inner, outer));
        outer.setDisposable(currentValue.subscribe(function(x) {
          o.onNext(x);
        }, function(exn) {
          inner.setDisposable(notifier.subscribe(self, function(ex) {
            o.onError(ex);
          }, function() {
            o.onCompleted();
          }));
          exceptions.onNext(exn);
        }, function() {
          o.onCompleted();
        }));
      });
      return new NAryDisposable([notificationDisposable, subscription, cancelable, new IsDisposedDisposable(state)]);
    });
  };
  var RepeatEnumerable = (function(__super__) {
    inherits(RepeatEnumerable, __super__);
    function RepeatEnumerable(v, c) {
      this.v = v;
      this.c = c == null ? -1 : c;
    }
    RepeatEnumerable.prototype[$iterator$] = function() {
      return new RepeatEnumerator(this);
    };
    function RepeatEnumerator(p) {
      this.v = p.v;
      this.l = p.c;
    }
    RepeatEnumerator.prototype.next = function() {
      if (this.l === 0) {
        return doneEnumerator;
      }
      if (this.l > 0) {
        this.l--;
      }
      return {
        done: false,
        value: this.v
      };
    };
    return RepeatEnumerable;
  }(Enumerable));
  var enumerableRepeat = Enumerable.repeat = function(value, repeatCount) {
    return new RepeatEnumerable(value, repeatCount);
  };
  var OfEnumerable = (function(__super__) {
    inherits(OfEnumerable, __super__);
    function OfEnumerable(s, fn, thisArg) {
      this.s = s;
      this.fn = fn ? bindCallback(fn, thisArg, 3) : null;
    }
    OfEnumerable.prototype[$iterator$] = function() {
      return new OfEnumerator(this);
    };
    function OfEnumerator(p) {
      this.i = -1;
      this.s = p.s;
      this.l = this.s.length;
      this.fn = p.fn;
    }
    OfEnumerator.prototype.next = function() {
      return ++this.i < this.l ? {
        done: false,
        value: !this.fn ? this.s[this.i] : this.fn(this.s[this.i], this.i, this.s)
      } : doneEnumerator;
    };
    return OfEnumerable;
  }(Enumerable));
  var enumerableOf = Enumerable.of = function(source, selector, thisArg) {
    return new OfEnumerable(source, selector, thisArg);
  };
  var ToArrayObservable = (function(__super__) {
    inherits(ToArrayObservable, __super__);
    function ToArrayObservable(source) {
      this.source = source;
      __super__.call(this);
    }
    ToArrayObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new InnerObserver(o));
    };
    inherits(InnerObserver, AbstractObserver);
    function InnerObserver(o) {
      this.o = o;
      this.a = [];
      AbstractObserver.call(this);
    }
    InnerObserver.prototype.next = function(x) {
      this.a.push(x);
    };
    InnerObserver.prototype.error = function(e) {
      this.o.onError(e);
    };
    InnerObserver.prototype.completed = function() {
      this.o.onNext(this.a);
      this.o.onCompleted();
    };
    return ToArrayObservable;
  }(ObservableBase));
  observableProto.toArray = function() {
    return new ToArrayObservable(this);
  };
  Observable.create = function(subscribe, parent) {
    return new AnonymousObservable(subscribe, parent);
  };
  var Defer = (function(__super__) {
    inherits(Defer, __super__);
    function Defer(factory) {
      this._f = factory;
      __super__.call(this);
    }
    Defer.prototype.subscribeCore = function(o) {
      var result = tryCatch(this._f)();
      if (result === errorObj) {
        return observableThrow(result.e).subscribe(o);
      }
      isPromise(result) && (result = observableFromPromise(result));
      return result.subscribe(o);
    };
    return Defer;
  }(ObservableBase));
  var observableDefer = Observable.defer = function(observableFactory) {
    return new Defer(observableFactory);
  };
  var EmptyObservable = (function(__super__) {
    inherits(EmptyObservable, __super__);
    function EmptyObservable(scheduler) {
      this.scheduler = scheduler;
      __super__.call(this);
    }
    EmptyObservable.prototype.subscribeCore = function(observer) {
      var sink = new EmptySink(observer, this.scheduler);
      return sink.run();
    };
    function EmptySink(observer, scheduler) {
      this.observer = observer;
      this.scheduler = scheduler;
    }
    function scheduleItem(s, state) {
      state.onCompleted();
      return disposableEmpty;
    }
    EmptySink.prototype.run = function() {
      var state = this.observer;
      return this.scheduler === immediateScheduler ? scheduleItem(null, state) : this.scheduler.schedule(state, scheduleItem);
    };
    return EmptyObservable;
  }(ObservableBase));
  var EMPTY_OBSERVABLE = new EmptyObservable(immediateScheduler);
  var observableEmpty = Observable.empty = function(scheduler) {
    isScheduler(scheduler) || (scheduler = immediateScheduler);
    return scheduler === immediateScheduler ? EMPTY_OBSERVABLE : new EmptyObservable(scheduler);
  };
  var FromObservable = (function(__super__) {
    inherits(FromObservable, __super__);
    function FromObservable(iterable, fn, scheduler) {
      this._iterable = iterable;
      this._fn = fn;
      this._scheduler = scheduler;
      __super__.call(this);
    }
    function createScheduleMethod(o, it, fn) {
      return function loopRecursive(i, recurse) {
        var next = tryCatch(it.next).call(it);
        if (next === errorObj) {
          return o.onError(next.e);
        }
        if (next.done) {
          return o.onCompleted();
        }
        var result = next.value;
        if (isFunction(fn)) {
          result = tryCatch(fn)(result, i);
          if (result === errorObj) {
            return o.onError(result.e);
          }
        }
        o.onNext(result);
        recurse(i + 1);
      };
    }
    FromObservable.prototype.subscribeCore = function(o) {
      var list = Object(this._iterable),
          it = getIterable(list);
      return this._scheduler.scheduleRecursive(0, createScheduleMethod(o, it, this._fn));
    };
    return FromObservable;
  }(ObservableBase));
  var maxSafeInteger = Math.pow(2, 53) - 1;
  function StringIterable(s) {
    this._s = s;
  }
  StringIterable.prototype[$iterator$] = function() {
    return new StringIterator(this._s);
  };
  function StringIterator(s) {
    this._s = s;
    this._l = s.length;
    this._i = 0;
  }
  StringIterator.prototype[$iterator$] = function() {
    return this;
  };
  StringIterator.prototype.next = function() {
    return this._i < this._l ? {
      done: false,
      value: this._s.charAt(this._i++)
    } : doneEnumerator;
  };
  function ArrayIterable(a) {
    this._a = a;
  }
  ArrayIterable.prototype[$iterator$] = function() {
    return new ArrayIterator(this._a);
  };
  function ArrayIterator(a) {
    this._a = a;
    this._l = toLength(a);
    this._i = 0;
  }
  ArrayIterator.prototype[$iterator$] = function() {
    return this;
  };
  ArrayIterator.prototype.next = function() {
    return this._i < this._l ? {
      done: false,
      value: this._a[this._i++]
    } : doneEnumerator;
  };
  function numberIsFinite(value) {
    return typeof value === 'number' && root.isFinite(value);
  }
  function isNan(n) {
    return n !== n;
  }
  function getIterable(o) {
    var i = o[$iterator$],
        it;
    if (!i && typeof o === 'string') {
      it = new StringIterable(o);
      return it[$iterator$]();
    }
    if (!i && o.length !== undefined) {
      it = new ArrayIterable(o);
      return it[$iterator$]();
    }
    if (!i) {
      throw new TypeError('Object is not iterable');
    }
    return o[$iterator$]();
  }
  function sign(value) {
    var number = +value;
    if (number === 0) {
      return number;
    }
    if (isNaN(number)) {
      return number;
    }
    return number < 0 ? -1 : 1;
  }
  function toLength(o) {
    var len = +o.length;
    if (isNaN(len)) {
      return 0;
    }
    if (len === 0 || !numberIsFinite(len)) {
      return len;
    }
    len = sign(len) * Math.floor(Math.abs(len));
    if (len <= 0) {
      return 0;
    }
    if (len > maxSafeInteger) {
      return maxSafeInteger;
    }
    return len;
  }
  var observableFrom = Observable.from = function(iterable, mapFn, thisArg, scheduler) {
    if (iterable == null) {
      throw new Error('iterable cannot be null.');
    }
    if (mapFn && !isFunction(mapFn)) {
      throw new Error('mapFn when provided must be a function');
    }
    if (mapFn) {
      var mapper = bindCallback(mapFn, thisArg, 2);
    }
    isScheduler(scheduler) || (scheduler = currentThreadScheduler);
    return new FromObservable(iterable, mapper, scheduler);
  };
  var FromArrayObservable = (function(__super__) {
    inherits(FromArrayObservable, __super__);
    function FromArrayObservable(args, scheduler) {
      this._args = args;
      this._scheduler = scheduler;
      __super__.call(this);
    }
    function scheduleMethod(o, args) {
      var len = args.length;
      return function loopRecursive(i, recurse) {
        if (i < len) {
          o.onNext(args[i]);
          recurse(i + 1);
        } else {
          o.onCompleted();
        }
      };
    }
    FromArrayObservable.prototype.subscribeCore = function(o) {
      return this._scheduler.scheduleRecursive(0, scheduleMethod(o, this._args));
    };
    return FromArrayObservable;
  }(ObservableBase));
  var observableFromArray = Observable.fromArray = function(array, scheduler) {
    isScheduler(scheduler) || (scheduler = currentThreadScheduler);
    return new FromArrayObservable(array, scheduler);
  };
  var NeverObservable = (function(__super__) {
    inherits(NeverObservable, __super__);
    function NeverObservable() {
      __super__.call(this);
    }
    NeverObservable.prototype.subscribeCore = function(observer) {
      return disposableEmpty;
    };
    return NeverObservable;
  }(ObservableBase));
  var NEVER_OBSERVABLE = new NeverObservable();
  var observableNever = Observable.never = function() {
    return NEVER_OBSERVABLE;
  };
  function observableOf(scheduler, array) {
    isScheduler(scheduler) || (scheduler = currentThreadScheduler);
    return new FromArrayObservable(array, scheduler);
  }
  Observable.of = function() {
    var len = arguments.length,
        args = new Array(len);
    for (var i = 0; i < len; i++) {
      args[i] = arguments[i];
    }
    return new FromArrayObservable(args, currentThreadScheduler);
  };
  Observable.ofWithScheduler = function(scheduler) {
    var len = arguments.length,
        args = new Array(len - 1);
    for (var i = 1; i < len; i++) {
      args[i - 1] = arguments[i];
    }
    return new FromArrayObservable(args, scheduler);
  };
  var PairsObservable = (function(__super__) {
    inherits(PairsObservable, __super__);
    function PairsObservable(o, scheduler) {
      this._o = o;
      this._keys = Object.keys(o);
      this._scheduler = scheduler;
      __super__.call(this);
    }
    function scheduleMethod(o, obj, keys) {
      return function loopRecursive(i, recurse) {
        if (i < keys.length) {
          var key = keys[i];
          o.onNext([key, obj[key]]);
          recurse(i + 1);
        } else {
          o.onCompleted();
        }
      };
    }
    PairsObservable.prototype.subscribeCore = function(o) {
      return this._scheduler.scheduleRecursive(0, scheduleMethod(o, this._o, this._keys));
    };
    return PairsObservable;
  }(ObservableBase));
  Observable.pairs = function(obj, scheduler) {
    scheduler || (scheduler = currentThreadScheduler);
    return new PairsObservable(obj, scheduler);
  };
  var RangeObservable = (function(__super__) {
    inherits(RangeObservable, __super__);
    function RangeObservable(start, count, scheduler) {
      this.start = start;
      this.rangeCount = count;
      this.scheduler = scheduler;
      __super__.call(this);
    }
    function loopRecursive(start, count, o) {
      return function loop(i, recurse) {
        if (i < count) {
          o.onNext(start + i);
          recurse(i + 1);
        } else {
          o.onCompleted();
        }
      };
    }
    RangeObservable.prototype.subscribeCore = function(o) {
      return this.scheduler.scheduleRecursive(0, loopRecursive(this.start, this.rangeCount, o));
    };
    return RangeObservable;
  }(ObservableBase));
  Observable.range = function(start, count, scheduler) {
    isScheduler(scheduler) || (scheduler = currentThreadScheduler);
    return new RangeObservable(start, count, scheduler);
  };
  var RepeatObservable = (function(__super__) {
    inherits(RepeatObservable, __super__);
    function RepeatObservable(value, repeatCount, scheduler) {
      this.value = value;
      this.repeatCount = repeatCount == null ? -1 : repeatCount;
      this.scheduler = scheduler;
      __super__.call(this);
    }
    RepeatObservable.prototype.subscribeCore = function(observer) {
      var sink = new RepeatSink(observer, this);
      return sink.run();
    };
    return RepeatObservable;
  }(ObservableBase));
  function RepeatSink(observer, parent) {
    this.observer = observer;
    this.parent = parent;
  }
  RepeatSink.prototype.run = function() {
    var observer = this.observer,
        value = this.parent.value;
    function loopRecursive(i, recurse) {
      if (i === -1 || i > 0) {
        observer.onNext(value);
        i > 0 && i--;
      }
      if (i === 0) {
        return observer.onCompleted();
      }
      recurse(i);
    }
    return this.parent.scheduler.scheduleRecursive(this.parent.repeatCount, loopRecursive);
  };
  Observable.repeat = function(value, repeatCount, scheduler) {
    isScheduler(scheduler) || (scheduler = currentThreadScheduler);
    return new RepeatObservable(value, repeatCount, scheduler);
  };
  var JustObservable = (function(__super__) {
    inherits(JustObservable, __super__);
    function JustObservable(value, scheduler) {
      this._value = value;
      this._scheduler = scheduler;
      __super__.call(this);
    }
    JustObservable.prototype.subscribeCore = function(o) {
      var state = [this._value, o];
      return this._scheduler === immediateScheduler ? scheduleItem(null, state) : this._scheduler.schedule(state, scheduleItem);
    };
    function scheduleItem(s, state) {
      var value = state[0],
          observer = state[1];
      observer.onNext(value);
      observer.onCompleted();
      return disposableEmpty;
    }
    return JustObservable;
  }(ObservableBase));
  var observableReturn = Observable['return'] = Observable.just = function(value, scheduler) {
    isScheduler(scheduler) || (scheduler = immediateScheduler);
    return new JustObservable(value, scheduler);
  };
  var ThrowObservable = (function(__super__) {
    inherits(ThrowObservable, __super__);
    function ThrowObservable(error, scheduler) {
      this._error = error;
      this._scheduler = scheduler;
      __super__.call(this);
    }
    ThrowObservable.prototype.subscribeCore = function(o) {
      var state = [this._error, o];
      return this._scheduler === immediateScheduler ? scheduleItem(null, state) : this._scheduler.schedule(state, scheduleItem);
    };
    function scheduleItem(s, state) {
      var e = state[0],
          o = state[1];
      o.onError(e);
      return disposableEmpty;
    }
    return ThrowObservable;
  }(ObservableBase));
  var observableThrow = Observable['throw'] = function(error, scheduler) {
    isScheduler(scheduler) || (scheduler = immediateScheduler);
    return new ThrowObservable(error, scheduler);
  };
  var CatchObservable = (function(__super__) {
    inherits(CatchObservable, __super__);
    function CatchObservable(source, fn) {
      this.source = source;
      this._fn = fn;
      __super__.call(this);
    }
    CatchObservable.prototype.subscribeCore = function(o) {
      var d1 = new SingleAssignmentDisposable(),
          subscription = new SerialDisposable();
      subscription.setDisposable(d1);
      d1.setDisposable(this.source.subscribe(new CatchObserver(o, subscription, this._fn)));
      return subscription;
    };
    return CatchObservable;
  }(ObservableBase));
  var CatchObserver = (function(__super__) {
    inherits(CatchObserver, __super__);
    function CatchObserver(o, s, fn) {
      this._o = o;
      this._s = s;
      this._fn = fn;
      __super__.call(this);
    }
    CatchObserver.prototype.next = function(x) {
      this._o.onNext(x);
    };
    CatchObserver.prototype.completed = function() {
      return this._o.onCompleted();
    };
    CatchObserver.prototype.error = function(e) {
      var result = tryCatch(this._fn)(e);
      if (result === errorObj) {
        return this._o.onError(result.e);
      }
      isPromise(result) && (result = observableFromPromise(result));
      var d = new SingleAssignmentDisposable();
      this._s.setDisposable(d);
      d.setDisposable(result.subscribe(this._o));
    };
    return CatchObserver;
  }(AbstractObserver));
  observableProto['catch'] = function(handlerOrSecond) {
    return isFunction(handlerOrSecond) ? new CatchObservable(this, handlerOrSecond) : observableCatch([this, handlerOrSecond]);
  };
  var observableCatch = Observable['catch'] = function() {
    var items;
    if (Array.isArray(arguments[0])) {
      items = arguments[0];
    } else {
      var len = arguments.length;
      items = new Array(len);
      for (var i = 0; i < len; i++) {
        items[i] = arguments[i];
      }
    }
    return enumerableOf(items).catchError();
  };
  observableProto.combineLatest = function() {
    var len = arguments.length,
        args = new Array(len);
    for (var i = 0; i < len; i++) {
      args[i] = arguments[i];
    }
    if (Array.isArray(args[0])) {
      args[0].unshift(this);
    } else {
      args.unshift(this);
    }
    return combineLatest.apply(this, args);
  };
  function falseFactory() {
    return false;
  }
  function argumentsToArray() {
    var len = arguments.length,
        args = new Array(len);
    for (var i = 0; i < len; i++) {
      args[i] = arguments[i];
    }
    return args;
  }
  var CombineLatestObservable = (function(__super__) {
    inherits(CombineLatestObservable, __super__);
    function CombineLatestObservable(params, cb) {
      this._params = params;
      this._cb = cb;
      __super__.call(this);
    }
    CombineLatestObservable.prototype.subscribeCore = function(observer) {
      var len = this._params.length,
          subscriptions = new Array(len);
      var state = {
        hasValue: arrayInitialize(len, falseFactory),
        hasValueAll: false,
        isDone: arrayInitialize(len, falseFactory),
        values: new Array(len)
      };
      for (var i = 0; i < len; i++) {
        var source = this._params[i],
            sad = new SingleAssignmentDisposable();
        subscriptions[i] = sad;
        isPromise(source) && (source = observableFromPromise(source));
        sad.setDisposable(source.subscribe(new CombineLatestObserver(observer, i, this._cb, state)));
      }
      return new NAryDisposable(subscriptions);
    };
    return CombineLatestObservable;
  }(ObservableBase));
  var CombineLatestObserver = (function(__super__) {
    inherits(CombineLatestObserver, __super__);
    function CombineLatestObserver(o, i, cb, state) {
      this._o = o;
      this._i = i;
      this._cb = cb;
      this._state = state;
      __super__.call(this);
    }
    function notTheSame(i) {
      return function(x, j) {
        return j !== i;
      };
    }
    CombineLatestObserver.prototype.next = function(x) {
      this._state.values[this._i] = x;
      this._state.hasValue[this._i] = true;
      if (this._state.hasValueAll || (this._state.hasValueAll = this._state.hasValue.every(identity))) {
        var res = tryCatch(this._cb).apply(null, this._state.values);
        if (res === errorObj) {
          return this._o.onError(res.e);
        }
        this._o.onNext(res);
      } else if (this._state.isDone.filter(notTheSame(this._i)).every(identity)) {
        this._o.onCompleted();
      }
    };
    CombineLatestObserver.prototype.error = function(e) {
      this._o.onError(e);
    };
    CombineLatestObserver.prototype.completed = function() {
      this._state.isDone[this._i] = true;
      this._state.isDone.every(identity) && this._o.onCompleted();
    };
    return CombineLatestObserver;
  }(AbstractObserver));
  var combineLatest = Observable.combineLatest = function() {
    var len = arguments.length,
        args = new Array(len);
    for (var i = 0; i < len; i++) {
      args[i] = arguments[i];
    }
    var resultSelector = isFunction(args[len - 1]) ? args.pop() : argumentsToArray;
    Array.isArray(args[0]) && (args = args[0]);
    return new CombineLatestObservable(args, resultSelector);
  };
  observableProto.concat = function() {
    for (var args = [],
        i = 0,
        len = arguments.length; i < len; i++) {
      args.push(arguments[i]);
    }
    args.unshift(this);
    return observableConcat.apply(null, args);
  };
  var ConcatObserver = (function(__super__) {
    inherits(ConcatObserver, __super__);
    function ConcatObserver(s, fn) {
      this._s = s;
      this._fn = fn;
      __super__.call(this);
    }
    ConcatObserver.prototype.next = function(x) {
      this._s.o.onNext(x);
    };
    ConcatObserver.prototype.error = function(e) {
      this._s.o.onError(e);
    };
    ConcatObserver.prototype.completed = function() {
      this._s.i++;
      this._fn(this._s);
    };
    return ConcatObserver;
  }(AbstractObserver));
  var ConcatObservable = (function(__super__) {
    inherits(ConcatObservable, __super__);
    function ConcatObservable(sources) {
      this._sources = sources;
      __super__.call(this);
    }
    function scheduleRecursive(state, recurse) {
      if (state.disposable.isDisposed) {
        return;
      }
      if (state.i === state.sources.length) {
        return state.o.onCompleted();
      }
      var currentValue = state.sources[state.i];
      isPromise(currentValue) && (currentValue = observableFromPromise(currentValue));
      var d = new SingleAssignmentDisposable();
      state.subscription.setDisposable(d);
      d.setDisposable(currentValue.subscribe(new ConcatObserver(state, recurse)));
    }
    ConcatObservable.prototype.subscribeCore = function(o) {
      var subscription = new SerialDisposable();
      var disposable = disposableCreate(noop);
      var state = {
        o: o,
        i: 0,
        subscription: subscription,
        disposable: disposable,
        sources: this._sources
      };
      var cancelable = immediateScheduler.scheduleRecursive(state, scheduleRecursive);
      return new NAryDisposable([subscription, disposable, cancelable]);
    };
    return ConcatObservable;
  }(ObservableBase));
  var observableConcat = Observable.concat = function() {
    var args;
    if (Array.isArray(arguments[0])) {
      args = arguments[0];
    } else {
      args = new Array(arguments.length);
      for (var i = 0,
          len = arguments.length; i < len; i++) {
        args[i] = arguments[i];
      }
    }
    return new ConcatObservable(args);
  };
  observableProto.concatAll = function() {
    return this.merge(1);
  };
  var MergeObservable = (function(__super__) {
    inherits(MergeObservable, __super__);
    function MergeObservable(source, maxConcurrent) {
      this.source = source;
      this.maxConcurrent = maxConcurrent;
      __super__.call(this);
    }
    MergeObservable.prototype.subscribeCore = function(observer) {
      var g = new CompositeDisposable();
      g.add(this.source.subscribe(new MergeObserver(observer, this.maxConcurrent, g)));
      return g;
    };
    return MergeObservable;
  }(ObservableBase));
  var MergeObserver = (function(__super__) {
    function MergeObserver(o, max, g) {
      this.o = o;
      this.max = max;
      this.g = g;
      this.done = false;
      this.q = [];
      this.activeCount = 0;
      __super__.call(this);
    }
    inherits(MergeObserver, __super__);
    MergeObserver.prototype.handleSubscribe = function(xs) {
      var sad = new SingleAssignmentDisposable();
      this.g.add(sad);
      isPromise(xs) && (xs = observableFromPromise(xs));
      sad.setDisposable(xs.subscribe(new InnerObserver(this, sad)));
    };
    MergeObserver.prototype.next = function(innerSource) {
      if (this.activeCount < this.max) {
        this.activeCount++;
        this.handleSubscribe(innerSource);
      } else {
        this.q.push(innerSource);
      }
    };
    MergeObserver.prototype.error = function(e) {
      this.o.onError(e);
    };
    MergeObserver.prototype.completed = function() {
      this.done = true;
      this.activeCount === 0 && this.o.onCompleted();
    };
    function InnerObserver(parent, sad) {
      this.parent = parent;
      this.sad = sad;
      __super__.call(this);
    }
    inherits(InnerObserver, __super__);
    InnerObserver.prototype.next = function(x) {
      this.parent.o.onNext(x);
    };
    InnerObserver.prototype.error = function(e) {
      this.parent.o.onError(e);
    };
    InnerObserver.prototype.completed = function() {
      this.parent.g.remove(this.sad);
      if (this.parent.q.length > 0) {
        this.parent.handleSubscribe(this.parent.q.shift());
      } else {
        this.parent.activeCount--;
        this.parent.done && this.parent.activeCount === 0 && this.parent.o.onCompleted();
      }
    };
    return MergeObserver;
  }(AbstractObserver));
  observableProto.merge = function(maxConcurrentOrOther) {
    return typeof maxConcurrentOrOther !== 'number' ? observableMerge(this, maxConcurrentOrOther) : new MergeObservable(this, maxConcurrentOrOther);
  };
  var observableMerge = Observable.merge = function() {
    var scheduler,
        sources = [],
        i,
        len = arguments.length;
    if (!arguments[0]) {
      scheduler = immediateScheduler;
      for (i = 1; i < len; i++) {
        sources.push(arguments[i]);
      }
    } else if (isScheduler(arguments[0])) {
      scheduler = arguments[0];
      for (i = 1; i < len; i++) {
        sources.push(arguments[i]);
      }
    } else {
      scheduler = immediateScheduler;
      for (i = 0; i < len; i++) {
        sources.push(arguments[i]);
      }
    }
    if (Array.isArray(sources[0])) {
      sources = sources[0];
    }
    return observableOf(scheduler, sources).mergeAll();
  };
  var CompositeError = Rx.CompositeError = function(errors) {
    this.innerErrors = errors;
    this.message = 'This contains multiple errors. Check the innerErrors';
    Error.call(this);
  };
  CompositeError.prototype = Object.create(Error.prototype);
  CompositeError.prototype.name = 'CompositeError';
  var MergeDelayErrorObservable = (function(__super__) {
    inherits(MergeDelayErrorObservable, __super__);
    function MergeDelayErrorObservable(source) {
      this.source = source;
      __super__.call(this);
    }
    MergeDelayErrorObservable.prototype.subscribeCore = function(o) {
      var group = new CompositeDisposable(),
          m = new SingleAssignmentDisposable(),
          state = {
            isStopped: false,
            errors: [],
            o: o
          };
      group.add(m);
      m.setDisposable(this.source.subscribe(new MergeDelayErrorObserver(group, state)));
      return group;
    };
    return MergeDelayErrorObservable;
  }(ObservableBase));
  var MergeDelayErrorObserver = (function(__super__) {
    inherits(MergeDelayErrorObserver, __super__);
    function MergeDelayErrorObserver(group, state) {
      this._group = group;
      this._state = state;
      __super__.call(this);
    }
    function setCompletion(o, errors) {
      if (errors.length === 0) {
        o.onCompleted();
      } else if (errors.length === 1) {
        o.onError(errors[0]);
      } else {
        o.onError(new CompositeError(errors));
      }
    }
    MergeDelayErrorObserver.prototype.next = function(x) {
      var inner = new SingleAssignmentDisposable();
      this._group.add(inner);
      isPromise(x) && (x = observableFromPromise(x));
      inner.setDisposable(x.subscribe(new InnerObserver(inner, this._group, this._state)));
    };
    MergeDelayErrorObserver.prototype.error = function(e) {
      this._state.errors.push(e);
      this._state.isStopped = true;
      this._group.length === 1 && setCompletion(this._state.o, this._state.errors);
    };
    MergeDelayErrorObserver.prototype.completed = function() {
      this._state.isStopped = true;
      this._group.length === 1 && setCompletion(this._state.o, this._state.errors);
    };
    inherits(InnerObserver, __super__);
    function InnerObserver(inner, group, state) {
      this._inner = inner;
      this._group = group;
      this._state = state;
      __super__.call(this);
    }
    InnerObserver.prototype.next = function(x) {
      this._state.o.onNext(x);
    };
    InnerObserver.prototype.error = function(e) {
      this._state.errors.push(e);
      this._group.remove(this._inner);
      this._state.isStopped && this._group.length === 1 && setCompletion(this._state.o, this._state.errors);
    };
    InnerObserver.prototype.completed = function() {
      this._group.remove(this._inner);
      this._state.isStopped && this._group.length === 1 && setCompletion(this._state.o, this._state.errors);
    };
    return MergeDelayErrorObserver;
  }(AbstractObserver));
  Observable.mergeDelayError = function() {
    var args;
    if (Array.isArray(arguments[0])) {
      args = arguments[0];
    } else {
      var len = arguments.length;
      args = new Array(len);
      for (var i = 0; i < len; i++) {
        args[i] = arguments[i];
      }
    }
    var source = observableOf(null, args);
    return new MergeDelayErrorObservable(source);
  };
  var MergeAllObservable = (function(__super__) {
    inherits(MergeAllObservable, __super__);
    function MergeAllObservable(source) {
      this.source = source;
      __super__.call(this);
    }
    MergeAllObservable.prototype.subscribeCore = function(o) {
      var g = new CompositeDisposable(),
          m = new SingleAssignmentDisposable();
      g.add(m);
      m.setDisposable(this.source.subscribe(new MergeAllObserver(o, g)));
      return g;
    };
    return MergeAllObservable;
  }(ObservableBase));
  var MergeAllObserver = (function(__super__) {
    function MergeAllObserver(o, g) {
      this.o = o;
      this.g = g;
      this.done = false;
      __super__.call(this);
    }
    inherits(MergeAllObserver, __super__);
    MergeAllObserver.prototype.next = function(innerSource) {
      var sad = new SingleAssignmentDisposable();
      this.g.add(sad);
      isPromise(innerSource) && (innerSource = observableFromPromise(innerSource));
      sad.setDisposable(innerSource.subscribe(new InnerObserver(this, sad)));
    };
    MergeAllObserver.prototype.error = function(e) {
      this.o.onError(e);
    };
    MergeAllObserver.prototype.completed = function() {
      this.done = true;
      this.g.length === 1 && this.o.onCompleted();
    };
    function InnerObserver(parent, sad) {
      this.parent = parent;
      this.sad = sad;
      __super__.call(this);
    }
    inherits(InnerObserver, __super__);
    InnerObserver.prototype.next = function(x) {
      this.parent.o.onNext(x);
    };
    InnerObserver.prototype.error = function(e) {
      this.parent.o.onError(e);
    };
    InnerObserver.prototype.completed = function() {
      this.parent.g.remove(this.sad);
      this.parent.done && this.parent.g.length === 1 && this.parent.o.onCompleted();
    };
    return MergeAllObserver;
  }(AbstractObserver));
  observableProto.mergeAll = function() {
    return new MergeAllObservable(this);
  };
  var SkipUntilObservable = (function(__super__) {
    inherits(SkipUntilObservable, __super__);
    function SkipUntilObservable(source, other) {
      this._s = source;
      this._o = isPromise(other) ? observableFromPromise(other) : other;
      this._open = false;
      __super__.call(this);
    }
    SkipUntilObservable.prototype.subscribeCore = function(o) {
      var leftSubscription = new SingleAssignmentDisposable();
      leftSubscription.setDisposable(this._s.subscribe(new SkipUntilSourceObserver(o, this)));
      isPromise(this._o) && (this._o = observableFromPromise(this._o));
      var rightSubscription = new SingleAssignmentDisposable();
      rightSubscription.setDisposable(this._o.subscribe(new SkipUntilOtherObserver(o, this, rightSubscription)));
      return new BinaryDisposable(leftSubscription, rightSubscription);
    };
    return SkipUntilObservable;
  }(ObservableBase));
  var SkipUntilSourceObserver = (function(__super__) {
    inherits(SkipUntilSourceObserver, __super__);
    function SkipUntilSourceObserver(o, p) {
      this._o = o;
      this._p = p;
      __super__.call(this);
    }
    SkipUntilSourceObserver.prototype.next = function(x) {
      this._p._open && this._o.onNext(x);
    };
    SkipUntilSourceObserver.prototype.error = function(err) {
      this._o.onError(err);
    };
    SkipUntilSourceObserver.prototype.onCompleted = function() {
      this._p._open && this._o.onCompleted();
    };
    return SkipUntilSourceObserver;
  }(AbstractObserver));
  var SkipUntilOtherObserver = (function(__super__) {
    inherits(SkipUntilOtherObserver, __super__);
    function SkipUntilOtherObserver(o, p, r) {
      this._o = o;
      this._p = p;
      this._r = r;
      __super__.call(this);
    }
    SkipUntilOtherObserver.prototype.next = function() {
      this._p._open = true;
      this._r.dispose();
    };
    SkipUntilOtherObserver.prototype.error = function(err) {
      this._o.onError(err);
    };
    SkipUntilOtherObserver.prototype.onCompleted = function() {
      this._r.dispose();
    };
    return SkipUntilOtherObserver;
  }(AbstractObserver));
  observableProto.skipUntil = function(other) {
    return new SkipUntilObservable(this, other);
  };
  var SwitchObservable = (function(__super__) {
    inherits(SwitchObservable, __super__);
    function SwitchObservable(source) {
      this.source = source;
      __super__.call(this);
    }
    SwitchObservable.prototype.subscribeCore = function(o) {
      var inner = new SerialDisposable(),
          s = this.source.subscribe(new SwitchObserver(o, inner));
      return new BinaryDisposable(s, inner);
    };
    inherits(SwitchObserver, AbstractObserver);
    function SwitchObserver(o, inner) {
      this.o = o;
      this.inner = inner;
      this.stopped = false;
      this.latest = 0;
      this.hasLatest = false;
      AbstractObserver.call(this);
    }
    SwitchObserver.prototype.next = function(innerSource) {
      var d = new SingleAssignmentDisposable(),
          id = ++this.latest;
      this.hasLatest = true;
      this.inner.setDisposable(d);
      isPromise(innerSource) && (innerSource = observableFromPromise(innerSource));
      d.setDisposable(innerSource.subscribe(new InnerObserver(this, id)));
    };
    SwitchObserver.prototype.error = function(e) {
      this.o.onError(e);
    };
    SwitchObserver.prototype.completed = function() {
      this.stopped = true;
      !this.hasLatest && this.o.onCompleted();
    };
    inherits(InnerObserver, AbstractObserver);
    function InnerObserver(parent, id) {
      this.parent = parent;
      this.id = id;
      AbstractObserver.call(this);
    }
    InnerObserver.prototype.next = function(x) {
      this.parent.latest === this.id && this.parent.o.onNext(x);
    };
    InnerObserver.prototype.error = function(e) {
      this.parent.latest === this.id && this.parent.o.onError(e);
    };
    InnerObserver.prototype.completed = function() {
      if (this.parent.latest === this.id) {
        this.parent.hasLatest = false;
        this.parent.stopped && this.parent.o.onCompleted();
      }
    };
    return SwitchObservable;
  }(ObservableBase));
  observableProto['switch'] = observableProto.switchLatest = function() {
    return new SwitchObservable(this);
  };
  var TakeUntilObservable = (function(__super__) {
    inherits(TakeUntilObservable, __super__);
    function TakeUntilObservable(source, other) {
      this.source = source;
      this.other = isPromise(other) ? observableFromPromise(other) : other;
      __super__.call(this);
    }
    TakeUntilObservable.prototype.subscribeCore = function(o) {
      return new BinaryDisposable(this.source.subscribe(o), this.other.subscribe(new TakeUntilObserver(o)));
    };
    return TakeUntilObservable;
  }(ObservableBase));
  var TakeUntilObserver = (function(__super__) {
    inherits(TakeUntilObserver, __super__);
    function TakeUntilObserver(o) {
      this._o = o;
      __super__.call(this);
    }
    TakeUntilObserver.prototype.next = function() {
      this._o.onCompleted();
    };
    TakeUntilObserver.prototype.error = function(err) {
      this._o.onError(err);
    };
    TakeUntilObserver.prototype.onCompleted = noop;
    return TakeUntilObserver;
  }(AbstractObserver));
  observableProto.takeUntil = function(other) {
    return new TakeUntilObservable(this, other);
  };
  function falseFactory() {
    return false;
  }
  function argumentsToArray() {
    var len = arguments.length,
        args = new Array(len);
    for (var i = 0; i < len; i++) {
      args[i] = arguments[i];
    }
    return args;
  }
  var WithLatestFromObservable = (function(__super__) {
    inherits(WithLatestFromObservable, __super__);
    function WithLatestFromObservable(source, sources, resultSelector) {
      this._s = source;
      this._ss = sources;
      this._cb = resultSelector;
      __super__.call(this);
    }
    WithLatestFromObservable.prototype.subscribeCore = function(o) {
      var len = this._ss.length;
      var state = {
        hasValue: arrayInitialize(len, falseFactory),
        hasValueAll: false,
        values: new Array(len)
      };
      var n = this._ss.length,
          subscriptions = new Array(n + 1);
      for (var i = 0; i < n; i++) {
        var other = this._ss[i],
            sad = new SingleAssignmentDisposable();
        isPromise(other) && (other = observableFromPromise(other));
        sad.setDisposable(other.subscribe(new WithLatestFromOtherObserver(o, i, state)));
        subscriptions[i] = sad;
      }
      var outerSad = new SingleAssignmentDisposable();
      outerSad.setDisposable(this._s.subscribe(new WithLatestFromSourceObserver(o, this._cb, state)));
      subscriptions[n] = outerSad;
      return new NAryDisposable(subscriptions);
    };
    return WithLatestFromObservable;
  }(ObservableBase));
  var WithLatestFromOtherObserver = (function(__super__) {
    inherits(WithLatestFromOtherObserver, __super__);
    function WithLatestFromOtherObserver(o, i, state) {
      this._o = o;
      this._i = i;
      this._state = state;
      __super__.call(this);
    }
    WithLatestFromOtherObserver.prototype.next = function(x) {
      this._state.values[this._i] = x;
      this._state.hasValue[this._i] = true;
      this._state.hasValueAll = this._state.hasValue.every(identity);
    };
    WithLatestFromOtherObserver.prototype.error = function(e) {
      this._o.onError(e);
    };
    WithLatestFromOtherObserver.prototype.completed = noop;
    return WithLatestFromOtherObserver;
  }(AbstractObserver));
  var WithLatestFromSourceObserver = (function(__super__) {
    inherits(WithLatestFromSourceObserver, __super__);
    function WithLatestFromSourceObserver(o, cb, state) {
      this._o = o;
      this._cb = cb;
      this._state = state;
      __super__.call(this);
    }
    WithLatestFromSourceObserver.prototype.next = function(x) {
      var allValues = [x].concat(this._state.values);
      if (!this._state.hasValueAll) {
        return;
      }
      var res = tryCatch(this._cb).apply(null, allValues);
      if (res === errorObj) {
        return this._o.onError(res.e);
      }
      this._o.onNext(res);
    };
    WithLatestFromSourceObserver.prototype.error = function(e) {
      this._o.onError(e);
    };
    WithLatestFromSourceObserver.prototype.completed = function() {
      this._o.onCompleted();
    };
    return WithLatestFromSourceObserver;
  }(AbstractObserver));
  observableProto.withLatestFrom = function() {
    if (arguments.length === 0) {
      throw new Error('invalid arguments');
    }
    var len = arguments.length,
        args = new Array(len);
    for (var i = 0; i < len; i++) {
      args[i] = arguments[i];
    }
    var resultSelector = isFunction(args[len - 1]) ? args.pop() : argumentsToArray;
    Array.isArray(args[0]) && (args = args[0]);
    return new WithLatestFromObservable(this, args, resultSelector);
  };
  function falseFactory() {
    return false;
  }
  function emptyArrayFactory() {
    return [];
  }
  var ZipObservable = (function(__super__) {
    inherits(ZipObservable, __super__);
    function ZipObservable(sources, resultSelector) {
      this._s = sources;
      this._cb = resultSelector;
      __super__.call(this);
    }
    ZipObservable.prototype.subscribeCore = function(observer) {
      var n = this._s.length,
          subscriptions = new Array(n),
          done = arrayInitialize(n, falseFactory),
          q = arrayInitialize(n, emptyArrayFactory);
      for (var i = 0; i < n; i++) {
        var source = this._s[i],
            sad = new SingleAssignmentDisposable();
        subscriptions[i] = sad;
        isPromise(source) && (source = observableFromPromise(source));
        sad.setDisposable(source.subscribe(new ZipObserver(observer, i, this, q, done)));
      }
      return new NAryDisposable(subscriptions);
    };
    return ZipObservable;
  }(ObservableBase));
  var ZipObserver = (function(__super__) {
    inherits(ZipObserver, __super__);
    function ZipObserver(o, i, p, q, d) {
      this._o = o;
      this._i = i;
      this._p = p;
      this._q = q;
      this._d = d;
      __super__.call(this);
    }
    function notEmpty(x) {
      return x.length > 0;
    }
    function shiftEach(x) {
      return x.shift();
    }
    function notTheSame(i) {
      return function(x, j) {
        return j !== i;
      };
    }
    ZipObserver.prototype.next = function(x) {
      this._q[this._i].push(x);
      if (this._q.every(notEmpty)) {
        var queuedValues = this._q.map(shiftEach);
        var res = tryCatch(this._p._cb).apply(null, queuedValues);
        if (res === errorObj) {
          return this._o.onError(res.e);
        }
        this._o.onNext(res);
      } else if (this._d.filter(notTheSame(this._i)).every(identity)) {
        this._o.onCompleted();
      }
    };
    ZipObserver.prototype.error = function(e) {
      this._o.onError(e);
    };
    ZipObserver.prototype.completed = function() {
      this._d[this._i] = true;
      this._d.every(identity) && this._o.onCompleted();
    };
    return ZipObserver;
  }(AbstractObserver));
  observableProto.zip = function() {
    if (arguments.length === 0) {
      throw new Error('invalid arguments');
    }
    var len = arguments.length,
        args = new Array(len);
    for (var i = 0; i < len; i++) {
      args[i] = arguments[i];
    }
    var resultSelector = isFunction(args[len - 1]) ? args.pop() : argumentsToArray;
    Array.isArray(args[0]) && (args = args[0]);
    var parent = this;
    args.unshift(parent);
    return new ZipObservable(args, resultSelector);
  };
  Observable.zip = function() {
    var len = arguments.length,
        args = new Array(len);
    for (var i = 0; i < len; i++) {
      args[i] = arguments[i];
    }
    if (Array.isArray(args[0])) {
      args = isFunction(args[1]) ? args[0].concat(args[1]) : args[0];
    }
    var first = args.shift();
    return first.zip.apply(first, args);
  };
  function falseFactory() {
    return false;
  }
  function emptyArrayFactory() {
    return [];
  }
  function argumentsToArray() {
    var len = arguments.length,
        args = new Array(len);
    for (var i = 0; i < len; i++) {
      args[i] = arguments[i];
    }
    return args;
  }
  var ZipIterableObservable = (function(__super__) {
    inherits(ZipIterableObservable, __super__);
    function ZipIterableObservable(sources, cb) {
      this.sources = sources;
      this._cb = cb;
      __super__.call(this);
    }
    ZipIterableObservable.prototype.subscribeCore = function(o) {
      var sources = this.sources,
          len = sources.length,
          subscriptions = new Array(len);
      var state = {
        q: arrayInitialize(len, emptyArrayFactory),
        done: arrayInitialize(len, falseFactory),
        cb: this._cb,
        o: o
      };
      for (var i = 0; i < len; i++) {
        (function(i) {
          var source = sources[i],
              sad = new SingleAssignmentDisposable();
          (isArrayLike(source) || isIterable(source)) && (source = observableFrom(source));
          subscriptions[i] = sad;
          sad.setDisposable(source.subscribe(new ZipIterableObserver(state, i)));
        }(i));
      }
      return new NAryDisposable(subscriptions);
    };
    return ZipIterableObservable;
  }(ObservableBase));
  var ZipIterableObserver = (function(__super__) {
    inherits(ZipIterableObserver, __super__);
    function ZipIterableObserver(s, i) {
      this._s = s;
      this._i = i;
      __super__.call(this);
    }
    function notEmpty(x) {
      return x.length > 0;
    }
    function shiftEach(x) {
      return x.shift();
    }
    function notTheSame(i) {
      return function(x, j) {
        return j !== i;
      };
    }
    ZipIterableObserver.prototype.next = function(x) {
      this._s.q[this._i].push(x);
      if (this._s.q.every(notEmpty)) {
        var queuedValues = this._s.q.map(shiftEach),
            res = tryCatch(this._s.cb).apply(null, queuedValues);
        if (res === errorObj) {
          return this._s.o.onError(res.e);
        }
        this._s.o.onNext(res);
      } else if (this._s.done.filter(notTheSame(this._i)).every(identity)) {
        this._s.o.onCompleted();
      }
    };
    ZipIterableObserver.prototype.error = function(e) {
      this._s.o.onError(e);
    };
    ZipIterableObserver.prototype.completed = function() {
      this._s.done[this._i] = true;
      this._s.done.every(identity) && this._s.o.onCompleted();
    };
    return ZipIterableObserver;
  }(AbstractObserver));
  observableProto.zipIterable = function() {
    if (arguments.length === 0) {
      throw new Error('invalid arguments');
    }
    var len = arguments.length,
        args = new Array(len);
    for (var i = 0; i < len; i++) {
      args[i] = arguments[i];
    }
    var resultSelector = isFunction(args[len - 1]) ? args.pop() : argumentsToArray;
    var parent = this;
    args.unshift(parent);
    return new ZipIterableObservable(args, resultSelector);
  };
  function asObservable(source) {
    return function subscribe(o) {
      return source.subscribe(o);
    };
  }
  observableProto.asObservable = function() {
    return new AnonymousObservable(asObservable(this), this);
  };
  var DematerializeObservable = (function(__super__) {
    inherits(DematerializeObservable, __super__);
    function DematerializeObservable(source) {
      this.source = source;
      __super__.call(this);
    }
    DematerializeObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new DematerializeObserver(o));
    };
    return DematerializeObservable;
  }(ObservableBase));
  var DematerializeObserver = (function(__super__) {
    inherits(DematerializeObserver, __super__);
    function DematerializeObserver(o) {
      this._o = o;
      __super__.call(this);
    }
    DematerializeObserver.prototype.next = function(x) {
      x.accept(this._o);
    };
    DematerializeObserver.prototype.error = function(e) {
      this._o.onError(e);
    };
    DematerializeObserver.prototype.completed = function() {
      this._o.onCompleted();
    };
    return DematerializeObserver;
  }(AbstractObserver));
  observableProto.dematerialize = function() {
    return new DematerializeObservable(this);
  };
  var DistinctUntilChangedObservable = (function(__super__) {
    inherits(DistinctUntilChangedObservable, __super__);
    function DistinctUntilChangedObservable(source, keyFn, comparer) {
      this.source = source;
      this.keyFn = keyFn;
      this.comparer = comparer;
      __super__.call(this);
    }
    DistinctUntilChangedObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new DistinctUntilChangedObserver(o, this.keyFn, this.comparer));
    };
    return DistinctUntilChangedObservable;
  }(ObservableBase));
  var DistinctUntilChangedObserver = (function(__super__) {
    inherits(DistinctUntilChangedObserver, __super__);
    function DistinctUntilChangedObserver(o, keyFn, comparer) {
      this.o = o;
      this.keyFn = keyFn;
      this.comparer = comparer;
      this.hasCurrentKey = false;
      this.currentKey = null;
      __super__.call(this);
    }
    DistinctUntilChangedObserver.prototype.next = function(x) {
      var key = x,
          comparerEquals;
      if (isFunction(this.keyFn)) {
        key = tryCatch(this.keyFn)(x);
        if (key === errorObj) {
          return this.o.onError(key.e);
        }
      }
      if (this.hasCurrentKey) {
        comparerEquals = tryCatch(this.comparer)(this.currentKey, key);
        if (comparerEquals === errorObj) {
          return this.o.onError(comparerEquals.e);
        }
      }
      if (!this.hasCurrentKey || !comparerEquals) {
        this.hasCurrentKey = true;
        this.currentKey = key;
        this.o.onNext(x);
      }
    };
    DistinctUntilChangedObserver.prototype.error = function(e) {
      this.o.onError(e);
    };
    DistinctUntilChangedObserver.prototype.completed = function() {
      this.o.onCompleted();
    };
    return DistinctUntilChangedObserver;
  }(AbstractObserver));
  observableProto.distinctUntilChanged = function(keyFn, comparer) {
    comparer || (comparer = defaultComparer);
    return new DistinctUntilChangedObservable(this, keyFn, comparer);
  };
  var TapObservable = (function(__super__) {
    inherits(TapObservable, __super__);
    function TapObservable(source, observerOrOnNext, onError, onCompleted) {
      this.source = source;
      this._oN = observerOrOnNext;
      this._oE = onError;
      this._oC = onCompleted;
      __super__.call(this);
    }
    TapObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new InnerObserver(o, this));
    };
    inherits(InnerObserver, AbstractObserver);
    function InnerObserver(o, p) {
      this.o = o;
      this.t = !p._oN || isFunction(p._oN) ? observerCreate(p._oN || noop, p._oE || noop, p._oC || noop) : p._oN;
      this.isStopped = false;
      AbstractObserver.call(this);
    }
    InnerObserver.prototype.next = function(x) {
      var res = tryCatch(this.t.onNext).call(this.t, x);
      if (res === errorObj) {
        this.o.onError(res.e);
      }
      this.o.onNext(x);
    };
    InnerObserver.prototype.error = function(err) {
      var res = tryCatch(this.t.onError).call(this.t, err);
      if (res === errorObj) {
        return this.o.onError(res.e);
      }
      this.o.onError(err);
    };
    InnerObserver.prototype.completed = function() {
      var res = tryCatch(this.t.onCompleted).call(this.t);
      if (res === errorObj) {
        return this.o.onError(res.e);
      }
      this.o.onCompleted();
    };
    return TapObservable;
  }(ObservableBase));
  observableProto['do'] = observableProto.tap = observableProto.doAction = function(observerOrOnNext, onError, onCompleted) {
    return new TapObservable(this, observerOrOnNext, onError, onCompleted);
  };
  observableProto.doOnNext = observableProto.tapOnNext = function(onNext, thisArg) {
    return this.tap(typeof thisArg !== 'undefined' ? function(x) {
      onNext.call(thisArg, x);
    } : onNext);
  };
  observableProto.doOnError = observableProto.tapOnError = function(onError, thisArg) {
    return this.tap(noop, typeof thisArg !== 'undefined' ? function(e) {
      onError.call(thisArg, e);
    } : onError);
  };
  observableProto.doOnCompleted = observableProto.tapOnCompleted = function(onCompleted, thisArg) {
    return this.tap(noop, null, typeof thisArg !== 'undefined' ? function() {
      onCompleted.call(thisArg);
    } : onCompleted);
  };
  var FinallyObservable = (function(__super__) {
    inherits(FinallyObservable, __super__);
    function FinallyObservable(source, fn, thisArg) {
      this.source = source;
      this._fn = bindCallback(fn, thisArg, 0);
      __super__.call(this);
    }
    FinallyObservable.prototype.subscribeCore = function(o) {
      var d = tryCatch(this.source.subscribe).call(this.source, o);
      if (d === errorObj) {
        this._fn();
        thrower(d.e);
      }
      return new FinallyDisposable(d, this._fn);
    };
    function FinallyDisposable(s, fn) {
      this.isDisposed = false;
      this._s = s;
      this._fn = fn;
    }
    FinallyDisposable.prototype.dispose = function() {
      if (!this.isDisposed) {
        var res = tryCatch(this._s.dispose).call(this._s);
        this._fn();
        res === errorObj && thrower(res.e);
      }
    };
    return FinallyObservable;
  }(ObservableBase));
  observableProto['finally'] = function(action, thisArg) {
    return new FinallyObservable(this, action, thisArg);
  };
  var IgnoreElementsObservable = (function(__super__) {
    inherits(IgnoreElementsObservable, __super__);
    function IgnoreElementsObservable(source) {
      this.source = source;
      __super__.call(this);
    }
    IgnoreElementsObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new InnerObserver(o));
    };
    function InnerObserver(o) {
      this.o = o;
      this.isStopped = false;
    }
    InnerObserver.prototype.onNext = noop;
    InnerObserver.prototype.onError = function(err) {
      if (!this.isStopped) {
        this.isStopped = true;
        this.o.onError(err);
      }
    };
    InnerObserver.prototype.onCompleted = function() {
      if (!this.isStopped) {
        this.isStopped = true;
        this.o.onCompleted();
      }
    };
    InnerObserver.prototype.dispose = function() {
      this.isStopped = true;
    };
    InnerObserver.prototype.fail = function(e) {
      if (!this.isStopped) {
        this.isStopped = true;
        this.observer.onError(e);
        return true;
      }
      return false;
    };
    return IgnoreElementsObservable;
  }(ObservableBase));
  observableProto.ignoreElements = function() {
    return new IgnoreElementsObservable(this);
  };
  var MaterializeObservable = (function(__super__) {
    inherits(MaterializeObservable, __super__);
    function MaterializeObservable(source, fn) {
      this.source = source;
      __super__.call(this);
    }
    MaterializeObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new MaterializeObserver(o));
    };
    return MaterializeObservable;
  }(ObservableBase));
  var MaterializeObserver = (function(__super__) {
    inherits(MaterializeObserver, __super__);
    function MaterializeObserver(o) {
      this._o = o;
      __super__.call(this);
    }
    MaterializeObserver.prototype.next = function(x) {
      this._o.onNext(notificationCreateOnNext(x));
    };
    MaterializeObserver.prototype.error = function(e) {
      this._o.onNext(notificationCreateOnError(e));
      this._o.onCompleted();
    };
    MaterializeObserver.prototype.completed = function() {
      this._o.onNext(notificationCreateOnCompleted());
      this._o.onCompleted();
    };
    return MaterializeObserver;
  }(AbstractObserver));
  observableProto.materialize = function() {
    return new MaterializeObservable(this);
  };
  observableProto.repeat = function(repeatCount) {
    return enumerableRepeat(this, repeatCount).concat();
  };
  observableProto.retry = function(retryCount) {
    return enumerableRepeat(this, retryCount).catchError();
  };
  observableProto.retryWhen = function(notifier) {
    return enumerableRepeat(this).catchErrorWhen(notifier);
  };
  var ScanObservable = (function(__super__) {
    inherits(ScanObservable, __super__);
    function ScanObservable(source, accumulator, hasSeed, seed) {
      this.source = source;
      this.accumulator = accumulator;
      this.hasSeed = hasSeed;
      this.seed = seed;
      __super__.call(this);
    }
    ScanObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new ScanObserver(o, this));
    };
    return ScanObservable;
  }(ObservableBase));
  var ScanObserver = (function(__super__) {
    inherits(ScanObserver, __super__);
    function ScanObserver(o, parent) {
      this._o = o;
      this._p = parent;
      this._fn = parent.accumulator;
      this._hs = parent.hasSeed;
      this._s = parent.seed;
      this._ha = false;
      this._a = null;
      this._hv = false;
      this._i = 0;
      __super__.call(this);
    }
    ScanObserver.prototype.next = function(x) {
      !this._hv && (this._hv = true);
      if (this._ha) {
        this._a = tryCatch(this._fn)(this._a, x, this._i, this._p);
      } else {
        this._a = this._hs ? tryCatch(this._fn)(this._s, x, this._i, this._p) : x;
        this._ha = true;
      }
      if (this._a === errorObj) {
        return this._o.onError(this._a.e);
      }
      this._o.onNext(this._a);
      this._i++;
    };
    ScanObserver.prototype.error = function(e) {
      this._o.onError(e);
    };
    ScanObserver.prototype.completed = function() {
      !this._hv && this._hs && this._o.onNext(this._s);
      this._o.onCompleted();
    };
    return ScanObserver;
  }(AbstractObserver));
  observableProto.scan = function() {
    var hasSeed = false,
        seed,
        accumulator = arguments[0];
    if (arguments.length === 2) {
      hasSeed = true;
      seed = arguments[1];
    }
    return new ScanObservable(this, accumulator, hasSeed, seed);
  };
  var SkipLastObservable = (function(__super__) {
    inherits(SkipLastObservable, __super__);
    function SkipLastObservable(source, c) {
      this.source = source;
      this._c = c;
      __super__.call(this);
    }
    SkipLastObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new SkipLastObserver(o, this._c));
    };
    return SkipLastObservable;
  }(ObservableBase));
  var SkipLastObserver = (function(__super__) {
    inherits(SkipLastObserver, __super__);
    function SkipLastObserver(o, c) {
      this._o = o;
      this._c = c;
      this._q = [];
      __super__.call(this);
    }
    SkipLastObserver.prototype.next = function(x) {
      this._q.push(x);
      this._q.length > this._c && this._o.onNext(this._q.shift());
    };
    SkipLastObserver.prototype.error = function(e) {
      this._o.onError(e);
    };
    SkipLastObserver.prototype.completed = function() {
      this._o.onCompleted();
    };
    return SkipLastObserver;
  }(AbstractObserver));
  observableProto.skipLast = function(count) {
    if (count < 0) {
      throw new ArgumentOutOfRangeError();
    }
    return new SkipLastObservable(this, count);
  };
  observableProto.startWith = function() {
    var values,
        scheduler,
        start = 0;
    if (!!arguments.length && isScheduler(arguments[0])) {
      scheduler = arguments[0];
      start = 1;
    } else {
      scheduler = immediateScheduler;
    }
    for (var args = [],
        i = start,
        len = arguments.length; i < len; i++) {
      args.push(arguments[i]);
    }
    return enumerableOf([observableFromArray(args, scheduler), this]).concat();
  };
  var TakeLastObserver = (function(__super__) {
    inherits(TakeLastObserver, __super__);
    function TakeLastObserver(o, c) {
      this._o = o;
      this._c = c;
      this._q = [];
      __super__.call(this);
    }
    TakeLastObserver.prototype.next = function(x) {
      this._q.push(x);
      this._q.length > this._c && this._q.shift();
    };
    TakeLastObserver.prototype.error = function(e) {
      this._o.onError(e);
    };
    TakeLastObserver.prototype.completed = function() {
      while (this._q.length > 0) {
        this._o.onNext(this._q.shift());
      }
      this._o.onCompleted();
    };
    return TakeLastObserver;
  }(AbstractObserver));
  observableProto.takeLast = function(count) {
    if (count < 0) {
      throw new ArgumentOutOfRangeError();
    }
    var source = this;
    return new AnonymousObservable(function(o) {
      return source.subscribe(new TakeLastObserver(o, count));
    }, source);
  };
  observableProto.flatMapConcat = observableProto.concatMap = function(selector, resultSelector, thisArg) {
    return new FlatMapObservable(this, selector, resultSelector, thisArg).merge(1);
  };
  var MapObservable = (function(__super__) {
    inherits(MapObservable, __super__);
    function MapObservable(source, selector, thisArg) {
      this.source = source;
      this.selector = bindCallback(selector, thisArg, 3);
      __super__.call(this);
    }
    function innerMap(selector, self) {
      return function(x, i, o) {
        return selector.call(this, self.selector(x, i, o), i, o);
      };
    }
    MapObservable.prototype.internalMap = function(selector, thisArg) {
      return new MapObservable(this.source, innerMap(selector, this), thisArg);
    };
    MapObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new InnerObserver(o, this.selector, this));
    };
    inherits(InnerObserver, AbstractObserver);
    function InnerObserver(o, selector, source) {
      this.o = o;
      this.selector = selector;
      this.source = source;
      this.i = 0;
      AbstractObserver.call(this);
    }
    InnerObserver.prototype.next = function(x) {
      var result = tryCatch(this.selector)(x, this.i++, this.source);
      if (result === errorObj) {
        return this.o.onError(result.e);
      }
      this.o.onNext(result);
    };
    InnerObserver.prototype.error = function(e) {
      this.o.onError(e);
    };
    InnerObserver.prototype.completed = function() {
      this.o.onCompleted();
    };
    return MapObservable;
  }(ObservableBase));
  observableProto.map = observableProto.select = function(selector, thisArg) {
    var selectorFn = typeof selector === 'function' ? selector : function() {
      return selector;
    };
    return this instanceof MapObservable ? this.internalMap(selectorFn, thisArg) : new MapObservable(this, selectorFn, thisArg);
  };
  function plucker(args, len) {
    return function mapper(x) {
      var currentProp = x;
      for (var i = 0; i < len; i++) {
        var p = currentProp[args[i]];
        if (typeof p !== 'undefined') {
          currentProp = p;
        } else {
          return undefined;
        }
      }
      return currentProp;
    };
  }
  observableProto.pluck = function() {
    var len = arguments.length,
        args = new Array(len);
    if (len === 0) {
      throw new Error('List of properties cannot be empty.');
    }
    for (var i = 0; i < len; i++) {
      args[i] = arguments[i];
    }
    return this.map(plucker(args, len));
  };
  observableProto.flatMap = observableProto.selectMany = function(selector, resultSelector, thisArg) {
    return new FlatMapObservable(this, selector, resultSelector, thisArg).mergeAll();
  };
  Rx.Observable.prototype.flatMapLatest = function(selector, resultSelector, thisArg) {
    return new FlatMapObservable(this, selector, resultSelector, thisArg).switchLatest();
  };
  var SkipObservable = (function(__super__) {
    inherits(SkipObservable, __super__);
    function SkipObservable(source, count) {
      this.source = source;
      this._count = count;
      __super__.call(this);
    }
    SkipObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new SkipObserver(o, this._count));
    };
    function SkipObserver(o, c) {
      this._o = o;
      this._r = c;
      AbstractObserver.call(this);
    }
    inherits(SkipObserver, AbstractObserver);
    SkipObserver.prototype.next = function(x) {
      if (this._r <= 0) {
        this._o.onNext(x);
      } else {
        this._r--;
      }
    };
    SkipObserver.prototype.error = function(e) {
      this._o.onError(e);
    };
    SkipObserver.prototype.completed = function() {
      this._o.onCompleted();
    };
    return SkipObservable;
  }(ObservableBase));
  observableProto.skip = function(count) {
    if (count < 0) {
      throw new ArgumentOutOfRangeError();
    }
    return new SkipObservable(this, count);
  };
  var SkipWhileObservable = (function(__super__) {
    inherits(SkipWhileObservable, __super__);
    function SkipWhileObservable(source, fn) {
      this.source = source;
      this._fn = fn;
      __super__.call(this);
    }
    SkipWhileObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new SkipWhileObserver(o, this));
    };
    return SkipWhileObservable;
  }(ObservableBase));
  var SkipWhileObserver = (function(__super__) {
    inherits(SkipWhileObserver, __super__);
    function SkipWhileObserver(o, p) {
      this._o = o;
      this._p = p;
      this._i = 0;
      this._r = false;
      __super__.call(this);
    }
    SkipWhileObserver.prototype.next = function(x) {
      if (!this._r) {
        var res = tryCatch(this._p._fn)(x, this._i++, this._p);
        if (res === errorObj) {
          return this._o.onError(res.e);
        }
        this._r = !res;
      }
      this._r && this._o.onNext(x);
    };
    SkipWhileObserver.prototype.error = function(e) {
      this._o.onError(e);
    };
    SkipWhileObserver.prototype.completed = function() {
      this._o.onCompleted();
    };
    return SkipWhileObserver;
  }(AbstractObserver));
  observableProto.skipWhile = function(predicate, thisArg) {
    var fn = bindCallback(predicate, thisArg, 3);
    return new SkipWhileObservable(this, fn);
  };
  var TakeObservable = (function(__super__) {
    inherits(TakeObservable, __super__);
    function TakeObservable(source, count) {
      this.source = source;
      this._count = count;
      __super__.call(this);
    }
    TakeObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new TakeObserver(o, this._count));
    };
    function TakeObserver(o, c) {
      this._o = o;
      this._c = c;
      this._r = c;
      AbstractObserver.call(this);
    }
    inherits(TakeObserver, AbstractObserver);
    TakeObserver.prototype.next = function(x) {
      if (this._r-- > 0) {
        this._o.onNext(x);
        this._r <= 0 && this._o.onCompleted();
      }
    };
    TakeObserver.prototype.error = function(e) {
      this._o.onError(e);
    };
    TakeObserver.prototype.completed = function() {
      this._o.onCompleted();
    };
    return TakeObservable;
  }(ObservableBase));
  observableProto.take = function(count, scheduler) {
    if (count < 0) {
      throw new ArgumentOutOfRangeError();
    }
    if (count === 0) {
      return observableEmpty(scheduler);
    }
    return new TakeObservable(this, count);
  };
  var TakeWhileObservable = (function(__super__) {
    inherits(TakeWhileObservable, __super__);
    function TakeWhileObservable(source, fn) {
      this.source = source;
      this._fn = fn;
      __super__.call(this);
    }
    TakeWhileObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new TakeWhileObserver(o, this));
    };
    return TakeWhileObservable;
  }(ObservableBase));
  var TakeWhileObserver = (function(__super__) {
    inherits(TakeWhileObserver, __super__);
    function TakeWhileObserver(o, p) {
      this._o = o;
      this._p = p;
      this._i = 0;
      this._r = true;
      __super__.call(this);
    }
    TakeWhileObserver.prototype.next = function(x) {
      if (this._r) {
        this._r = tryCatch(this._p._fn)(x, this._i++, this._p);
        if (this._r === errorObj) {
          return this._o.onError(this._r.e);
        }
      }
      if (this._r) {
        this._o.onNext(x);
      } else {
        this._o.onCompleted();
      }
    };
    TakeWhileObserver.prototype.error = function(e) {
      this._o.onError(e);
    };
    TakeWhileObserver.prototype.completed = function() {
      this._o.onCompleted();
    };
    return TakeWhileObserver;
  }(AbstractObserver));
  observableProto.takeWhile = function(predicate, thisArg) {
    var fn = bindCallback(predicate, thisArg, 3);
    return new TakeWhileObservable(this, fn);
  };
  var FilterObservable = (function(__super__) {
    inherits(FilterObservable, __super__);
    function FilterObservable(source, predicate, thisArg) {
      this.source = source;
      this.predicate = bindCallback(predicate, thisArg, 3);
      __super__.call(this);
    }
    FilterObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new InnerObserver(o, this.predicate, this));
    };
    function innerPredicate(predicate, self) {
      return function(x, i, o) {
        return self.predicate(x, i, o) && predicate.call(this, x, i, o);
      };
    }
    FilterObservable.prototype.internalFilter = function(predicate, thisArg) {
      return new FilterObservable(this.source, innerPredicate(predicate, this), thisArg);
    };
    inherits(InnerObserver, AbstractObserver);
    function InnerObserver(o, predicate, source) {
      this.o = o;
      this.predicate = predicate;
      this.source = source;
      this.i = 0;
      AbstractObserver.call(this);
    }
    InnerObserver.prototype.next = function(x) {
      var shouldYield = tryCatch(this.predicate)(x, this.i++, this.source);
      if (shouldYield === errorObj) {
        return this.o.onError(shouldYield.e);
      }
      shouldYield && this.o.onNext(x);
    };
    InnerObserver.prototype.error = function(e) {
      this.o.onError(e);
    };
    InnerObserver.prototype.completed = function() {
      this.o.onCompleted();
    };
    return FilterObservable;
  }(ObservableBase));
  observableProto.filter = observableProto.where = function(predicate, thisArg) {
    return this instanceof FilterObservable ? this.internalFilter(predicate, thisArg) : new FilterObservable(this, predicate, thisArg);
  };
  function createCbObservable(fn, ctx, selector, args) {
    var o = new AsyncSubject();
    args.push(createCbHandler(o, ctx, selector));
    fn.apply(ctx, args);
    return o.asObservable();
  }
  function createCbHandler(o, ctx, selector) {
    return function handler() {
      var len = arguments.length,
          results = new Array(len);
      for (var i = 0; i < len; i++) {
        results[i] = arguments[i];
      }
      if (isFunction(selector)) {
        results = tryCatch(selector).apply(ctx, results);
        if (results === errorObj) {
          return o.onError(results.e);
        }
        o.onNext(results);
      } else {
        if (results.length <= 1) {
          o.onNext(results[0]);
        } else {
          o.onNext(results);
        }
      }
      o.onCompleted();
    };
  }
  Observable.fromCallback = function(fn, ctx, selector) {
    return function() {
      typeof ctx === 'undefined' && (ctx = this);
      var len = arguments.length,
          args = new Array(len);
      for (var i = 0; i < len; i++) {
        args[i] = arguments[i];
      }
      return createCbObservable(fn, ctx, selector, args);
    };
  };
  function createNodeObservable(fn, ctx, selector, args) {
    var o = new AsyncSubject();
    args.push(createNodeHandler(o, ctx, selector));
    fn.apply(ctx, args);
    return o.asObservable();
  }
  function createNodeHandler(o, ctx, selector) {
    return function handler() {
      var err = arguments[0];
      if (err) {
        return o.onError(err);
      }
      var len = arguments.length,
          results = [];
      for (var i = 1; i < len; i++) {
        results[i - 1] = arguments[i];
      }
      if (isFunction(selector)) {
        var results = tryCatch(selector).apply(ctx, results);
        if (results === errorObj) {
          return o.onError(results.e);
        }
        o.onNext(results);
      } else {
        if (results.length <= 1) {
          o.onNext(results[0]);
        } else {
          o.onNext(results);
        }
      }
      o.onCompleted();
    };
  }
  Observable.fromNodeCallback = function(fn, ctx, selector) {
    return function() {
      typeof ctx === 'undefined' && (ctx = this);
      var len = arguments.length,
          args = new Array(len);
      for (var i = 0; i < len; i++) {
        args[i] = arguments[i];
      }
      return createNodeObservable(fn, ctx, selector, args);
    };
  };
  function isNodeList(el) {
    if (root.StaticNodeList) {
      return el instanceof root.StaticNodeList || el instanceof root.NodeList;
    } else {
      return Object.prototype.toString.call(el) === '[object NodeList]';
    }
  }
  function ListenDisposable(e, n, fn) {
    this._e = e;
    this._n = n;
    this._fn = fn;
    this._e.addEventListener(this._n, this._fn, false);
    this.isDisposed = false;
  }
  ListenDisposable.prototype.dispose = function() {
    if (!this.isDisposed) {
      this._e.removeEventListener(this._n, this._fn, false);
      this.isDisposed = true;
    }
  };
  function createEventListener(el, eventName, handler) {
    var disposables = new CompositeDisposable();
    var elemToString = Object.prototype.toString.call(el);
    if (isNodeList(el) || elemToString === '[object HTMLCollection]') {
      for (var i = 0,
          len = el.length; i < len; i++) {
        disposables.add(createEventListener(el.item(i), eventName, handler));
      }
    } else if (el) {
      disposables.add(new ListenDisposable(el, eventName, handler));
    }
    return disposables;
  }
  Rx.config.useNativeEvents = false;
  var EventObservable = (function(__super__) {
    inherits(EventObservable, __super__);
    function EventObservable(el, name, fn) {
      this._el = el;
      this._n = name;
      this._fn = fn;
      __super__.call(this);
    }
    function createHandler(o, fn) {
      return function handler() {
        var results = arguments[0];
        if (isFunction(fn)) {
          results = tryCatch(fn).apply(null, arguments);
          if (results === errorObj) {
            return o.onError(results.e);
          }
        }
        o.onNext(results);
      };
    }
    EventObservable.prototype.subscribeCore = function(o) {
      return createEventListener(this._el, this._n, createHandler(o, this._fn));
    };
    return EventObservable;
  }(ObservableBase));
  Observable.fromEvent = function(element, eventName, selector) {
    if (element.addListener) {
      return fromEventPattern(function(h) {
        element.addListener(eventName, h);
      }, function(h) {
        element.removeListener(eventName, h);
      }, selector);
    }
    if (!Rx.config.useNativeEvents) {
      if (typeof element.on === 'function' && typeof element.off === 'function') {
        return fromEventPattern(function(h) {
          element.on(eventName, h);
        }, function(h) {
          element.off(eventName, h);
        }, selector);
      }
    }
    return new EventObservable(element, eventName, selector).publish().refCount();
  };
  var EventPatternObservable = (function(__super__) {
    inherits(EventPatternObservable, __super__);
    function EventPatternObservable(add, del, fn) {
      this._add = add;
      this._del = del;
      this._fn = fn;
      __super__.call(this);
    }
    function createHandler(o, fn) {
      return function handler() {
        var results = arguments[0];
        if (isFunction(fn)) {
          results = tryCatch(fn).apply(null, arguments);
          if (results === errorObj) {
            return o.onError(results.e);
          }
        }
        o.onNext(results);
      };
    }
    EventPatternObservable.prototype.subscribeCore = function(o) {
      var fn = createHandler(o, this._fn);
      var returnValue = this._add(fn);
      return new EventPatternDisposable(this._del, fn, returnValue);
    };
    function EventPatternDisposable(del, fn, ret) {
      this._del = del;
      this._fn = fn;
      this._ret = ret;
      this.isDisposed = false;
    }
    EventPatternDisposable.prototype.dispose = function() {
      if (!this.isDisposed) {
        isFunction(this._del) && this._del(this._fn, this._ret);
      }
    };
    return EventPatternObservable;
  }(ObservableBase));
  var fromEventPattern = Observable.fromEventPattern = function(addHandler, removeHandler, selector) {
    return new EventPatternObservable(addHandler, removeHandler, selector).publish().refCount();
  };
  var FromPromiseObservable = (function(__super__) {
    inherits(FromPromiseObservable, __super__);
    function FromPromiseObservable(p, s) {
      this._p = p;
      this._s = s;
      __super__.call(this);
    }
    function scheduleNext(s, state) {
      var o = state[0],
          data = state[1];
      o.onNext(data);
      o.onCompleted();
    }
    function scheduleError(s, state) {
      var o = state[0],
          err = state[1];
      o.onError(err);
    }
    FromPromiseObservable.prototype.subscribeCore = function(o) {
      var sad = new SingleAssignmentDisposable(),
          self = this;
      this._p.then(function(data) {
        sad.setDisposable(self._s.schedule([o, data], scheduleNext));
      }, function(err) {
        sad.setDisposable(self._s.schedule([o, err], scheduleError));
      });
      return sad;
    };
    return FromPromiseObservable;
  }(ObservableBase));
  var observableFromPromise = Observable.fromPromise = function(promise, scheduler) {
    scheduler || (scheduler = defaultScheduler);
    return new FromPromiseObservable(promise, scheduler);
  };
  observableProto.toPromise = function(promiseCtor) {
    promiseCtor || (promiseCtor = Rx.config.Promise);
    if (!promiseCtor) {
      throw new NotSupportedError('Promise type not provided nor in Rx.config.Promise');
    }
    var source = this;
    return new promiseCtor(function(resolve, reject) {
      var value;
      source.subscribe(function(v) {
        value = v;
      }, reject, function() {
        resolve(value);
      });
    });
  };
  Observable.startAsync = function(functionAsync) {
    var promise = tryCatch(functionAsync)();
    if (promise === errorObj) {
      return observableThrow(promise.e);
    }
    return observableFromPromise(promise);
  };
  var MulticastObservable = (function(__super__) {
    inherits(MulticastObservable, __super__);
    function MulticastObservable(source, fn1, fn2) {
      this.source = source;
      this._fn1 = fn1;
      this._fn2 = fn2;
      __super__.call(this);
    }
    MulticastObservable.prototype.subscribeCore = function(o) {
      var connectable = this.source.multicast(this._fn1());
      return new BinaryDisposable(this._fn2(connectable).subscribe(o), connectable.connect());
    };
    return MulticastObservable;
  }(ObservableBase));
  observableProto.multicast = function(subjectOrSubjectSelector, selector) {
    return isFunction(subjectOrSubjectSelector) ? new MulticastObservable(this, subjectOrSubjectSelector, selector) : new ConnectableObservable(this, subjectOrSubjectSelector);
  };
  observableProto.publish = function(selector) {
    return selector && isFunction(selector) ? this.multicast(function() {
      return new Subject();
    }, selector) : this.multicast(new Subject());
  };
  observableProto.share = function() {
    return this.publish().refCount();
  };
  observableProto.publishLast = function(selector) {
    return selector && isFunction(selector) ? this.multicast(function() {
      return new AsyncSubject();
    }, selector) : this.multicast(new AsyncSubject());
  };
  observableProto.publishValue = function(initialValueOrSelector, initialValue) {
    return arguments.length === 2 ? this.multicast(function() {
      return new BehaviorSubject(initialValue);
    }, initialValueOrSelector) : this.multicast(new BehaviorSubject(initialValueOrSelector));
  };
  observableProto.shareValue = function(initialValue) {
    return this.publishValue(initialValue).refCount();
  };
  observableProto.replay = function(selector, bufferSize, windowSize, scheduler) {
    return selector && isFunction(selector) ? this.multicast(function() {
      return new ReplaySubject(bufferSize, windowSize, scheduler);
    }, selector) : this.multicast(new ReplaySubject(bufferSize, windowSize, scheduler));
  };
  observableProto.shareReplay = function(bufferSize, windowSize, scheduler) {
    return this.replay(null, bufferSize, windowSize, scheduler).refCount();
  };
  var RefCountObservable = (function(__super__) {
    inherits(RefCountObservable, __super__);
    function RefCountObservable(source) {
      this.source = source;
      this._count = 0;
      this._connectableSubscription = null;
      __super__.call(this);
    }
    RefCountObservable.prototype.subscribeCore = function(o) {
      var subscription = this.source.subscribe(o);
      ++this._count === 1 && (this._connectableSubscription = this.source.connect());
      return new RefCountDisposable(this, subscription);
    };
    function RefCountDisposable(p, s) {
      this._p = p;
      this._s = s;
      this.isDisposed = false;
    }
    RefCountDisposable.prototype.dispose = function() {
      if (!this.isDisposed) {
        this.isDisposed = true;
        this._s.dispose();
        --this._p._count === 0 && this._p._connectableSubscription.dispose();
      }
    };
    return RefCountObservable;
  }(ObservableBase));
  var ConnectableObservable = Rx.ConnectableObservable = (function(__super__) {
    inherits(ConnectableObservable, __super__);
    function ConnectableObservable(source, subject) {
      this.source = source;
      this._connection = null;
      this._source = source.asObservable();
      this._subject = subject;
      __super__.call(this);
    }
    function ConnectDisposable(parent, subscription) {
      this._p = parent;
      this._s = subscription;
    }
    ConnectDisposable.prototype.dispose = function() {
      if (this._s) {
        this._s.dispose();
        this._s = null;
        this._p._connection = null;
      }
    };
    ConnectableObservable.prototype.connect = function() {
      if (!this._connection) {
        var subscription = this._source.subscribe(this._subject);
        this._connection = new ConnectDisposable(this, subscription);
      }
      return this._connection;
    };
    ConnectableObservable.prototype._subscribe = function(o) {
      return this._subject.subscribe(o);
    };
    ConnectableObservable.prototype.refCount = function() {
      return new RefCountObservable(this);
    };
    return ConnectableObservable;
  }(Observable));
  var TimerObservable = (function(__super__) {
    inherits(TimerObservable, __super__);
    function TimerObservable(dt, s) {
      this._dt = dt;
      this._s = s;
      __super__.call(this);
    }
    TimerObservable.prototype.subscribeCore = function(o) {
      return this._s.scheduleFuture(o, this._dt, scheduleMethod);
    };
    function scheduleMethod(s, o) {
      o.onNext(0);
      o.onCompleted();
    }
    return TimerObservable;
  }(ObservableBase));
  function _observableTimer(dueTime, scheduler) {
    return new TimerObservable(dueTime, scheduler);
  }
  function observableTimerDateAndPeriod(dueTime, period, scheduler) {
    return new AnonymousObservable(function(observer) {
      var d = dueTime,
          p = normalizeTime(period);
      return scheduler.scheduleRecursiveFuture(0, d, function(count, self) {
        if (p > 0) {
          var now = scheduler.now();
          d = new Date(d.getTime() + p);
          d.getTime() <= now && (d = new Date(now + p));
        }
        observer.onNext(count);
        self(count + 1, new Date(d));
      });
    });
  }
  function observableTimerTimeSpanAndPeriod(dueTime, period, scheduler) {
    return dueTime === period ? new AnonymousObservable(function(observer) {
      return scheduler.schedulePeriodic(0, period, function(count) {
        observer.onNext(count);
        return count + 1;
      });
    }) : observableDefer(function() {
      return observableTimerDateAndPeriod(new Date(scheduler.now() + dueTime), period, scheduler);
    });
  }
  var observableinterval = Observable.interval = function(period, scheduler) {
    return observableTimerTimeSpanAndPeriod(period, period, isScheduler(scheduler) ? scheduler : defaultScheduler);
  };
  var observableTimer = Observable.timer = function(dueTime, periodOrScheduler, scheduler) {
    var period;
    isScheduler(scheduler) || (scheduler = defaultScheduler);
    if (periodOrScheduler != null && typeof periodOrScheduler === 'number') {
      period = periodOrScheduler;
    } else if (isScheduler(periodOrScheduler)) {
      scheduler = periodOrScheduler;
    }
    if ((dueTime instanceof Date || typeof dueTime === 'number') && period === undefined) {
      return _observableTimer(dueTime, scheduler);
    }
    if (dueTime instanceof Date && period !== undefined) {
      return observableTimerDateAndPeriod(dueTime.getTime(), periodOrScheduler, scheduler);
    }
    return observableTimerTimeSpanAndPeriod(dueTime, period, scheduler);
  };
  function observableDelayRelative(source, dueTime, scheduler) {
    return new AnonymousObservable(function(o) {
      var active = false,
          cancelable = new SerialDisposable(),
          exception = null,
          q = [],
          running = false,
          subscription;
      subscription = source.materialize().timestamp(scheduler).subscribe(function(notification) {
        var d,
            shouldRun;
        if (notification.value.kind === 'E') {
          q = [];
          q.push(notification);
          exception = notification.value.error;
          shouldRun = !running;
        } else {
          q.push({
            value: notification.value,
            timestamp: notification.timestamp + dueTime
          });
          shouldRun = !active;
          active = true;
        }
        if (shouldRun) {
          if (exception !== null) {
            o.onError(exception);
          } else {
            d = new SingleAssignmentDisposable();
            cancelable.setDisposable(d);
            d.setDisposable(scheduler.scheduleRecursiveFuture(null, dueTime, function(_, self) {
              var e,
                  recurseDueTime,
                  result,
                  shouldRecurse;
              if (exception !== null) {
                return;
              }
              running = true;
              do {
                result = null;
                if (q.length > 0 && q[0].timestamp - scheduler.now() <= 0) {
                  result = q.shift().value;
                }
                if (result !== null) {
                  result.accept(o);
                }
              } while (result !== null);
              shouldRecurse = false;
              recurseDueTime = 0;
              if (q.length > 0) {
                shouldRecurse = true;
                recurseDueTime = Math.max(0, q[0].timestamp - scheduler.now());
              } else {
                active = false;
              }
              e = exception;
              running = false;
              if (e !== null) {
                o.onError(e);
              } else if (shouldRecurse) {
                self(null, recurseDueTime);
              }
            }));
          }
        }
      });
      return new BinaryDisposable(subscription, cancelable);
    }, source);
  }
  function observableDelayAbsolute(source, dueTime, scheduler) {
    return observableDefer(function() {
      return observableDelayRelative(source, dueTime - scheduler.now(), scheduler);
    });
  }
  function delayWithSelector(source, subscriptionDelay, delayDurationSelector) {
    var subDelay,
        selector;
    if (isFunction(subscriptionDelay)) {
      selector = subscriptionDelay;
    } else {
      subDelay = subscriptionDelay;
      selector = delayDurationSelector;
    }
    return new AnonymousObservable(function(o) {
      var delays = new CompositeDisposable(),
          atEnd = false,
          subscription = new SerialDisposable();
      function start() {
        subscription.setDisposable(source.subscribe(function(x) {
          var delay = tryCatch(selector)(x);
          if (delay === errorObj) {
            return o.onError(delay.e);
          }
          var d = new SingleAssignmentDisposable();
          delays.add(d);
          d.setDisposable(delay.subscribe(function() {
            o.onNext(x);
            delays.remove(d);
            done();
          }, function(e) {
            o.onError(e);
          }, function() {
            o.onNext(x);
            delays.remove(d);
            done();
          }));
        }, function(e) {
          o.onError(e);
        }, function() {
          atEnd = true;
          subscription.dispose();
          done();
        }));
      }
      function done() {
        atEnd && delays.length === 0 && o.onCompleted();
      }
      if (!subDelay) {
        start();
      } else {
        subscription.setDisposable(subDelay.subscribe(start, function(e) {
          o.onError(e);
        }, start));
      }
      return new BinaryDisposable(subscription, delays);
    }, this);
  }
  observableProto.delay = function() {
    var firstArg = arguments[0];
    if (typeof firstArg === 'number' || firstArg instanceof Date) {
      var dueTime = firstArg,
          scheduler = arguments[1];
      isScheduler(scheduler) || (scheduler = defaultScheduler);
      return dueTime instanceof Date ? observableDelayAbsolute(this, dueTime, scheduler) : observableDelayRelative(this, dueTime, scheduler);
    } else if (Observable.isObservable(firstArg) || isFunction(firstArg)) {
      return delayWithSelector(this, firstArg, arguments[1]);
    } else {
      throw new Error('Invalid arguments');
    }
  };
  var DebounceObservable = (function(__super__) {
    inherits(DebounceObservable, __super__);
    function DebounceObservable(source, dt, s) {
      isScheduler(s) || (s = defaultScheduler);
      this.source = source;
      this._dt = dt;
      this._s = s;
      __super__.call(this);
    }
    DebounceObservable.prototype.subscribeCore = function(o) {
      var cancelable = new SerialDisposable();
      return new BinaryDisposable(this.source.subscribe(new DebounceObserver(o, this.source, this._dt, this._s, cancelable)), cancelable);
    };
    return DebounceObservable;
  }(ObservableBase));
  var DebounceObserver = (function(__super__) {
    inherits(DebounceObserver, __super__);
    function DebounceObserver(observer, source, dueTime, scheduler, cancelable) {
      this._o = observer;
      this._s = source;
      this._d = dueTime;
      this._scheduler = scheduler;
      this._c = cancelable;
      this._v = null;
      this._hv = false;
      this._id = 0;
      __super__.call(this);
    }
    DebounceObserver.prototype.next = function(x) {
      this._hv = true;
      this._v = x;
      var currentId = ++this._id,
          d = new SingleAssignmentDisposable();
      this._c.setDisposable(d);
      d.setDisposable(this._scheduler.scheduleFuture(this, this._d, function(_, self) {
        self._hv && self._id === currentId && self._o.onNext(x);
        self._hv = false;
      }));
    };
    DebounceObserver.prototype.error = function(e) {
      this._c.dispose();
      this._o.onError(e);
      this._hv = false;
      this._id++;
    };
    DebounceObserver.prototype.completed = function() {
      this._c.dispose();
      this._hv && this._o.onNext(this._v);
      this._o.onCompleted();
      this._hv = false;
      this._id++;
    };
    return DebounceObserver;
  }(AbstractObserver));
  function debounceWithSelector(source, durationSelector) {
    return new AnonymousObservable(function(o) {
      var value,
          hasValue = false,
          cancelable = new SerialDisposable(),
          id = 0;
      var subscription = source.subscribe(function(x) {
        var throttle = tryCatch(durationSelector)(x);
        if (throttle === errorObj) {
          return o.onError(throttle.e);
        }
        isPromise(throttle) && (throttle = observableFromPromise(throttle));
        hasValue = true;
        value = x;
        id++;
        var currentid = id,
            d = new SingleAssignmentDisposable();
        cancelable.setDisposable(d);
        d.setDisposable(throttle.subscribe(function() {
          hasValue && id === currentid && o.onNext(value);
          hasValue = false;
          d.dispose();
        }, function(e) {
          o.onError(e);
        }, function() {
          hasValue && id === currentid && o.onNext(value);
          hasValue = false;
          d.dispose();
        }));
      }, function(e) {
        cancelable.dispose();
        o.onError(e);
        hasValue = false;
        id++;
      }, function() {
        cancelable.dispose();
        hasValue && o.onNext(value);
        o.onCompleted();
        hasValue = false;
        id++;
      });
      return new BinaryDisposable(subscription, cancelable);
    }, source);
  }
  observableProto.debounce = function() {
    if (isFunction(arguments[0])) {
      return debounceWithSelector(this, arguments[0]);
    } else if (typeof arguments[0] === 'number') {
      return new DebounceObservable(this, arguments[0], arguments[1]);
    } else {
      throw new Error('Invalid arguments');
    }
  };
  var TimestampObservable = (function(__super__) {
    inherits(TimestampObservable, __super__);
    function TimestampObservable(source, s) {
      this.source = source;
      this._s = s;
      __super__.call(this);
    }
    TimestampObservable.prototype.subscribeCore = function(o) {
      return this.source.subscribe(new TimestampObserver(o, this._s));
    };
    return TimestampObservable;
  }(ObservableBase));
  var TimestampObserver = (function(__super__) {
    inherits(TimestampObserver, __super__);
    function TimestampObserver(o, s) {
      this._o = o;
      this._s = s;
      __super__.call(this);
    }
    TimestampObserver.prototype.next = function(x) {
      this._o.onNext({
        value: x,
        timestamp: this._s.now()
      });
    };
    TimestampObserver.prototype.error = function(e) {
      this._o.onError(e);
    };
    TimestampObserver.prototype.completed = function() {
      this._o.onCompleted();
    };
    return TimestampObserver;
  }(AbstractObserver));
  observableProto.timestamp = function(scheduler) {
    isScheduler(scheduler) || (scheduler = defaultScheduler);
    return new TimestampObservable(this, scheduler);
  };
  function sampleObservable(source, sampler) {
    return new AnonymousObservable(function(o) {
      var atEnd = false,
          value,
          hasValue = false;
      function sampleSubscribe() {
        if (hasValue) {
          hasValue = false;
          o.onNext(value);
        }
        atEnd && o.onCompleted();
      }
      var sourceSubscription = new SingleAssignmentDisposable();
      sourceSubscription.setDisposable(source.subscribe(function(newValue) {
        hasValue = true;
        value = newValue;
      }, function(e) {
        o.onError(e);
      }, function() {
        atEnd = true;
        sourceSubscription.dispose();
      }));
      return new BinaryDisposable(sourceSubscription, sampler.subscribe(sampleSubscribe, function(e) {
        o.onError(e);
      }, sampleSubscribe));
    }, source);
  }
  observableProto.sample = observableProto.throttleLatest = function(intervalOrSampler, scheduler) {
    isScheduler(scheduler) || (scheduler = defaultScheduler);
    return typeof intervalOrSampler === 'number' ? sampleObservable(this, observableinterval(intervalOrSampler, scheduler)) : sampleObservable(this, intervalOrSampler);
  };
  var TimeoutError = Rx.TimeoutError = function(message) {
    this.message = message || 'Timeout has occurred';
    this.name = 'TimeoutError';
    Error.call(this);
  };
  TimeoutError.prototype = Object.create(Error.prototype);
  function timeoutWithSelector(source, firstTimeout, timeoutDurationSelector, other) {
    if (isFunction(firstTimeout)) {
      other = timeoutDurationSelector;
      timeoutDurationSelector = firstTimeout;
      firstTimeout = observableNever();
    }
    Observable.isObservable(other) || (other = observableThrow(new TimeoutError()));
    return new AnonymousObservable(function(o) {
      var subscription = new SerialDisposable(),
          timer = new SerialDisposable(),
          original = new SingleAssignmentDisposable();
      subscription.setDisposable(original);
      var id = 0,
          switched = false;
      function setTimer(timeout) {
        var myId = id,
            d = new SingleAssignmentDisposable();
        function timerWins() {
          switched = (myId === id);
          return switched;
        }
        timer.setDisposable(d);
        d.setDisposable(timeout.subscribe(function() {
          timerWins() && subscription.setDisposable(other.subscribe(o));
          d.dispose();
        }, function(e) {
          timerWins() && o.onError(e);
        }, function() {
          timerWins() && subscription.setDisposable(other.subscribe(o));
        }));
      }
      ;
      setTimer(firstTimeout);
      function oWins() {
        var res = !switched;
        if (res) {
          id++;
        }
        return res;
      }
      original.setDisposable(source.subscribe(function(x) {
        if (oWins()) {
          o.onNext(x);
          var timeout = tryCatch(timeoutDurationSelector)(x);
          if (timeout === errorObj) {
            return o.onError(timeout.e);
          }
          setTimer(isPromise(timeout) ? observableFromPromise(timeout) : timeout);
        }
      }, function(e) {
        oWins() && o.onError(e);
      }, function() {
        oWins() && o.onCompleted();
      }));
      return new BinaryDisposable(subscription, timer);
    }, source);
  }
  function timeout(source, dueTime, other, scheduler) {
    if (isScheduler(other)) {
      scheduler = other;
      other = observableThrow(new TimeoutError());
    }
    if (other instanceof Error) {
      other = observableThrow(other);
    }
    isScheduler(scheduler) || (scheduler = defaultScheduler);
    Observable.isObservable(other) || (other = observableThrow(new TimeoutError()));
    return new AnonymousObservable(function(o) {
      var id = 0,
          original = new SingleAssignmentDisposable(),
          subscription = new SerialDisposable(),
          switched = false,
          timer = new SerialDisposable();
      subscription.setDisposable(original);
      function createTimer() {
        var myId = id;
        timer.setDisposable(scheduler.scheduleFuture(null, dueTime, function() {
          switched = id === myId;
          if (switched) {
            isPromise(other) && (other = observableFromPromise(other));
            subscription.setDisposable(other.subscribe(o));
          }
        }));
      }
      createTimer();
      original.setDisposable(source.subscribe(function(x) {
        if (!switched) {
          id++;
          o.onNext(x);
          createTimer();
        }
      }, function(e) {
        if (!switched) {
          id++;
          o.onError(e);
        }
      }, function() {
        if (!switched) {
          id++;
          o.onCompleted();
        }
      }));
      return new BinaryDisposable(subscription, timer);
    }, source);
  }
  observableProto.timeout = function() {
    var firstArg = arguments[0];
    if (firstArg instanceof Date || typeof firstArg === 'number') {
      return timeout(this, firstArg, arguments[1], arguments[2]);
    } else if (Observable.isObservable(firstArg) || isFunction(firstArg)) {
      return timeoutWithSelector(this, firstArg, arguments[1], arguments[2]);
    } else {
      throw new Error('Invalid arguments');
    }
  };
  observableProto.throttle = function(windowDuration, scheduler) {
    isScheduler(scheduler) || (scheduler = defaultScheduler);
    var duration = +windowDuration || 0;
    if (duration <= 0) {
      throw new RangeError('windowDuration cannot be less or equal zero.');
    }
    var source = this;
    return new AnonymousObservable(function(o) {
      var lastOnNext = 0;
      return source.subscribe(function(x) {
        var now = scheduler.now();
        if (lastOnNext === 0 || now - lastOnNext >= duration) {
          lastOnNext = now;
          o.onNext(x);
        }
      }, function(e) {
        o.onError(e);
      }, function() {
        o.onCompleted();
      });
    }, source);
  };
  var PausableObservable = (function(__super__) {
    inherits(PausableObservable, __super__);
    function PausableObservable(source, pauser) {
      this.source = source;
      this.controller = new Subject();
      if (pauser && pauser.subscribe) {
        this.pauser = this.controller.merge(pauser);
      } else {
        this.pauser = this.controller;
      }
      __super__.call(this);
    }
    PausableObservable.prototype._subscribe = function(o) {
      var conn = this.source.publish(),
          subscription = conn.subscribe(o),
          connection = disposableEmpty;
      var pausable = this.pauser.distinctUntilChanged().subscribe(function(b) {
        if (b) {
          connection = conn.connect();
        } else {
          connection.dispose();
          connection = disposableEmpty;
        }
      });
      return new NAryDisposable([subscription, connection, pausable]);
    };
    PausableObservable.prototype.pause = function() {
      this.controller.onNext(false);
    };
    PausableObservable.prototype.resume = function() {
      this.controller.onNext(true);
    };
    return PausableObservable;
  }(Observable));
  observableProto.pausable = function(pauser) {
    return new PausableObservable(this, pauser);
  };
  function combineLatestSource(source, subject, resultSelector) {
    return new AnonymousObservable(function(o) {
      var hasValue = [false, false],
          hasValueAll = false,
          isDone = false,
          values = new Array(2),
          err;
      function next(x, i) {
        values[i] = x;
        hasValue[i] = true;
        if (hasValueAll || (hasValueAll = hasValue.every(identity))) {
          if (err) {
            return o.onError(err);
          }
          var res = tryCatch(resultSelector).apply(null, values);
          if (res === errorObj) {
            return o.onError(res.e);
          }
          o.onNext(res);
        }
        isDone && values[1] && o.onCompleted();
      }
      return new BinaryDisposable(source.subscribe(function(x) {
        next(x, 0);
      }, function(e) {
        if (values[1]) {
          o.onError(e);
        } else {
          err = e;
        }
      }, function() {
        isDone = true;
        values[1] && o.onCompleted();
      }), subject.subscribe(function(x) {
        next(x, 1);
      }, function(e) {
        o.onError(e);
      }, function() {
        isDone = true;
        next(true, 1);
      }));
    }, source);
  }
  var PausableBufferedObservable = (function(__super__) {
    inherits(PausableBufferedObservable, __super__);
    function PausableBufferedObservable(source, pauser) {
      this.source = source;
      this.controller = new Subject();
      if (pauser && pauser.subscribe) {
        this.pauser = this.controller.merge(pauser);
      } else {
        this.pauser = this.controller;
      }
      __super__.call(this);
    }
    PausableBufferedObservable.prototype._subscribe = function(o) {
      var q = [],
          previousShouldFire;
      function drainQueue() {
        while (q.length > 0) {
          o.onNext(q.shift());
        }
      }
      var subscription = combineLatestSource(this.source, this.pauser.startWith(false).distinctUntilChanged(), function(data, shouldFire) {
        return {
          data: data,
          shouldFire: shouldFire
        };
      }).subscribe(function(results) {
        if (previousShouldFire !== undefined && results.shouldFire !== previousShouldFire) {
          previousShouldFire = results.shouldFire;
          if (results.shouldFire) {
            drainQueue();
          }
        } else {
          previousShouldFire = results.shouldFire;
          if (results.shouldFire) {
            o.onNext(results.data);
          } else {
            q.push(results.data);
          }
        }
      }, function(err) {
        drainQueue();
        o.onError(err);
      }, function() {
        drainQueue();
        o.onCompleted();
      });
      return subscription;
    };
    PausableBufferedObservable.prototype.pause = function() {
      this.controller.onNext(false);
    };
    PausableBufferedObservable.prototype.resume = function() {
      this.controller.onNext(true);
    };
    return PausableBufferedObservable;
  }(Observable));
  observableProto.pausableBuffered = function(pauser) {
    return new PausableBufferedObservable(this, pauser);
  };
  var ControlledObservable = (function(__super__) {
    inherits(ControlledObservable, __super__);
    function ControlledObservable(source, enableQueue, scheduler) {
      __super__.call(this);
      this.subject = new ControlledSubject(enableQueue, scheduler);
      this.source = source.multicast(this.subject).refCount();
    }
    ControlledObservable.prototype._subscribe = function(o) {
      return this.source.subscribe(o);
    };
    ControlledObservable.prototype.request = function(numberOfItems) {
      return this.subject.request(numberOfItems == null ? -1 : numberOfItems);
    };
    return ControlledObservable;
  }(Observable));
  var ControlledSubject = (function(__super__) {
    inherits(ControlledSubject, __super__);
    function ControlledSubject(enableQueue, scheduler) {
      enableQueue == null && (enableQueue = true);
      __super__.call(this);
      this.subject = new Subject();
      this.enableQueue = enableQueue;
      this.queue = enableQueue ? [] : null;
      this.requestedCount = 0;
      this.requestedDisposable = null;
      this.error = null;
      this.hasFailed = false;
      this.hasCompleted = false;
      this.scheduler = scheduler || currentThreadScheduler;
    }
    addProperties(ControlledSubject.prototype, Observer, {
      _subscribe: function(o) {
        return this.subject.subscribe(o);
      },
      onCompleted: function() {
        this.hasCompleted = true;
        if (!this.enableQueue || this.queue.length === 0) {
          this.subject.onCompleted();
          this.disposeCurrentRequest();
        } else {
          this.queue.push(Notification.createOnCompleted());
        }
      },
      onError: function(error) {
        this.hasFailed = true;
        this.error = error;
        if (!this.enableQueue || this.queue.length === 0) {
          this.subject.onError(error);
          this.disposeCurrentRequest();
        } else {
          this.queue.push(Notification.createOnError(error));
        }
      },
      onNext: function(value) {
        if (this.requestedCount <= 0) {
          this.enableQueue && this.queue.push(Notification.createOnNext(value));
        } else {
          (this.requestedCount-- === 0) && this.disposeCurrentRequest();
          this.subject.onNext(value);
        }
      },
      _processRequest: function(numberOfItems) {
        if (this.enableQueue) {
          while (this.queue.length > 0 && (numberOfItems > 0 || this.queue[0].kind !== 'N')) {
            var first = this.queue.shift();
            first.accept(this.subject);
            if (first.kind === 'N') {
              numberOfItems--;
            } else {
              this.disposeCurrentRequest();
              this.queue = [];
            }
          }
        }
        return numberOfItems;
      },
      request: function(number) {
        this.disposeCurrentRequest();
        var self = this;
        this.requestedDisposable = this.scheduler.schedule(number, function(s, i) {
          var remaining = self._processRequest(i);
          var stopped = self.hasCompleted || self.hasFailed;
          if (!stopped && remaining > 0) {
            self.requestedCount = remaining;
            return disposableCreate(function() {
              self.requestedCount = 0;
            });
          }
        });
        return this.requestedDisposable;
      },
      disposeCurrentRequest: function() {
        if (this.requestedDisposable) {
          this.requestedDisposable.dispose();
          this.requestedDisposable = null;
        }
      }
    });
    return ControlledSubject;
  }(Observable));
  observableProto.controlled = function(enableQueue, scheduler) {
    if (enableQueue && isScheduler(enableQueue)) {
      scheduler = enableQueue;
      enableQueue = true;
    }
    if (enableQueue == null) {
      enableQueue = true;
    }
    return new ControlledObservable(this, enableQueue, scheduler);
  };
  observableProto.pipe = function(dest) {
    var source = this.pausableBuffered();
    function onDrain() {
      source.resume();
    }
    dest.addListener('drain', onDrain);
    source.subscribe(function(x) {
      !dest.write(String(x)) && source.pause();
    }, function(err) {
      dest.emit('error', err);
    }, function() {
      !dest._isStdio && dest.end();
      dest.removeListener('drain', onDrain);
    });
    source.resume();
    return dest;
  };
  var TransduceObserver = (function(__super__) {
    inherits(TransduceObserver, __super__);
    function TransduceObserver(o, xform) {
      this._o = o;
      this._xform = xform;
      __super__.call(this);
    }
    TransduceObserver.prototype.next = function(x) {
      var res = tryCatch(this._xform['@@transducer/step']).call(this._xform, this._o, x);
      if (res === errorObj) {
        this._o.onError(res.e);
      }
    };
    TransduceObserver.prototype.error = function(e) {
      this._o.onError(e);
    };
    TransduceObserver.prototype.completed = function() {
      this._xform['@@transducer/result'](this._o);
    };
    return TransduceObserver;
  }(AbstractObserver));
  function transformForObserver(o) {
    return {
      '@@transducer/init': function() {
        return o;
      },
      '@@transducer/step': function(obs, input) {
        return obs.onNext(input);
      },
      '@@transducer/result': function(obs) {
        return obs.onCompleted();
      }
    };
  }
  observableProto.transduce = function(transducer) {
    var source = this;
    return new AnonymousObservable(function(o) {
      var xform = transducer(transformForObserver(o));
      return source.subscribe(new TransduceObserver(o, xform));
    }, source);
  };
  var AnonymousObservable = Rx.AnonymousObservable = (function(__super__) {
    inherits(AnonymousObservable, __super__);
    function fixSubscriber(subscriber) {
      return subscriber && isFunction(subscriber.dispose) ? subscriber : isFunction(subscriber) ? disposableCreate(subscriber) : disposableEmpty;
    }
    function setDisposable(s, state) {
      var ado = state[0],
          self = state[1];
      var sub = tryCatch(self.__subscribe).call(self, ado);
      if (sub === errorObj && !ado.fail(errorObj.e)) {
        thrower(errorObj.e);
      }
      ado.setDisposable(fixSubscriber(sub));
    }
    function AnonymousObservable(subscribe, parent) {
      this.source = parent;
      this.__subscribe = subscribe;
      __super__.call(this);
    }
    AnonymousObservable.prototype._subscribe = function(o) {
      var ado = new AutoDetachObserver(o),
          state = [ado, this];
      if (currentThreadScheduler.scheduleRequired()) {
        currentThreadScheduler.schedule(state, setDisposable);
      } else {
        setDisposable(null, state);
      }
      return ado;
    };
    return AnonymousObservable;
  }(Observable));
  var AutoDetachObserver = (function(__super__) {
    inherits(AutoDetachObserver, __super__);
    function AutoDetachObserver(observer) {
      __super__.call(this);
      this.observer = observer;
      this.m = new SingleAssignmentDisposable();
    }
    var AutoDetachObserverPrototype = AutoDetachObserver.prototype;
    AutoDetachObserverPrototype.next = function(value) {
      var result = tryCatch(this.observer.onNext).call(this.observer, value);
      if (result === errorObj) {
        this.dispose();
        thrower(result.e);
      }
    };
    AutoDetachObserverPrototype.error = function(err) {
      var result = tryCatch(this.observer.onError).call(this.observer, err);
      this.dispose();
      result === errorObj && thrower(result.e);
    };
    AutoDetachObserverPrototype.completed = function() {
      var result = tryCatch(this.observer.onCompleted).call(this.observer);
      this.dispose();
      result === errorObj && thrower(result.e);
    };
    AutoDetachObserverPrototype.setDisposable = function(value) {
      this.m.setDisposable(value);
    };
    AutoDetachObserverPrototype.getDisposable = function() {
      return this.m.getDisposable();
    };
    AutoDetachObserverPrototype.dispose = function() {
      __super__.prototype.dispose.call(this);
      this.m.dispose();
    };
    return AutoDetachObserver;
  }(AbstractObserver));
  var InnerSubscription = function(s, o) {
    this._s = s;
    this._o = o;
  };
  InnerSubscription.prototype.dispose = function() {
    if (!this._s.isDisposed && this._o !== null) {
      var idx = this._s.observers.indexOf(this._o);
      this._s.observers.splice(idx, 1);
      this._o = null;
    }
  };
  var Subject = Rx.Subject = (function(__super__) {
    inherits(Subject, __super__);
    function Subject() {
      __super__.call(this);
      this.isDisposed = false;
      this.isStopped = false;
      this.observers = [];
      this.hasError = false;
    }
    addProperties(Subject.prototype, Observer.prototype, {
      _subscribe: function(o) {
        checkDisposed(this);
        if (!this.isStopped) {
          this.observers.push(o);
          return new InnerSubscription(this, o);
        }
        if (this.hasError) {
          o.onError(this.error);
          return disposableEmpty;
        }
        o.onCompleted();
        return disposableEmpty;
      },
      hasObservers: function() {
        return this.observers.length > 0;
      },
      onCompleted: function() {
        checkDisposed(this);
        if (!this.isStopped) {
          this.isStopped = true;
          for (var i = 0,
              os = cloneArray(this.observers),
              len = os.length; i < len; i++) {
            os[i].onCompleted();
          }
          this.observers.length = 0;
        }
      },
      onError: function(error) {
        checkDisposed(this);
        if (!this.isStopped) {
          this.isStopped = true;
          this.error = error;
          this.hasError = true;
          for (var i = 0,
              os = cloneArray(this.observers),
              len = os.length; i < len; i++) {
            os[i].onError(error);
          }
          this.observers.length = 0;
        }
      },
      onNext: function(value) {
        checkDisposed(this);
        if (!this.isStopped) {
          for (var i = 0,
              os = cloneArray(this.observers),
              len = os.length; i < len; i++) {
            os[i].onNext(value);
          }
        }
      },
      dispose: function() {
        this.isDisposed = true;
        this.observers = null;
      }
    });
    Subject.create = function(observer, observable) {
      return new AnonymousSubject(observer, observable);
    };
    return Subject;
  }(Observable));
  var AsyncSubject = Rx.AsyncSubject = (function(__super__) {
    inherits(AsyncSubject, __super__);
    function AsyncSubject() {
      __super__.call(this);
      this.isDisposed = false;
      this.isStopped = false;
      this.hasValue = false;
      this.observers = [];
      this.hasError = false;
    }
    addProperties(AsyncSubject.prototype, Observer.prototype, {
      _subscribe: function(o) {
        checkDisposed(this);
        if (!this.isStopped) {
          this.observers.push(o);
          return new InnerSubscription(this, o);
        }
        if (this.hasError) {
          o.onError(this.error);
        } else if (this.hasValue) {
          o.onNext(this.value);
          o.onCompleted();
        } else {
          o.onCompleted();
        }
        return disposableEmpty;
      },
      hasObservers: function() {
        checkDisposed(this);
        return this.observers.length > 0;
      },
      onCompleted: function() {
        var i,
            len;
        checkDisposed(this);
        if (!this.isStopped) {
          this.isStopped = true;
          var os = cloneArray(this.observers),
              len = os.length;
          if (this.hasValue) {
            for (i = 0; i < len; i++) {
              var o = os[i];
              o.onNext(this.value);
              o.onCompleted();
            }
          } else {
            for (i = 0; i < len; i++) {
              os[i].onCompleted();
            }
          }
          this.observers.length = 0;
        }
      },
      onError: function(error) {
        checkDisposed(this);
        if (!this.isStopped) {
          this.isStopped = true;
          this.hasError = true;
          this.error = error;
          for (var i = 0,
              os = cloneArray(this.observers),
              len = os.length; i < len; i++) {
            os[i].onError(error);
          }
          this.observers.length = 0;
        }
      },
      onNext: function(value) {
        checkDisposed(this);
        if (this.isStopped) {
          return;
        }
        this.value = value;
        this.hasValue = true;
      },
      dispose: function() {
        this.isDisposed = true;
        this.observers = null;
        this.error = null;
        this.value = null;
      }
    });
    return AsyncSubject;
  }(Observable));
  var AnonymousSubject = Rx.AnonymousSubject = (function(__super__) {
    inherits(AnonymousSubject, __super__);
    function AnonymousSubject(observer, observable) {
      this.observer = observer;
      this.observable = observable;
      __super__.call(this);
    }
    addProperties(AnonymousSubject.prototype, Observer.prototype, {
      _subscribe: function(o) {
        return this.observable.subscribe(o);
      },
      onCompleted: function() {
        this.observer.onCompleted();
      },
      onError: function(error) {
        this.observer.onError(error);
      },
      onNext: function(value) {
        this.observer.onNext(value);
      }
    });
    return AnonymousSubject;
  }(Observable));
  var BehaviorSubject = Rx.BehaviorSubject = (function(__super__) {
    inherits(BehaviorSubject, __super__);
    function BehaviorSubject(value) {
      __super__.call(this);
      this.value = value;
      this.observers = [];
      this.isDisposed = false;
      this.isStopped = false;
      this.hasError = false;
    }
    addProperties(BehaviorSubject.prototype, Observer.prototype, {
      _subscribe: function(o) {
        checkDisposed(this);
        if (!this.isStopped) {
          this.observers.push(o);
          o.onNext(this.value);
          return new InnerSubscription(this, o);
        }
        if (this.hasError) {
          o.onError(this.error);
        } else {
          o.onCompleted();
        }
        return disposableEmpty;
      },
      getValue: function() {
        checkDisposed(this);
        if (this.hasError) {
          thrower(this.error);
        }
        return this.value;
      },
      hasObservers: function() {
        return this.observers.length > 0;
      },
      onCompleted: function() {
        checkDisposed(this);
        if (this.isStopped) {
          return;
        }
        this.isStopped = true;
        for (var i = 0,
            os = cloneArray(this.observers),
            len = os.length; i < len; i++) {
          os[i].onCompleted();
        }
        this.observers.length = 0;
      },
      onError: function(error) {
        checkDisposed(this);
        if (this.isStopped) {
          return;
        }
        this.isStopped = true;
        this.hasError = true;
        this.error = error;
        for (var i = 0,
            os = cloneArray(this.observers),
            len = os.length; i < len; i++) {
          os[i].onError(error);
        }
        this.observers.length = 0;
      },
      onNext: function(value) {
        checkDisposed(this);
        if (this.isStopped) {
          return;
        }
        this.value = value;
        for (var i = 0,
            os = cloneArray(this.observers),
            len = os.length; i < len; i++) {
          os[i].onNext(value);
        }
      },
      dispose: function() {
        this.isDisposed = true;
        this.observers = null;
        this.value = null;
        this.error = null;
      }
    });
    return BehaviorSubject;
  }(Observable));
  var ReplaySubject = Rx.ReplaySubject = (function(__super__) {
    var maxSafeInteger = Math.pow(2, 53) - 1;
    function createRemovableDisposable(subject, observer) {
      return disposableCreate(function() {
        observer.dispose();
        !subject.isDisposed && subject.observers.splice(subject.observers.indexOf(observer), 1);
      });
    }
    inherits(ReplaySubject, __super__);
    function ReplaySubject(bufferSize, windowSize, scheduler) {
      this.bufferSize = bufferSize == null ? maxSafeInteger : bufferSize;
      this.windowSize = windowSize == null ? maxSafeInteger : windowSize;
      this.scheduler = scheduler || currentThreadScheduler;
      this.q = [];
      this.observers = [];
      this.isStopped = false;
      this.isDisposed = false;
      this.hasError = false;
      this.error = null;
      __super__.call(this);
    }
    addProperties(ReplaySubject.prototype, Observer.prototype, {
      _subscribe: function(o) {
        checkDisposed(this);
        var so = new ScheduledObserver(this.scheduler, o),
            subscription = createRemovableDisposable(this, so);
        this._trim(this.scheduler.now());
        this.observers.push(so);
        for (var i = 0,
            len = this.q.length; i < len; i++) {
          so.onNext(this.q[i].value);
        }
        if (this.hasError) {
          so.onError(this.error);
        } else if (this.isStopped) {
          so.onCompleted();
        }
        so.ensureActive();
        return subscription;
      },
      hasObservers: function() {
        return this.observers.length > 0;
      },
      _trim: function(now) {
        while (this.q.length > this.bufferSize) {
          this.q.shift();
        }
        while (this.q.length > 0 && (now - this.q[0].interval) > this.windowSize) {
          this.q.shift();
        }
      },
      onNext: function(value) {
        checkDisposed(this);
        if (this.isStopped) {
          return;
        }
        var now = this.scheduler.now();
        this.q.push({
          interval: now,
          value: value
        });
        this._trim(now);
        for (var i = 0,
            os = cloneArray(this.observers),
            len = os.length; i < len; i++) {
          var observer = os[i];
          observer.onNext(value);
          observer.ensureActive();
        }
      },
      onError: function(error) {
        checkDisposed(this);
        if (this.isStopped) {
          return;
        }
        this.isStopped = true;
        this.error = error;
        this.hasError = true;
        var now = this.scheduler.now();
        this._trim(now);
        for (var i = 0,
            os = cloneArray(this.observers),
            len = os.length; i < len; i++) {
          var observer = os[i];
          observer.onError(error);
          observer.ensureActive();
        }
        this.observers.length = 0;
      },
      onCompleted: function() {
        checkDisposed(this);
        if (this.isStopped) {
          return;
        }
        this.isStopped = true;
        var now = this.scheduler.now();
        this._trim(now);
        for (var i = 0,
            os = cloneArray(this.observers),
            len = os.length; i < len; i++) {
          var observer = os[i];
          observer.onCompleted();
          observer.ensureActive();
        }
        this.observers.length = 0;
      },
      dispose: function() {
        this.isDisposed = true;
        this.observers = null;
      }
    });
    return ReplaySubject;
  }(Observable));
  Rx.Pauser = (function(__super__) {
    inherits(Pauser, __super__);
    function Pauser() {
      __super__.call(this);
    }
    Pauser.prototype.pause = function() {
      this.onNext(false);
    };
    Pauser.prototype.resume = function() {
      this.onNext(true);
    };
    return Pauser;
  }(Subject));
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    root.Rx = Rx;
    define("7", [], function() {
      return Rx;
    });
  } else if (freeExports && freeModule) {
    if (moduleExports) {
      (freeModule.exports = Rx).Rx = Rx;
    } else {
      freeExports.Rx = Rx;
    }
  } else {
    root.Rx = Rx;
  }
  var rEndingLine = captureLine();
}.call(this));

_removeDefine();
})();
$__System.registerDynamic("8", ["7"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Rx = $__require('7');
  var EventStream = function(initialValue) {
    this.value = initialValue;
    this.observable = new Rx.BehaviorSubject(initialValue);
    this.event = this.observable.publish();
    this.event.connect();
  };
  EventStream.prototype.emit = function(detail) {
    this.value = detail;
    return this.observable.onNext(detail);
  };
  EventStream.prototype.listen = function(callback) {
    return this.event.subscribe(callback);
  };
  EventStream.prototype.observe = function(callback) {
    return this.observable.subscribe(callback);
  };
  EventStream.prototype.dispose = function() {
    this.value = undefined;
    this.observable.onCompleted();
    return this.observable.dispose();
  };
  module.exports = EventStream;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("9", [], false, function(__require, __exports, __module) {
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

$__System.registerDynamic("4", ["6", "5", "3", "8", "9"], true, function($__require, exports, module) {
  "use strict";
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var setAsyncTask = $__require('6').setAsyncTask,
      ConnexionEvent = $__require('5'),
      environment = $__require('3'),
      EventStream = $__require('8'),
      es6collections = $__require('9'),
      WeakMap = es6collections.WeakMap || environment.global.WeakMap,
      isNodeJs = environment.isNodeJs;
  function createObserver(callback) {
    var observer;
    observer = function(event) {
      if (event.isCanceled) {
        return;
      }
      callback(event.detail, event);
    };
    return observer;
  }
  function createAsyncObserver(callback) {
    var observer;
    observer = function(event) {
      if (event.isCanceled) {
        return;
      }
      setAsyncTask(function() {
        callback(event.detail, event);
      });
    };
    return observer;
  }
  function ensureStreamExists(emitter, name) {
    var stream = emitter.subjects[name];
    if (!stream) {
      stream = new EventStream(new ConnexionEvent({
        type: name,
        timeStamp: 0
      }));
      emitter.subscriptions[name] = new WeakMap();
      emitter.subjects[name] = stream;
    }
    return stream;
  }
  function ensureStreamDestroyed(emitter, name) {
    var stream = emitter.subjects[name];
    if (stream) {
      emitter.subscriptions[name] = null;
      emitter.subjects[name] = null;
    }
    return stream;
  }
  var Emitter = function() {
    this.subjects = Object.create(null);
    this.subscriptions = Object.create(null);
  };
  Emitter.prototype.emit = function(eventType, detail) {
    var stream,
        commonStream,
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
    stream = ensureStreamExists(this, eventType);
    commonStream = ensureStreamExists(this, '*');
    setAsyncTask(stream.emit.bind(stream, event));
    if (eventType !== '*') {
      setAsyncTask(commonStream.emit.bind(commonStream, event));
    }
    return event;
  };
  Emitter.prototype.listen = function(eventType, handler) {
    var listeners,
        stream,
        observer,
        subscription;
    if (typeof eventType === 'object' && eventType) {
      listeners = eventType;
      for (eventType in listeners) {
        this.listen(eventType, listeners[eventType]);
      }
    } else if (eventType && handler) {
      stream = ensureStreamExists(this, eventType);
      observer = createObserver(handler);
      subscription = stream.listen(observer);
      listeners = this.subscriptions[eventType].get(handler) || [];
      listeners.push(subscription);
      this.subscriptions[eventType].set(handler, listeners);
      subscription.callback = handler;
    }
    return subscription;
  };
  Emitter.prototype.observe = function(eventType, handler) {
    var listeners,
        stream,
        observer,
        subscription;
    if (typeof eventType === 'object' && eventType) {
      listeners = eventType;
      for (eventType in listeners) {
        this.listen(eventType, listeners[eventType]);
      }
    } else if (eventType && handler) {
      stream = ensureStreamExists(this, eventType);
      observer = createAsyncObserver(handler);
      subscription = stream.observe(observer);
      listeners = this.subscriptions[eventType].get(handler) || [];
      listeners.push(subscription);
      this.subscriptions[eventType].set(handler, listeners);
      subscription.callback = handler;
    }
    return subscription;
  };
  Emitter.prototype.unsubscribe = function(eventType, handler) {
    var listeners,
        stream,
        streams,
        subscription,
        subscriptions,
        i;
    if (!eventType && !handler) {
      streams = this.subjects;
      for (eventType in streams) {
        this.unsubscribe(eventType);
      }
    } else if (typeof eventType === 'object' && eventType) {
      listeners = eventType;
      for (eventType in listeners) {
        this.unsubscribe(eventType, listeners[eventType]);
      }
    } else if (eventType && !handler) {
      stream = this.subjects[eventType];
      if (stream) {
        stream.dispose();
        ensureStreamDestroyed(this, eventType);
      }
    } else if (eventType && handler) {
      subscriptions = this.subscriptions[eventType];
      if (subscriptions) {
        if ('dispose' in handler) {
          subscription = handler;
          handler = subscription.callback;
          subscription.dispose();
          subscription.callback = undefined;
          listeners = subscriptions.get(handler);
          if (listeners) {
            i = -1;
            while (++i in listeners) {
              if (subscription === listeners[i]) {
                listeners.splice(i, 1);
                break;
              }
            }
          }
        } else {
          listeners = subscriptions.get(handler);
          if (listeners) {
            i = -1;
            while (++i in listeners) {
              subscription = listeners[i];
              subscription.dispose();
              subscription.callback = undefined;
            }
            subscriptions.delete(handler);
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
  connexion.version = '0.3.0';
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