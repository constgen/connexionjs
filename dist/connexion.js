!function(e){function r(e,r,o){return 4===arguments.length?t.apply(this,arguments):void n(e,{declarative:!0,deps:r,declare:o})}function t(e,r,t,o){n(e,{declarative:!1,deps:r,executingRequire:t,execute:o})}function n(e,r){r.name=e,e in v||(v[e]=r),r.normalizedDeps=r.deps}function o(e,r){if(r[e.groupIndex]=r[e.groupIndex]||[],-1==g.call(r[e.groupIndex],e)){r[e.groupIndex].push(e);for(var t=0,n=e.normalizedDeps.length;n>t;t++){var a=e.normalizedDeps[t],u=v[a];if(u&&!u.evaluated){var d=e.groupIndex+(u.declarative!=e.declarative);if(void 0===u.groupIndex||u.groupIndex<d){if(void 0!==u.groupIndex&&(r[u.groupIndex].splice(g.call(r[u.groupIndex],u),1),0==r[u.groupIndex].length))throw new TypeError("Mixed dependency cycle detected");u.groupIndex=d}o(u,r)}}}}function a(e){var r=v[e];r.groupIndex=0;var t=[];o(r,t);for(var n=!!r.declarative==t.length%2,a=t.length-1;a>=0;a--){for(var u=t[a],i=0;i<u.length;i++){var s=u[i];n?d(s):l(s)}n=!n}}function u(e){return y[e]||(y[e]={name:e,dependencies:[],exports:{},importers:[]})}function d(r){if(!r.module){var t=r.module=u(r.name),n=r.module.exports,o=r.declare.call(e,function(e,r){if(t.locked=!0,"object"==typeof e)for(var o in e)n[o]=e[o];else n[e]=r;for(var a=0,u=t.importers.length;u>a;a++){var d=t.importers[a];if(!d.locked)for(var i=0;i<d.dependencies.length;++i)d.dependencies[i]===t&&d.setters[i](n)}return t.locked=!1,r},{id:r.name});t.setters=o.setters,t.execute=o.execute;for(var a=0,i=r.normalizedDeps.length;i>a;a++){var l,s=r.normalizedDeps[a],c=v[s],f=y[s];f?l=f.exports:c&&!c.declarative?l=c.esModule:c?(d(c),f=c.module,l=f.exports):l=p(s),f&&f.importers?(f.importers.push(t),t.dependencies.push(f)):t.dependencies.push(null),t.setters[a]&&t.setters[a](l)}}}function i(e){var r,t=v[e];if(t)t.declarative?f(e,[]):t.evaluated||l(t),r=t.module.exports;else if(r=p(e),!r)throw new Error("Unable to load dependency "+e+".");return(!t||t.declarative)&&r&&r.__useDefault?r["default"]:r}function l(r){if(!r.module){var t={},n=r.module={exports:t,id:r.name};if(!r.executingRequire)for(var o=0,a=r.normalizedDeps.length;a>o;o++){var u=r.normalizedDeps[o],d=v[u];d&&l(d)}r.evaluated=!0;var c=r.execute.call(e,function(e){for(var t=0,n=r.deps.length;n>t;t++)if(r.deps[t]==e)return i(r.normalizedDeps[t]);throw new TypeError("Module "+e+" not declared as a dependency.")},t,n);void 0!==typeof c&&(n.exports=c),t=n.exports,t&&t.__esModule?r.esModule=t:r.esModule=s(t)}}function s(r){var t={};if(("object"==typeof r||"function"==typeof r)&&r!==e)if(m)for(var n in r)"default"!==n&&c(t,r,n);else{var o=r&&r.hasOwnProperty;for(var n in r)"default"===n||o&&!r.hasOwnProperty(n)||(t[n]=r[n])}return t["default"]=r,x(t,"__useDefault",{value:!0}),t}function c(e,r,t){try{var n;(n=Object.getOwnPropertyDescriptor(r,t))&&x(e,t,n)}catch(o){return e[t]=r[t],!1}}function f(r,t){var n=v[r];if(n&&!n.evaluated&&n.declarative){t.push(r);for(var o=0,a=n.normalizedDeps.length;a>o;o++){var u=n.normalizedDeps[o];-1==g.call(t,u)&&(v[u]?f(u,t):p(u))}n.evaluated||(n.evaluated=!0,n.module.execute.call(e))}}function p(e){if(I[e])return I[e];if("@node/"==e.substr(0,6))return I[e]=s(D(e.substr(6)));var r=v[e];if(!r)throw"Module "+e+" not present.";return a(e),f(e,[]),v[e]=void 0,r.declarative&&x(r.module.exports,"__esModule",{value:!0}),I[e]=r.declarative?r.module.exports:r.esModule}var v={},g=Array.prototype.indexOf||function(e){for(var r=0,t=this.length;t>r;r++)if(this[r]===e)return r;return-1},m=!0;try{Object.getOwnPropertyDescriptor({a:0},"a")}catch(h){m=!1}var x;!function(){try{Object.defineProperty({},"a",{})&&(x=Object.defineProperty)}catch(e){x=function(e,r,t){try{e[r]=t.value||t.get.call(e)}catch(n){}}}}();var y={},D="undefined"!=typeof System&&System._nodeRequire||"undefined"!=typeof require&&require.resolve&&"undefined"!=typeof process&&require,I={"@empty":{}};return function(e,n,o,a){return function(u){u(function(u){for(var d={_nodeRequire:D,register:r,registerDynamic:t,get:p,set:function(e,r){I[e]=r},newModule:function(e){return e}},i=0;i<n.length;i++)(function(e,r){r&&r.__esModule?I[e]=r:I[e]=s(r)})(n[i],arguments[i]);a(d);var l=p(e[0]);if(e.length>1)for(var i=1;i<e.length;i++)p(e[i]);return o?l["default"]:l})}}}("undefined"!=typeof self?self:global)

(["1"], [], true, function($__System) {
var require = this.require, exports = this.exports, module = this.module;
!function(e){function r(e,r){for(var n=e.split(".");n.length;)r=r[n.shift()];return r}function n(n){if("string"==typeof n)return r(n,e);if(!(n instanceof Array))throw new Error("Global exports must be a string or array.");for(var t={},o=!0,f=0;f<n.length;f++){var i=r(n[f],e);o&&(t["default"]=i,o=!1),t[n[f].split(".").pop()]=i}return t}function t(r){if(Object.keys)Object.keys(e).forEach(r);else for(var n in e)a.call(e,n)&&r(n)}function o(r){t(function(n){if(-1==l.call(s,n)){try{var t=e[n]}catch(o){s.push(n)}r(n,t)}})}var f,i=$__System,a=Object.prototype.hasOwnProperty,l=Array.prototype.indexOf||function(e){for(var r=0,n=this.length;n>r;r++)if(this[r]===e)return r;return-1},s=["_g","sessionStorage","localStorage","clipboardData","frames","frameElement","external","mozAnimationStartTime","webkitStorageInfo","webkitIndexedDB","mozInnerScreenY","mozInnerScreenX"];i.set("@@global-helpers",i.newModule({prepareGlobal:function(r,t,i){var a=e.define;e.define=void 0;var l;if(i){l={};for(var s in i)l[s]=e[s],e[s]=i[s]}return t||(f={},o(function(e,r){f[e]=r})),function(){var r;if(t)r=n(t);else{r={};var i,s;o(function(e,n){f[e]!==n&&"undefined"!=typeof n&&(r[e]=n,"undefined"!=typeof i?s||i===n||(s=!0):i=n)}),r=s?r:i}if(l)for(var u in l)e[u]=l[u];return e.define=a,r}}}))}("undefined"!=typeof self?self:global);
$__System.registerDynamic('2', [], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var validTypes = { object: true, symbol: true };

	module.exports = function () {
		var symbol;
		if (typeof Symbol !== 'function') return false;
		symbol = Symbol('test symbol');
		try {
			String(symbol);
		} catch (e) {
			return false;
		}

		// Return 'true' also for polyfills
		if (!validTypes[typeof Symbol.iterator]) return false;
		if (!validTypes[typeof Symbol.toPrimitive]) return false;
		if (!validTypes[typeof Symbol.toStringTag]) return false;

		return true;
	};
	return module.exports;
});
$__System.registerDynamic('3', [], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	module.exports = function () {
		var assign = Object.assign,
		    obj;
		if (typeof assign !== 'function') return false;
		obj = { foo: 'raz' };
		assign(obj, { bar: 'dwa' }, { trzy: 'trzy' });
		return obj.foo + obj.bar + obj.trzy === 'razdwatrzy';
	};
	return module.exports;
});
$__System.registerDynamic('4', [], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	module.exports = function () {
		try {
			Object.keys('primitive');
			return true;
		} catch (e) {
			return false;
		}
	};
	return module.exports;
});
$__System.registerDynamic('5', [], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var keys = Object.keys;

	module.exports = function (object) {
		return keys(object == null ? object : Object(object));
	};
	return module.exports;
});
$__System.registerDynamic('6', ['4', '5'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	module.exports = $__require('4')() ? Object.keys : $__require('5');
	return module.exports;
});
$__System.registerDynamic("7", [], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	module.exports = function (value) {
		if (value == null) throw new TypeError("Cannot use null or undefined");
		return value;
	};
	return module.exports;
});
$__System.registerDynamic('8', ['6', '7'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var keys = $__require('6'),
	    value = $__require('7'),
	    max = Math.max;

	module.exports = function (dest, src /*, …srcn*/) {
		var error,
		    i,
		    l = max(arguments.length, 2),
		    assign;
		dest = Object(value(dest));
		assign = function (key) {
			try {
				dest[key] = src[key];
			} catch (e) {
				if (!error) error = e;
			}
		};
		for (i = 1; i < l; ++i) {
			src = arguments[i];
			keys(src).forEach(assign);
		}
		if (error !== undefined) throw error;
		return dest;
	};
	return module.exports;
});
$__System.registerDynamic('9', ['3', '8'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	module.exports = $__require('3')() ? Object.assign : $__require('8');
	return module.exports;
});
$__System.registerDynamic('a', [], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var forEach = Array.prototype.forEach,
	    create = Object.create;

	var process = function (src, obj) {
		var key;
		for (key in src) obj[key] = src[key];
	};

	module.exports = function (options /*, …options*/) {
		var result = create(null);
		forEach.call(arguments, function (options) {
			if (options == null) return;
			process(Object(options), result);
		});
		return result;
	};
	return module.exports;
});
$__System.registerDynamic('b', [], true, function ($__require, exports, module) {
  // Deprecated

  'use strict';

  var define,
      global = this || self,
      GLOBAL = global;
  module.exports = function (obj) {
    return typeof obj === 'function';
  };
  return module.exports;
});
$__System.registerDynamic('c', [], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var str = 'razdwatrzy';

	module.exports = function () {
		if (typeof str.contains !== 'function') return false;
		return str.contains('dwa') === true && str.contains('foo') === false;
	};
	return module.exports;
});
$__System.registerDynamic('d', [], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var indexOf = String.prototype.indexOf;

	module.exports = function (searchString /*, position*/) {
		return indexOf.call(this, searchString, arguments[1]) > -1;
	};
	return module.exports;
});
$__System.registerDynamic('e', ['c', 'd'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	module.exports = $__require('c')() ? String.prototype.contains : $__require('d');
	return module.exports;
});
$__System.registerDynamic('f', ['9', 'a', 'b', 'e'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var assign = $__require('9'),
	    normalizeOpts = $__require('a'),
	    isCallable = $__require('b'),
	    contains = $__require('e'),
	    d;

	d = module.exports = function (dscr, value /*, options*/) {
		var c, e, w, options, desc;
		if (arguments.length < 2 || typeof dscr !== 'string') {
			options = value;
			value = dscr;
			dscr = null;
		} else {
			options = arguments[2];
		}
		if (dscr == null) {
			c = w = true;
			e = false;
		} else {
			c = contains.call(dscr, 'c');
			e = contains.call(dscr, 'e');
			w = contains.call(dscr, 'w');
		}

		desc = { value: value, configurable: c, enumerable: e, writable: w };
		return !options ? desc : assign(normalizeOpts(options), desc);
	};

	d.gs = function (dscr, get, set /*, options*/) {
		var c, e, options, desc;
		if (typeof dscr !== 'string') {
			options = set;
			set = get;
			get = dscr;
			dscr = null;
		} else {
			options = arguments[3];
		}
		if (get == null) {
			get = undefined;
		} else if (!isCallable(get)) {
			options = get;
			get = set = undefined;
		} else if (set == null) {
			set = undefined;
		} else if (!isCallable(set)) {
			options = set;
			set = undefined;
		}
		if (dscr == null) {
			c = true;
			e = false;
		} else {
			c = contains.call(dscr, 'c');
			e = contains.call(dscr, 'e');
		}

		desc = { get: get, set: set, configurable: c, enumerable: e };
		return !options ? desc : assign(normalizeOpts(options), desc);
	};
	return module.exports;
});
$__System.registerDynamic('10', [], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	module.exports = function (x) {
		if (!x) return false;
		if (typeof x === 'symbol') return true;
		if (!x.constructor) return false;
		if (x.constructor.name !== 'Symbol') return false;
		return x[x.constructor.toStringTag] === 'Symbol';
	};
	return module.exports;
});
$__System.registerDynamic('11', ['10'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var isSymbol = $__require('10');

	module.exports = function (value) {
		if (!isSymbol(value)) throw new TypeError(value + " is not a symbol");
		return value;
	};
	return module.exports;
});
$__System.registerDynamic('12', ['f', '11'], true, function ($__require, exports, module) {
	// ES2015 Symbol polyfill for environments that do not support it (or partially support it)

	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var d = $__require('f'),
	    validateSymbol = $__require('11'),
	    create = Object.create,
	    defineProperties = Object.defineProperties,
	    defineProperty = Object.defineProperty,
	    objPrototype = Object.prototype,
	    NativeSymbol,
	    SymbolPolyfill,
	    HiddenSymbol,
	    globalSymbols = create(null),
	    isNativeSafe;

	if (typeof Symbol === 'function') {
		NativeSymbol = Symbol;
		try {
			String(NativeSymbol());
			isNativeSafe = true;
		} catch (ignore) {}
	}

	var generateName = function () {
		var created = create(null);
		return function (desc) {
			var postfix = 0,
			    name,
			    ie11BugWorkaround;
			while (created[desc + (postfix || '')]) ++postfix;
			desc += postfix || '';
			created[desc] = true;
			name = '@@' + desc;
			defineProperty(objPrototype, name, d.gs(null, function (value) {
				// For IE11 issue see:
				// https://connect.microsoft.com/IE/feedbackdetail/view/1928508/
				//    ie11-broken-getters-on-dom-objects
				// https://github.com/medikoo/es6-symbol/issues/12
				if (ie11BugWorkaround) return;
				ie11BugWorkaround = true;
				defineProperty(this, name, d(value));
				ie11BugWorkaround = false;
			}));
			return name;
		};
	}();

	// Internal constructor (not one exposed) for creating Symbol instances.
	// This one is used to ensure that `someSymbol instanceof Symbol` always return false
	HiddenSymbol = function Symbol(description) {
		if (this instanceof HiddenSymbol) throw new TypeError('TypeError: Symbol is not a constructor');
		return SymbolPolyfill(description);
	};

	// Exposed `Symbol` constructor
	// (returns instances of HiddenSymbol)
	module.exports = SymbolPolyfill = function Symbol(description) {
		var symbol;
		if (this instanceof Symbol) throw new TypeError('TypeError: Symbol is not a constructor');
		if (isNativeSafe) return NativeSymbol(description);
		symbol = create(HiddenSymbol.prototype);
		description = description === undefined ? '' : String(description);
		return defineProperties(symbol, {
			__description__: d('', description),
			__name__: d('', generateName(description))
		});
	};
	defineProperties(SymbolPolyfill, {
		for: d(function (key) {
			if (globalSymbols[key]) return globalSymbols[key];
			return globalSymbols[key] = SymbolPolyfill(String(key));
		}),
		keyFor: d(function (s) {
			var key;
			validateSymbol(s);
			for (key in globalSymbols) if (globalSymbols[key] === s) return key;
		}),

		// If there's native implementation of given symbol, let's fallback to it
		// to ensure proper interoperability with other native functions e.g. Array.from
		hasInstance: d('', NativeSymbol && NativeSymbol.hasInstance || SymbolPolyfill('hasInstance')),
		isConcatSpreadable: d('', NativeSymbol && NativeSymbol.isConcatSpreadable || SymbolPolyfill('isConcatSpreadable')),
		iterator: d('', NativeSymbol && NativeSymbol.iterator || SymbolPolyfill('iterator')),
		match: d('', NativeSymbol && NativeSymbol.match || SymbolPolyfill('match')),
		replace: d('', NativeSymbol && NativeSymbol.replace || SymbolPolyfill('replace')),
		search: d('', NativeSymbol && NativeSymbol.search || SymbolPolyfill('search')),
		species: d('', NativeSymbol && NativeSymbol.species || SymbolPolyfill('species')),
		split: d('', NativeSymbol && NativeSymbol.split || SymbolPolyfill('split')),
		toPrimitive: d('', NativeSymbol && NativeSymbol.toPrimitive || SymbolPolyfill('toPrimitive')),
		toStringTag: d('', NativeSymbol && NativeSymbol.toStringTag || SymbolPolyfill('toStringTag')),
		unscopables: d('', NativeSymbol && NativeSymbol.unscopables || SymbolPolyfill('unscopables'))
	});

	// Internal tweaks for real symbol producer
	defineProperties(HiddenSymbol.prototype, {
		constructor: d(SymbolPolyfill),
		toString: d('', function () {
			return this.__name__;
		})
	});

	// Proper implementation of methods exposed on Symbol.prototype
	// They won't be accessible on produced symbol instances as they derive from HiddenSymbol.prototype
	defineProperties(SymbolPolyfill.prototype, {
		toString: d(function () {
			return 'Symbol (' + validateSymbol(this).__description__ + ')';
		}),
		valueOf: d(function () {
			return validateSymbol(this);
		})
	});
	defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toPrimitive, d('', function () {
		var symbol = validateSymbol(this);
		if (typeof symbol === 'symbol') return symbol;
		return symbol.toString();
	}));
	defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toStringTag, d('c', 'Symbol'));

	// Proper implementaton of toPrimitive and toStringTag for returned symbol instances
	defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toStringTag, d('c', SymbolPolyfill.prototype[SymbolPolyfill.toStringTag]));

	// Note: It's important to define `toPrimitive` as last one, as some implementations
	// implement `toPrimitive` natively without implementing `toStringTag` (or other specified symbols)
	// And that may invoke error in definition flow:
	// See: https://github.com/medikoo/es6-symbol/issues/13#issuecomment-164146149
	defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toPrimitive, d('c', SymbolPolyfill.prototype[SymbolPolyfill.toPrimitive]));
	return module.exports;
});
$__System.registerDynamic('13', ['2', '12'], true, function ($__require, exports, module) {
  'use strict';

  var define,
      global = this || self,
      GLOBAL = global;
  module.exports = $__require('2')() ? Symbol : $__require('12');
  return module.exports;
});
$__System.registerDynamic('14', [], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	module.exports = function () {
		return function () {};
	};
	return module.exports;
});
$__System.registerDynamic('15', ['14'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var createNoop = $__require('14');

	function Handler(callback, identifier) {
		callback = callback || createNoop();
		if (callback[identifier]) {
			return callback[identifier];
		} else {
			callback[identifier] = this;
			this.callback = callback;
			this.next = undefined;
			this.prev = undefined;
		}
	}

	Handler.prototype.call = function (event) {
		var callback = this.callback;
		callback(event);
	};

	module.exports = Handler;
	return module.exports;
});
$__System.registerDynamic('16', ['13', '15'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var Symbol = $__require('13');
	var Handler = $__require('15');

	function HandlersCollection() {
		this.head = new Handler();
		this.tail = new Handler();
		this.head.next = this.tail;
		this.tail.prev = this.head;
		this.identifier = Symbol();
	}

	HandlersCollection.prototype = {
		constructor: HandlersCollection,

		handle: function (event) {
			var handler = this.head.next;
			while (handler) {
				handler.call(event);
				handler = handler.next;
			}
		},

		push: function (callback) {
			var handler = new Handler(callback, this.identifier);
			var last = this.tail.prev;
			if (handler.next) {
				//is already in collection
				return;
			}
			handler.next = this.tail;
			this.tail.prev = handler;
			handler.prev = last;
			last.next = handler;
		},

		remove: function (callback) {
			var handler = new Handler(callback, this.identifier);
			var prev = handler.prev;
			var next = handler.next;
			if (prev) {
				prev.next = next;
			}
			if (next) {
				next.prev = prev;
			}
		},

		empty: function () {
			this.head.next = this.tail;
			this.tail.prev = this.head;
		}
	};

	module.exports = HandlersCollection;
	return module.exports;
});
$__System.registerDynamic('17', ['18', '19', '1a', '1b', '1c', '1d'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var MessageEvent = $__require('18');
	var Message = $__require('19');
	var generateRandomKey = $__require('1a');
	var getCrossChildWindows = $__require('1b').getCrossOriginChildren;
	var environment = $__require('1c');
	var locationOrigin = $__require('1d').origin;

	var global = environment.global;
	var window = environment.window;
	var key = generateRandomKey();

	/*
 Known issues:
 1. Safari detection of a structured clonning support when DOM is sent. String(e.data).indexOf("Null") !== -1. See https://gist.github.com/ryanseddon/4583494
 2. IE8's events are triggered synchronously, which may lead to to unexpected results.
 3. Firefox 41 and below do not support sending File/Blob objects see bug
 5. Probbaly: IE<=9 doesn't like you to call postMessage as soon as page loads. Use a setTimeout to wait one or two seconds before calling postMessage.
 6. IE8-11 doesn't support postMessage on different tabs and origins.
 7. Worker structured clonning support (from MDN): Chrome >=13, Firefox >=8, IE>=10.0, Opera >=11.5, Safari>=6
 
 Links:
 * http://blogs.msdn.com/b/ieinternals/archive/2009/09/16/bugs-in-ie8-support-for-html5-postmessage-sessionstorage-and-localstorage.aspx
 
 Todo:
 1. Add `window.open` & `window.opener` messaging
 
 */

	function Transport(name) {
		this.port1 = window.top;
		this.port2 = global;
		this.origin = '*';
		this.listener = null;
		this.name = name;
		this.key = key;
	}

	Transport.supported = Boolean(global.postMessage);
	Transport.EVENT_TYPE = 'message';

	Transport.prototype = {
		constructor: Transport,

		send: function (data) {
			var origin = this.origin;
			var message = new Message(data, this);
			var windows = getCrossChildWindows(this.port1);
			var index = -1;
			this.port1.postMessage(message, origin); //always send message to a top window
			while (++index in windows) {
				windows[index].postMessage(message, origin);
			}
		},

		onMessageEvent: function (handler) {
			var transport = this;
			var port2 = this.port2;
			function listener(event) {
				var messageEvent = new MessageEvent(event);
				if ((event.source === port2 || locationOrigin !== event.origin) && 'key' in messageEvent && 'sourceChannel' in messageEvent && transport.name === messageEvent.sourceChannel //events on the same channel
				&& transport.key !== messageEvent.key //skip returned back events
				) {
						handler(messageEvent);
					}
			}
			port2.removeEventListener(Transport.EVENT_TYPE, this.listener);
			port2.addEventListener(Transport.EVENT_TYPE, listener);
			this.listener = listener;
		},

		close: function () {
			this.port2.removeEventListener(Transport.EVENT_TYPE, this.listener);
			this.listener = null;
		}
	};

	module.exports = Transport;
	return module.exports;
});
$__System.registerDynamic('1e', ['18', '19', '1a', '1b', '1c'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var MessageEvent = $__require('18');
	var Message = $__require('19');
	var generateRandomKey = $__require('1a');
	var getAllWindows = $__require('1b').getAll;
	var environment = $__require('1c');

	var global = environment.global;
	var window = environment.window;

	/*
 Known issues:
 1. Safari detection of a structured clonning support when DOM is sent. String(e.data).indexOf("Null") !== -1. See https://gist.github.com/ryanseddon/4583494
 2. IE8's events are triggered synchronously, which may lead to to unexpected results.
 3. Firefox 41 and below do not support sending File/Blob objects see bug
 5. Probbaly: IE<=9 doesn't like you to call postMessage as soon as page loads. Use a setTimeout to wait one or two seconds before calling postMessage.
 6. IE8-11 doen't support postMessage on different tabs and origins.
 7. Worker structured clonning support (from MDN): Chrome >=13, Firefox >=8, IE>=10.0, Opera >=11.5, Safari>=6
 
 Links:
 * http://blogs.msdn.com/b/ieinternals/archive/2009/09/16/bugs-in-ie8-support-for-html5-postmessage-sessionstorage-and-localstorage.aspx
 
 Todo:
 1. Add `window.open` & `window.opener` messaging
 
 */

	function Transport(name) {
		this.port1 = window.top;
		this.port2 = global;
		this.origin = '*';
		this.listener = null;
		this.name = name;
		this.key = generateRandomKey();
	}

	Transport.supported = Boolean(global.postMessage);
	Transport.EVENT_TYPE = 'message';

	Transport.prototype = {
		constructor: Transport,

		send: function (data) {
			var origin = this.origin;
			var message = new Message(data, this);
			var windows = getAllWindows(this.port1);
			var index = -1;
			while (++index in windows) {
				windows[index].postMessage(message, origin);
			}
		},

		onMessageEvent: function (handler) {
			var transport = this;
			var port2 = transport.port2;
			function listener(event) {
				var messageEvent = new MessageEvent(event);
				if ('key' in messageEvent && 'sourceChannel' in messageEvent && transport.name === messageEvent.sourceChannel //events on the same channel
				&& transport.key !== messageEvent.key //skip returned back events
				) {
						handler(messageEvent);
					}
			}
			port2.removeEventListener(Transport.EVENT_TYPE, transport.listener);
			port2.addEventListener(Transport.EVENT_TYPE, listener);
			transport.listener = listener;
		},

		close: function () {
			this.port2.removeEventListener(Transport.EVENT_TYPE, this.listener);
			this.listener = null;
		}
	};

	module.exports = Transport;
	return module.exports;
});
$__System.registerDynamic('1f', ['18', '19', '1a', '1b', '1c'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var MessageEvent = $__require('18');
	var Message = $__require('19');
	var generateRandomKey = $__require('1a');
	var getAllWindows = $__require('1b').getAll;
	var environment = $__require('1c');

	/*
 Known issues:
 1. From NW to child window - NO
 2. From child window to NW - NO
 3. From child frame to child window - NO
 4. From child window to child frame - NO
 5. <iframe nwfaketop> disables message bubbling to the parent frame
 */

	var global = environment.global;

	function getGUI(window) {
		return window && window.nwDispatcher.requireNwGui();
	}

	function whenGuiReadyThen(callback) {
		var gui = getGUI(global.window);
		if (gui) {
			callback(gui);
			return;
		}
		var timerId = setInterval(function () {
			gui = getGUI(global.window);
			if (gui) {
				clearInterval(timerId);
				callback(gui);
			}
		}, 4);
	}

	function getNWWindowThen(callback) {
		whenGuiReadyThen(function (gui) {
			var nwWindow = gui.Window.get();
			callback(nwWindow);
		});
	}

	function Transport(name) {
		var transport = this;
		// this.port - computed value
		this.origin = '*'; //location = window.location, location && (location.origin || (location.protocol + '//' + location.host)) || '*'
		this.listener = null;
		this.name = name;
		this.key = generateRandomKey();
		this.nwLoadedListener = function () {
			var listener = transport.listener;
			var port = transport.port;
			if (listener) {
				//port.removeEventListener(Transport.EVENT_TYPE, listener)
				port.addEventListener(Transport.EVENT_TYPE, listener);
			}
		};
		getNWWindowThen(function (nwWindow) {
			//listen when page is refreshed
			nwWindow.on('loaded', transport.nwLoadedListener);
		});
	}

	Transport.supported = Boolean(environment.is.node && environment.is.nodeWebkit);
	Transport.EVENT_TYPE = 'message';

	Transport.prototype = {
		constructor: Transport,

		send: function (data) {
			var transport = this;
			var origin = this.origin;
			var message = new Message(data, this);
			getNWWindowThen(function (nwWindow) {
				var browserWindow = transport.port;
				var topBrowserWindow = browserWindow.top;
				var browserFrames = getAllWindows(topBrowserWindow);
				// try {
				// 	if (global.__nwWindowsStore) {
				// 		browserFrames = Object.keys(global.__nwWindowsStore)
				// 			.map(function(id) {
				// 				return global.__nwWindowsStore[id];
				// 			})
				// 			.map(function(nwWindow) {
				// 				var browserWindow = nwWindow.window;
				// 				return getAllWindows(browserWindow.top)
				// 			})
				// 			.reduce(function(allBrowserWindows, browserWindows) {
				// 				return allBrowserWindows.concat(browserWindows)
				// 			}, [])
				// 	}
				// }
				// catch (err) {
				// 	setTimeout(console.error.bind(console, err), 4000)
				//
				// }
				var index = -1;
				while (++index in browserFrames) {
					//.replace(/'/g, '\\\'')
					nwWindow.eval(browserFrames[index].frameElement || null, 'window.postMessage(' + JSON.stringify(message.asJSON()) + ', "' + origin + '")');
				}
			});
		},

		onMessageEvent: function (handler) {
			var transport = this;
			function listener(e) {
				var window = this;
				var nativeMessageEventWorks = window.MessageEvent && window.MessageEvent.length;
				var event = nativeMessageEventWorks ? new window.MessageEvent(Transport.EVENT_TYPE, e) : e; //fixes crashes in NWjs, when read `e.data`
				var messageEvent = new MessageEvent(event);

				if ('key' in messageEvent && 'sourceChannel' in messageEvent && transport.name === messageEvent.sourceChannel //events on the same channel
				&& transport.key !== messageEvent.key //skip returned back events
				) {
						handler(messageEvent);
					}
			}

			getNWWindowThen(function () {
				var port = transport.port;
				port.removeEventListener(Transport.EVENT_TYPE, transport.listener);
				port.addEventListener(Transport.EVENT_TYPE, listener);
				transport.listener = listener;
			});
		},

		close: function () {
			var transport = this;
			getNWWindowThen(function (nwWindow) {
				transport.port.removeEventListener(Transport.EVENT_TYPE, transport.listener);
				transport.listener = null;
				nwWindow.removeListener('loaded', transport.nwLoadedListener);
			});
		}
	};

	//computed `this.port`
	Object.defineProperty(Transport.prototype, 'port', {
		get: function () {
			return global.window;
		},
		set: function (value) {}
	});

	module.exports = Transport;
	return module.exports;
});
$__System.registerDynamic('20', ['21'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var noop = $__require('21');

	function Transport() {}

	Transport.prototype = {
		constructor: Transport,
		send: noop,
		onMessageEvent: noop,
		close: noop
	};

	module.exports = Transport;
	return module.exports;
});
$__System.registerDynamic('22', ['18', '19', '1a', '1c', '21'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var MessageEvent = $__require('18');
	var Message = $__require('19');
	var generateRandomKey = $__require('1a');
	var environment = $__require('1c');
	var noop = $__require('21');

	var global = environment.global;
	var chrome = global.chrome;
	var extension = typeof browser === 'object' && browser;
	var runtime = extension && extension.runtime || chrome && (chrome.runtime || chrome.extension);
	var tabs = extension && extension.tabs || chrome && chrome.tabs;
	var detection = runtime && runtime.onMessage;

	/*
 Reference:
 https://developer.chrome.com/extensions/messaging
 http://www.adambarth.com/experimental/crx/docs/messaging.html (Chrome <=19 )
 https://developer.chrome.com/extensions/content_scripts#host-page-communication
 http://stackoverflow.com/questions/10526995/can-a-site-invoke-a-browser-extension
 
 If you need to support Chrome 19 and earlier, use chrome.extention.onRequest and chrome.extention.sendRequest
 For Chrome 20 - 25, use chrome.extension.onMessage and chrome.extension.sendMessage
 For Chrome 26+ use chrome.runtime.onMessage and chrome.runtime.sendMessage
 
 Getting manifest config
 chrome.runtime.getManifest()
 
  */

	function Transport(name) {
		this.port = runtime;
		this.tabs = tabs;
		this.name = name;
		this.key = generateRandomKey();
		this.listener = noop;
	}

	Transport.supported = Boolean(detection);

	Transport.prototype = {
		constructor: Transport,

		send: function (data) {
			var message = new Message(data, this);
			var transport = this;
			this.port.sendMessage(message);
			if (this.tabs) {
				this.tabs.query({}, function (tabs) {
					var i = -1;
					while (++i in tabs) {
						transport.tabs.sendMessage(tabs[i].id, message, function () {
							var err = runtime.lastError;
						});
					}
				});
			}
			//this.port.sendMessage(extensionId, message)
		},

		onMessageEvent: function (handler) {
			var transport = this;
			//	Fired when a message is sent from another extension/app (by runtime.sendMessage). Cannot be used in a content script. 
			// chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse){})
			function listener(message, sender) {
				var messageEvent = new MessageEvent({
					data: message,
					origin: sender.tab ? sender.tab.url : sender.url
				});
				if ('sourceChannel' in messageEvent && 'key' in messageEvent && transport.name === messageEvent.sourceChannel //events on the same channel
				&& transport.key !== messageEvent.key //skip returned back events
				) {
						handler(messageEvent);
					}
			}
			this.port.onMessage.removeListener(this.listener);
			//this.port.onMessageExternal.removeListener(this.listener)
			this.port.onMessage.addListener(listener);
			//this.port.onMessageExternal.addListener(listener)
			this.listener = listener;
		},

		close: function () {
			this.port.onMessage.removeListener(this.listener);
			//this.port.onMessageExternal.removeListener(this.listener)
			this.listener = noop;
		}
	};

	module.exports = Transport;
	return module.exports;
});
$__System.registerDynamic('23', ['18', '19', '1c'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var MessageEvent = $__require('18');
	var Message = $__require('19');
	var environment = $__require('1c');

	var global = environment.global;

	function Transport(name) {
		this.port = new global.BroadcastChannel(name);
	}

	Transport.supported = Boolean(global.BroadcastChannel);
	Transport.EVENT_TYPE = 'message';

	Transport.prototype = {
		constructor: Transport,

		send: function (data) {
			var message = new Message(data);
			this.port.postMessage(message);
		},

		onMessageEvent: function (handler) {
			this.port.addEventListener(Transport.EVENT_TYPE, function (event) {
				var messageEvent = new MessageEvent(event);
				handler(messageEvent);
			});
		},

		close: function () {
			this.port.close();
		}
	};

	module.exports = Transport;
	return module.exports;
});
$__System.registerDynamic('18', ['1c'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var environment = $__require('1c');

	var window = environment.window;
	var EventConstructor = window.MessageEvent || Object;

	function MessageEvent(config) {
		config = config || {};
		var message = config.data || {};

		if (typeof message === 'string') {
			try {
				message = JSON.parse(message);
			} catch (err) {
				console.error(err, event);
			}
		}

		Object.defineProperties(this, {
			'type': {
				value: 'message',
				writable: false
			},
			'data': {
				value: message.data, //extract usefull data from a message
				writable: false
			},
			'timeStamp': {
				value: config.timeStamp || 0,
				writable: false
			},
			'origin': {
				value: config.origin || config.url || '',
				writable: false
			},
			'key': {
				value: message.key,
				writable: false
			},
			'sourceChannel': {
				value: message.sourceChannel,
				writable: false
			}
		});
	}

	MessageEvent.prototype = Object.create(EventConstructor.prototype, { constructor: { writable: true, configurable: true, value: MessageEvent } });

	module.exports = MessageEvent;
	return module.exports;
});
$__System.registerDynamic('21', [], true, function ($__require, exports, module) {
  'use strict';

  var define,
      global = this || self,
      GLOBAL = global;
  module.exports = function () {};
  return module.exports;
});
$__System.registerDynamic('24', ['21'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var noop = $__require('21');

	var DOMConstructor = typeof Node === 'function' ? Node : noop;

	module.exports = function (element) {
		return element instanceof DOMConstructor;
	};
	return module.exports;
});
$__System.registerDynamic('19', ['24'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var isDOMNode = $__require('24');

	/**
  * Message entity constructor
  * @param {*} data - any data to be transfered
  * @param {Object} [source] - source sent from
  */
	function Message(data, source) {
		source = source || {};
		this.data = data;
		this.key = source.key;
		this.sourceChannel = source.name;
	}

	Message.prototype.asJSON = function () {
		if (isDOMNode(this.data)) {
			throw new DOMException('Failed to execute "postMessage" on "CrossChannel": ' + this.data.constructor.name + ' object could not be cloned.', 'DataCloneError');
		}
		return JSON.stringify(this);
	};

	Message.prototype.toString = Message.prototype.asJSON;

	module.exports = Message;
	return module.exports;
});
$__System.registerDynamic('1a', [], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	module.exports = function generateRandomKey() {
		return Math.round(Math.random() * Math.pow(10, 15));
	};
	return module.exports;
});
$__System.registerDynamic('1d', ['1c'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var environment = $__require('1c');

	var global = environment.global;

	module.exports = {
		get origin() {
			var window = global.window;
			var location = window && window.location;
			var origin = location && (location.origin || location.protocol + '//' + location.host);
			return origin;
		},
		set origin(value) {}
	};
	return module.exports;
});
$__System.registerDynamic('1b', ['1c'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var environment = $__require('1c');

	module.exports = {
		isSameOrigin: function (win, currentWin) {
			try {
				if (win.location.origin) {
					if (environment.is.nw) {
						return true; //workaround for NWJS app when external origin have full privileges
					} else {
						return win.location.origin === currentWin.location.origin;
					}
				} else {
					return win.location.host === currentWin.location.host && win.location.protocol === currentWin.location.protocol;
				}
			} catch (err) {
				return false;
			}
		},

		getCrossOriginChildren: function getCrossOriginChildren(topWin) {
			var crossOriginFrames = [];
			var frames = topWin.frames;
			var currentWin = environment.global.window;
			var win;
			var i = frames.length;
			var isSameOrigin = module.exports.isSameOrigin;

			while (i--) {
				win = frames[i];
				if (!isSameOrigin(win, currentWin)) {
					crossOriginFrames.push(win);
				}
				//include deeper level frames
				crossOriginFrames = crossOriginFrames.concat(getCrossOriginChildren(win));
			}

			return crossOriginFrames;
		},

		getSameOriginChildren: function getSameOriginChildren(topWin) {
			var sameOriginFrames = [];
			var frames = topWin.frames;
			var currentWin = environment.global.window;
			var win;
			var i = frames.length;
			var isSameOrigin = module.exports.isSameOrigin;

			while (i--) {
				win = frames[i];
				if (isSameOrigin(win, currentWin)) {
					sameOriginFrames.push(win);
				}
				//include deeper level frames
				sameOriginFrames = sameOriginFrames.concat(getSameOriginChildren(win));
			}

			return sameOriginFrames;
		},

		/**
   * Returns a collection of all child frames/iframes windows objects. Takes into a count deeper nested frames.
   * @param [Window] topWin - Main document window, where to search child frames
   * @returns [Array] - Array of all child windows.
   */
		getAllChildren: function getAllChildren(topWin) {
			var childFrames = [];
			var frames = topWin.frames;
			var win;
			var i = frames.length;

			while (i--) {
				win = frames[i];
				childFrames.push(win);
				//include deeper level frames
				childFrames = childFrames.concat(getAllChildren(win));
			}

			return childFrames;
		},

		/**
   * Returns a collection of cross origin frames/iframes windows objects. Takes into a count deeper nested frames.
   * @param [Window] topWin - Main document window, where to search child frames
   * @returns [Array] - Array of same origin windows.
   */
		getSameOrigin: function (topWin) {
			var getSameOriginChildren = module.exports.getSameOriginChildren;
			var isSameOrigin = module.exports.isSameOrigin;
			var windows = getSameOriginChildren(topWin);
			var currentWin = environment.global.window;
			if (isSameOrigin(topWin, currentWin)) {
				windows.push(topWin);
			}
			return windows;
		},

		/**
   * Returns a collection of cross origin frames/iframes windows objects. Takes into a count deeper nested frames.
   * @param [Window] topWin - Main document window, where to search child frames
   * @returns [Array] - Array of cross origin child windows.
   */
		getCrossOrigin: function (topWin) {
			var getCrossOriginChildren = module.exports.getCrossOriginChildren;
			var isSameOrigin = module.exports.isSameOrigin;
			var windows = getCrossOriginChildren(topWin);
			var currentWin = environment.global.window;
			if (!isSameOrigin(topWin, currentWin)) {
				windows.push(topWin);
			}
			return windows;
		},

		getAll: function (topWin) {
			if (!topWin) {
				return [];
			}
			var children = module.exports.getAllChildren(topWin);
			var windows = [topWin].concat(children);
			return windows;
		}
	};
	return module.exports;
});
$__System.registerDynamic('25', ['18', '19', '1a', '1c', '1d', '1b'], true, function ($__require, exports, module) {
	'use strict';

	/* Known possible issues:
 1. IE dispathes events on a `document`. if ('v'=='\v') 
 2. Firefox dispatches event on `body`
 3. IE 8 doesn't have `key` and `newValue` properties in an event. if (document.documentMode < 9)
 4. In iOS event is not fired between tabs
 5. IE 10-11 dispatches event before storage modification and `newValue` is not new but old
 6. IE 10-11 doesn't dispatch event in frames of the second tab
 
 Links:
 * http://blogs.msdn.com/b/ieinternals/archive/2009/09/16/bugs-in-ie8-support-for-html5-postmessage-sessionstorage-and-localstorage.aspx
 */

	var define,
	    global = this || self,
	    GLOBAL = global;
	var MessageEvent = $__require('18');
	var Message = $__require('19');
	var generateRandomKey = $__require('1a');
	var environment = $__require('1c');
	var locationOrigin = $__require('1d').origin;
	var getOriginWindows = $__require('1b').getSameOrigin;

	var global = environment.global;
	var window = environment.window;
	var navigator = window.navigator;
	var document = window.document;
	var storageSupported = function () {
		try {
			return 'localStorage' in global && global.localStorage !== null;
		} catch (e) {
			return false;
		}
	}();
	var URL = typeof window.URL === 'function' && window.URL;
	var StorageEvent = window.StorageEvent || {};
	var edgeBrowser = navigator && 'msSaveBlob' in navigator && document && !('documentMode' in document); // && 'StyleMedia' in window

	//IE and Edge fix, Opera <=12 fix
	if (storageSupported && (typeof StorageEvent === 'object' || StorageEvent.length === 0)) {
		StorageEvent = function (eventType, params) {
			params = params || {};
			var event = document.createEvent('Event');
			event.initEvent('storage', false, false);
			event.key = params.key || '';
			event.oldValue = params.oldValue || '';
			event.newValue = params.newValue || '';
			event.url = params.url || '';
			event.storageArea = params.storageArea || null;
			return event;
		};
		StorageEvent.prototype = window.Event.prototype;
	}

	function Transport(name) {
		this.port1 = global.localStorage; // sessionStorage || globalStorage
		this.port2 = window; //document || body
		this.listener = null;
		this.name = name;
		this.key = generateRandomKey();
		this.latestEventData = undefined;
	}

	Transport.supported = Boolean(storageSupported);
	Transport.STORAGE_KEY = '__cross-channel_message';
	Transport.EVENT_TYPE = 'storage';

	Transport.prototype = {
		constructor: Transport,

		send: function (data) {
			var message = new Message(data, this);
			var port1 = this.port1;
			var port2 = this.port2;
			var messageJSON;
			var windows;
			var index;

			message.changeTrigger = generateRandomKey();
			messageJSON = message.asJSON();
			setTimeout(function () {
				var storageEvent = new StorageEvent(Transport.EVENT_TYPE, { newValue: messageJSON });
				try {
					port1.setItem(Transport.STORAGE_KEY, messageJSON);
				} catch (err) {
					console.error(err);
				}

				if (edgeBrowser) {
					// fix: Edge doesn't dispatch event in frames of the current window
					windows = getOriginWindows(port2.top);
					index = -1;
					while (++index in windows) {
						windows[index].dispatchEvent(storageEvent);
					}
				} else {
					port2.dispatchEvent(storageEvent);
				}
			}, 0);
		},

		onMessageEvent: function (handler) {
			var transport = this;
			var port2 = this.port2;
			function listener(event) {
				event.data = event.newValue;
				event.origin = URL && event.url && new URL(event.url).origin || locationOrigin; //fix for some specific issues when 'storage' event is dispached across origins
				var messageEvent = new MessageEvent(event);

				if ('key' in messageEvent && 'sourceChannel' in messageEvent && transport.name === messageEvent.sourceChannel // events on the same channel
				&& transport.key !== messageEvent.key // skip returned back events
				&& transport.latestEventData !== event.data && event.origin === locationOrigin) {
					transport.latestEventData = event.data; // fix: previous IE handles event twice
					handler(messageEvent);
				}
			}
			port2.removeEventListener(Transport.EVENT_TYPE, this.listener);
			port2.addEventListener(Transport.EVENT_TYPE, listener);
			this.listener = listener;
		},

		close: function () {
			this.port2.removeEventListener(Transport.EVENT_TYPE, this.listener);
			this.listener = null;
			this.latestEventData = undefined;
		}
	};

	module.exports = Transport;
	return module.exports;
});
$__System.registerDynamic('26', ['17', '1e', '1f', '20', '22', '23', '25'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var PostMessageCrossTransport = $__require('17');
	var PostMessageTransport = $__require('1e');
	var NwTransport = $__require('1f');
	var BlankTransport = $__require('20');
	var ExtensionTransport = $__require('22');
	var BroadcastChannelTransport = $__require('23');
	var StorageTransport = $__require('25');

	var SameOrigin = function () {
		switch (true) {
			case ExtensionTransport.supported:
				return ExtensionTransport;
			case BroadcastChannelTransport.supported:
				return BroadcastChannelTransport;
			case StorageTransport.supported:
				return StorageTransport;
			case NwTransport.supported:
				return NwTransport;
			case PostMessageTransport.supported:
				return PostMessageTransport;
			default:
				return BlankTransport;
		}
	}();

	var CrossOrigin = function () {
		switch (true) {
			case SameOrigin === PostMessageTransport:
				return BlankTransport;
			case PostMessageCrossTransport.supported:
				return PostMessageCrossTransport;
			default:
				return BlankTransport;
		}
	}();

	module.exports = {
		SameOrigin: SameOrigin,
		CrossOrigin: CrossOrigin
	};
	return module.exports;
});
$__System.registerDynamic('27', ['26'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var SameOriginTransport = $__require('26').SameOrigin;
	var CrossOriginTransport = $__require('26').CrossOrigin;

	function Channel(id) {
		this.sameTransport = new SameOriginTransport(id);
		this.crossTransport = new CrossOriginTransport(id);
	}

	Channel.prototype = {
		constructor: Channel,
		send: function (data) {
			this.sameTransport.send(data);
			this.crossTransport.send(data);
		},
		onMessageEvent: function (handler) {
			this.sameTransport.onMessageEvent(handler);
			this.crossTransport.onMessageEvent(handler);
		},
		close: function () {
			this.sameTransport.close();
			this.crossTransport.close();
		}
	};

	module.exports = Channel;
	return module.exports;
});
$__System.registerDynamic('1c', [], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var __filename = '..\\node_modules\\cross-channel\\src\\utils\\environment.js',
	    __dirname = '';
	!function (self, nodeGlobal, browserWindow, undefined) {
		var window = self.window || browserWindow || {};
		var location = window.location || {};
		var global = nodeGlobal || ('top' in window ? window.top.global || {} : {}); //NodeJS `global`
		//NodeJS context
		var isNode = 'process' in global && global.global === global && typeof __dirname !== 'undefined';
		// Node-webkit context
		var isNodeWebkit = 'process' in global && ('_nw_app' in global.process || '__node_webkit' in global.process || 'node-webkit' in global.process.versions);
		// NWJS context
		var isNW = 'process' in global && ('__nwjs' in global.process || 'nw' in global.process.versions);

		// var isExtension = (function(){
		// 	try {
		// 		return Boolean(window.top && window.top.location.protocol === 'chrome-extension:')
		// 	}
		// 	catch(err) {
		// 		return false
		// 	}
		// }())

		module.exports = {
			window: window,
			global: global,
			location: location,
			is: {
				node: isNode,
				nw: isNW,
				nodeWebkit: isNodeWebkit
				//extension: isExtension
			},
			undefined: undefined
		};
	}(this, typeof global !== 'undefined' ? global : null, typeof window !== 'undefined' ? window : null);
	return module.exports;
});
$__System.registerDynamic('28', ['16', '27', '1c'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var HandlersCollection = $__require('16');
	var Channel = $__require('27');
	var window = $__require('1c').window;

	function CrossChannel(name) {
		var crosschannel = this;
		if (!arguments.length) {
			throw new TypeError('Failed to construct \'CrossChannel\': 1 argument required, but only 0 present.');
		}
		if (!(this instanceof CrossChannel)) {
			throw new TypeError('Failed to construct \'CrossChannel\': Please use the \'new\' operator, this constructor cannot be called as a function.');
		}
		this.name = String(name);
		this.onmessage = null;
		this.closed = false;
		this.messageHandlers = new HandlersCollection();

		this.channel = new Channel(this.name);

		this.channel.onMessageEvent(function (event) {
			crosschannel.messageHandlers.handle(event);
			if (typeof crosschannel.onmessage === 'function') {
				crosschannel.onmessage(event);
			}
		});
	}

	CrossChannel.prototype = {
		constructor: CrossChannel,

		addEventListener: function (type, handler) {
			if (type === 'message') {
				this.messageHandlers.push(handler);
			}
		},

		removeEventListener: function (type, handler) {
			if (type === 'message') {
				this.messageHandlers.remove(handler);
			}
		},

		removeAllListeners: function () {
			this.messageHandlers.empty();
		},

		once: function (type, handler) {
			var crosschannel = this;
			function removeHandler() {
				crosschannel.messageHandlers.remove(handler);
				crosschannel.messageHandlers.remove(removeHandler);
			}
			if (type === 'message') {
				crosschannel.messageHandlers.push(handler);
				crosschannel.messageHandlers.push(removeHandler);
			}
		},

		postMessage: function (message) {
			if (!arguments.length) {
				throw new TypeError('Failed to execute \'postMessage\' on \'CrossChannel\': 1 argument required, but only 0 present.');
			}
			if (this.closed) {
				return;
			}
			this.channel.send(message);
		},

		close: function () {
			this.channel.close();
			this.messageHandlers.empty();
			this.closed = true;
		},

		valueOf: function () {
			return '[object CrossChannel]';
		}
	};

	//shortcut
	CrossChannel.prototype.on = CrossChannel.prototype.addEventListener;

	module.exports = CrossChannel;
	window.CrossChannel = CrossChannel;
	return module.exports;
});
$__System.registerDynamic('29', [], true, function ($__require, exports, module) {
	//Internal task scheduling
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var stack = [],
	    ids = {},
	    idCounter = 0,
	    implementation,
	    createTask,
	    cancelTask = function () {};

	if (typeof Promise !== 'undefined') {
		//use microtask
		createTask = function (callback) {
			new Promise(function (resolve, reject) {
				implementation = {
					reject: reject
				};
				resolve();
			}).then(callback)['catch'](function (err) {
				console.error(err);
			});
		};
		cancelTask = function () {
			implementation.reject();
		};
	} else {
		// fallback
		createTask = function (callback) {
			implementation = setTimeout(callback, 0);
		};
		cancelTask = function () {
			clearTimeout(implementation);
		};
	}

	//export
	exports.setAsync = function (taskFunc) {
		if (typeof taskFunc !== 'function') {
			return;
		}
		var id = idCounter++;
		ids[id] = taskFunc; //save reference to callback
		//If already has tasks, than just add new one. Execution is already scheduled.
		if (stack.length) {
			stack.push(taskFunc);
		}
		//Else add first task and schedule async execution.
		else {
				stack.push(taskFunc);
				createTask(function () {
					var task;
					while (stack.length) {
						task = stack.shift();
						task();
					}
				});
			}
		return id;
	};

	exports.clearAsync = function (id) {
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
			//cancel async operation if no functions to execute
			cancelTask();
		}
	};
	return module.exports;
});
$__System.registerDynamic('2a', [], true, function ($__require, exports, module) {
	'use strict';

	/**
  * Internal event constructor
  */

	var define,
	    global = this || self,
	    GLOBAL = global;
	var ConnexionEvent = function (origin) {
		this.emitter = origin && origin.emitter || '';
		this.scope = origin && origin.scope || '';
		this.type = origin && origin.type || '*';
		this.timeStamp = origin && 'timeStamp' in origin ? origin.timeStamp : new Date().getTime();
		this.detail = origin && origin.detail;
		this.detail = this.detail && typeof this.detail === 'object' ? this.detail : {};
	};

	//export
	module.exports = ConnexionEvent;
	return module.exports;
});
$__System.registerDynamic('2b', [], true, function ($__require, exports, module) {
	var define,
	    global = this || self,
	    GLOBAL = global;
	var __filename = 'environment.js',
	    __dirname = '';
	(function (self, nodeGlobal, browserWindow, undefined) {
		'use strict';

		var window = self.window || browserWindow || {};
		var location = window.location || {};
		var global = nodeGlobal || ('top' in window ? window.top.global || {} : {}); //NodeJS `global`
		var isNodeJs = 'require' in global && 'process' in global && typeof __dirname !== 'undefined' && global.global === global; //NodeJS context

		//export
		exports.window = window;
		exports.global = global;
		exports.location = location;
		exports.isNodeJs = isNodeJs;
		exports.undefined = undefined;
	})(this, typeof global !== 'undefined' ? global : null, typeof window !== 'undefined' ? window : null);
	return module.exports;
});
$__System.registerDynamic('2c', [], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var Observable = function (initialValue) {
		this.value = initialValue;
		this.observers = [];
	};

	Observable.prototype.emit = function (value) {
		var i = -1;
		var observers = this.observers;

		this.value = value;
		while (++i in observers) {
			observers[i](value);
		}
		return this;
	};

	Observable.prototype.listen = function (callback) {
		this.observers.push(callback);
		return this;
	};

	Observable.prototype.observe = function (callback) {
		this.observers.push(callback);
		callback(this.value);
		return this;
	};

	Observable.prototype.unsubscribe = function (callback) {
		var index;
		var observers = this.observers;
		//unsubscribe all
		if (callback === undefined) {
			observers.length = 0;
		}
		//unsubscribe a certain observer
		else {
				index = observers.indexOf(callback);
				while (~index) {
					observers.splice(index, 1);
					index = observers.indexOf(callback);
				}
			}
		return this;
	};

	module.exports = Observable;
	return module.exports;
});
$__System.registerDynamic('2d', [], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var create = Object.create;

	module.exports = function () {
		return create ? create(null) : {};
	};
	return module.exports;
});
$__System.registerDynamic("2e", [], false, function ($__require, $__exports, $__module) {
  var _retrieveGlobal = $__System.get("@@global-helpers").prepareGlobal($__module.id, null, null);

  (function ($__global) {
    (function (e) {
      function f(a, c) {
        function b(a) {
          if (!this || this.constructor !== b) return new b(a);this._keys = [];this._values = [];this._itp = [];this.objectOnly = c;a && v.call(this, a);
        }c || w(a, "size", { get: x });a.constructor = b;b.prototype = a;return b;
      }function v(a) {
        this.add ? a.forEach(this.add, this) : a.forEach(function (a) {
          this.set(a[0], a[1]);
        }, this);
      }function d(a) {
        this.has(a) && (this._keys.splice(b, 1), this._values.splice(b, 1), this._itp.forEach(function (a) {
          b < a[0] && a[0]--;
        }));return -1 < b;
      }function m(a) {
        return this.has(a) ? this._values[b] : void 0;
      }function n(a, c) {
        if (this.objectOnly && c !== Object(c)) throw new TypeError("Invalid value used as weak collection key");if (c != c || 0 === c) for (b = a.length; b-- && !y(a[b], c););else b = a.indexOf(c);return -1 < b;
      }function p(a) {
        return n.call(this, this._values, a);
      }function q(a) {
        return n.call(this, this._keys, a);
      }function r(a, c) {
        this.has(a) ? this._values[b] = c : this._values[this._keys.push(a) - 1] = c;return this;
      }function t(a) {
        this.has(a) || this._values.push(a);return this;
      }function h() {
        (this._keys || 0).length = this._values.length = 0;
      }function z() {
        return k(this._itp, this._keys);
      }function l() {
        return k(this._itp, this._values);
      }function A() {
        return k(this._itp, this._keys, this._values);
      }function B() {
        return k(this._itp, this._values, this._values);
      }function k(a, c, b) {
        var g = [0],
            e = !1;a.push(g);return { next: function () {
            var f,
                d = g[0];!e && d < c.length ? (f = b ? [c[d], b[d]] : c[d], g[0]++) : (e = !0, a.splice(a.indexOf(g), 1));return { done: e, value: f };
          } };
      }function x() {
        return this._values.length;
      }function u(a, c) {
        for (var b = this.entries();;) {
          var d = b.next();if (d.done) break;
          a.call(c, d.value[1], d.value[0], this);
        }
      }var b,
          w = Object.defineProperty,
          y = function (a, b) {
        return isNaN(a) ? isNaN(b) : a === b;
      };"undefined" == typeof WeakMap && (e.WeakMap = f({ "delete": d, clear: h, get: m, has: q, set: r }, !0));"undefined" != typeof Map && "function" === typeof new Map().values && new Map().values().next || (e.Map = f({ "delete": d, has: q, get: m, set: r, keys: z, values: l, entries: A, forEach: u, clear: h }));"undefined" != typeof Set && "function" === typeof new Set().values && new Set().values().next || (e.Set = f({ has: p, add: t, "delete": d, clear: h,
        keys: l, values: l, entries: B, forEach: u }));"undefined" == typeof WeakSet && (e.WeakSet = f({ "delete": d, add: t, clear: h, has: p }, !0));
    })("undefined" != typeof exports && "undefined" != typeof global ? global : window);
  })(this);

  return _retrieveGlobal();
});
$__System.registerDynamic('2f', ['29', '2a', '2b', '2c', '2d', '2e'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var setAsyncTask = $__require('29').setAsync;
	var ConnexionEvent = $__require('2a');
	var environment = $__require('2b');
	var Observable = $__require('2c');
	var pojo = $__require('2d');
	$__require('2e'); //WeakMap polyfill

	var isNodeJs = environment.isNodeJs;

	function createObserver(callback) {
		var observer = function (event) {
			callback(event.detail, event);
		};
		observer.callback = callback;
		return observer;
	}

	var Emitter = function () {
		this.subjects = pojo();
		this.subscriptions = pojo();
	};

	Emitter.prototype._ensureSubjectExists = function (name) {
		var subject = this.subjects[name];
		if (!subject) {
			subject = new Observable(new ConnexionEvent({ type: name, timeStamp: 0 }));
			this.subscriptions[name] = new WeakMap();
			this.subjects[name] = subject;
		}
		return subject;
	};

	Emitter.prototype._ensureSubjectDestroyed = function (name) {
		var subject = this.subjects[name];
		if (subject) {
			this.subscriptions[name] = undefined;
			this.subjects[name] = undefined;
		}
		return subject;
	};

	/**
  * Fires event.
  * @param {String} eventType - Event type
  * @param {Object} [detail] - Event details
  * @return {Object} - Fired event object
  */
	Emitter.prototype.emit = function (eventType, detail) {
		var subject;
		var commonSubject;
		var eventData = eventType;
		var event;

		//string+data pair as arguments
		if (typeof eventType === 'string' || eventType instanceof String) {
			event = new ConnexionEvent({
				type: eventType,
				detail: detail,
				scope: isNodeJs ? 'nodejs' : 'window',
				emitter: isNodeJs ? 'nodejs' : environment.global.name || '' //try to use window.name
			});
		}
		//event object as argument
		else if (typeof eventData === 'object' && !(eventData instanceof Array)) {
				event = new ConnexionEvent(eventData);
				eventType = event.type;
			}

		subject = this._ensureSubjectExists(eventType);
		commonSubject = this._ensureSubjectExists('*');

		//async emitment
		setAsyncTask(subject.emit.bind(subject, event));

		//async wildcard emitment
		if (eventType !== '*') {
			setAsyncTask(commonSubject.emit.bind(commonSubject, event));
		}
		return event;
	};

	/**
  * Adds event listeners.
  * @param {String} eventType - Event type
  * @param {Function} handler - Callback handler
  * @return {Object} - Observer object
  */
	Emitter.prototype.listen = function (eventType, handler) {
		return this.subscribe('listen', eventType, handler);
	};

	/**
  * Adds event observer.
  * @param {String} eventType - Event type
  * @param {Function} handler - Callback handler
  * @return {Object} - Observer object
  */
	Emitter.prototype.observe = function (eventType, handler) {
		return this.subscribe('observe', eventType, handler);
	};

	Emitter.prototype.subscribe = function (subscriberName, eventType, handler) {
		var listeners;
		var subject;
		var observer;
		var observers;
		//object variant
		if (typeof eventType === 'object' && eventType) {
			listeners = eventType;
			for (eventType in listeners) {
				this[subscriberName](eventType, listeners[eventType]);
			}
		}
		//eventtype-handler variant
		else if (eventType && handler) {
				subject = this._ensureSubjectExists(eventType);
				observer = createObserver(handler);
				subject[subscriberName](observer);

				observers = this.subscriptions[eventType].get(handler) || [];
				observers.push(observer);
				this.subscriptions[eventType].set(handler, observers);
			}
		return observer;
	};

	/**
  * Adds event handler.
  * @param {String} eventType - Event type
  * @param {Function} handler - Callback handler
  * @return {Object} - Emitter object
  */
	Emitter.prototype.unsubscribe = function (eventType, handler) {
		var listeners;
		var subject;
		var subjects;
		var observer;
		var observers;
		var i;
		//all listeners and all events
		if (!eventType && !handler) {
			subjects = this.subjects;
			for (eventType in subjects) {
				this.unsubscribe(eventType);
			}
		}
		//object variant
		else if (typeof eventType === 'object' && eventType) {
				listeners = eventType;
				for (eventType in listeners) {
					this.unsubscribe(eventType, listeners[eventType]);
				}
			}
			//all listeners of a given event
			else if (eventType && !handler) {
					subject = this.subjects[eventType];
					if (subject) {
						subject.unsubscribe();
						this._ensureSubjectDestroyed(eventType); //releases all subscriptions references
					}
				}
				//eventtype-handler variant
				else if (eventType && handler) {
						subject = this.subjects[eventType];
						//if (subject) {
						//	subject.unsubscribe(handler)
						//}


						listeners = this.subscriptions[eventType];
						if (listeners) {
							//if the second argument is an observer
							if ('callback' in handler) {
								observer = handler;
								handler = observer.callback;
								//remove handler
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
										//remove handler
										subject.unsubscribe(observer);
										observer.callback = undefined;
									}
									listeners.delete(handler);
								}
							}
						}
					}
		return this;
	};

	Emitter.prototype.once = function (subscriber, eventType, handler) {
		var emitter = this;
		var observer = subscriber.call(emitter, eventType, handler);
		function unsubscriber() {
			emitter.unsubscribe(eventType, unsubscriber);
			emitter.unsubscribe(eventType, observer);
		}
		subscriber.call(emitter, eventType, unsubscriber);
		return observer;
	};

	//export
	module.exports = Emitter;
	return module.exports;
});
$__System.registerDynamic('30', ['2f'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var Emitter = $__require('2f');

	var emitter = new Emitter();

	emitter.listen.once = function (eventType, handler) {
		return emitter.once(emitter.listen, eventType, handler);
	};
	emitter.observe.once = function (eventType, handler) {
		return emitter.once(emitter.listen, eventType, handler);
	};

	module.exports = emitter;
	return module.exports;
});
$__System.registerDynamic('31', ['28', '30'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var CrossChannel = $__require('28');

	var eventChannel = new CrossChannel('connexion-event');
	var setupChannel = new CrossChannel('connexion-setup');
	var setupResponseChannel = new CrossChannel('connexion-setup-response');

	var emitter = $__require('30');
	var emitterEmit = emitter.emit;

	//augment `emit`
	emitter.emit = function (type, detail) {
		var event = emitterEmit.call(emitter, type, detail);
		eventChannel.postMessage(event);
		return event;
	};

	function getSubjectsData() {
		var eventSubjects = emitter.subjects;
		var eventTypes = Object.keys(emitter.subjects);
		var subject;
		var eventType;
		var subjectsData = [];
		var index = -1;

		while (++index in eventTypes) {
			eventType = eventTypes[index];
			subject = eventSubjects[eventType];
			subjectsData.push({
				type: eventType,
				event: subject.value
			});
		}
		return subjectsData;
	}

	function setSubjectsData(messageEvent) {
		var subjectsData = messageEvent.data;
		var emitterSubjects = emitter.subjects;
		var index = -1;
		var data;
		var type;
		var event;
		var subject;
		var subjectValue;

		while (++index in subjectsData) {
			data = subjectsData[index];
			type = data.type;
			event = data.event;

			// skip 'wildcard event' declaretion. It will be defined in local instance dinamically by another event.
			if (type === '*') {
				continue;
			}
			// if event was never fired
			else if (!event.timeStamp) {
					continue;
				}
				// if an event is completely new or an event is later than a local event, then emit a newer event to update a value in listeners
				else if (!(type in emitterSubjects)) {
						emitterEmit.call(emitter, event);
					}
					// or an event is later than a local event, then emit a newer event to update a value in listeners
					else {
							subject = emitterSubjects[type];
							subjectValue = subject.value;
							if (event.timeStamp > subjectValue.timeStamp) {
								emitter.emit(event);
							}
						}
		}
	}

	/**
  * Invokes event in a current window.
  */
	function emitEvent(messageEvent) {
		var event = messageEvent.data;
		//use event object declaretion as a first parameter
		emitterEmit.call(emitter, event);
	}

	function sendSetupResponse() {
		var setup = getSubjectsData();
		setupResponseChannel.postMessage(setup);
	}

	function sendSetup() {
		var setup = getSubjectsData();
		setupChannel.postMessage(setup);
	}

	eventChannel.on('message', emitEvent);
	setupChannel.on('message', sendSetupResponse);
	setupChannel.on('message', setSubjectsData);
	setupResponseChannel.once('message', setSubjectsData);

	//send past events to other instances
	sendSetup();

	module.exports = {};
	return module.exports;
});
$__System.registerDynamic('1', ['2b', '30', '31'], true, function ($__require, exports, module) {
	'use strict';

	var define,
	    global = this || self,
	    GLOBAL = global;
	var window = $__require('2b').window;
	var emitter = $__require('30');
	$__require('31'); //include communication channel

	var GLOBAL_NAME = 'connexion';

	exports.version = '0.7.1';

	exports.listen = function (type, handler) {
		emitter.listen(type, handler);
		return this;
	};
	exports.observe = function (type, handler) {
		emitter.observe(type, handler);
		return this;
	};
	exports.listen.once = function (type, handler) {
		emitter.listen.once(type, handler);
		return this;
	};
	exports.observe.once = function (type, handler) {
		emitter.observe.once(type, handler);
		return this;
	};
	exports.unsubscribe = function (type, handler) {
		emitter.unsubscribe(type, handler);
		return this;
	};
	exports.emit = function (type, detail) {
		emitter.emit(type, detail);
		return this;
	};

	/**
  * Connexion public object.
  */
	window[GLOBAL_NAME] = exports;
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