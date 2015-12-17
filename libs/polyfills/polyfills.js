// Array forEach
[].forEach || (Array.prototype.forEach = function(g, b) { if (this == null) { throw new TypeError("this is null or not defined") } var d, c, e, f = Object(this), a = f.length >>> 0; if ({}.toString.call(g) != "[object Function]") { throw new TypeError(g + " is not a function") } if (b) { d = b } c = 0; while (c < a) { if (c in f) { e = f[c]; g.call(d, e, c, f) } c++ } });
// Array map
[].map || (Array.prototype.map = function(i, h) { if (this == null) { throw new TypeError("this is null or not defined") } if ({}.toString.call(i) != "[object Function]") { throw new TypeError(i + " is not a function") } var b, a, c, d, g, f = Object(this), e = f.length >>> 0; h && (b = h); a = new Array(e); c = 0; while (c < e) { if (c in f) { d = f[c]; g = i.call(b, d, c, f); a[c] = g } c++ } return a });
// Array filter
[].filter || (Array.prototype.filter = function(b) { if (this == null) { throw new TypeError("this is null or not defined") } if (typeof b != "function") { throw new TypeError(b + " is not a function") } var f = Object(this), a = f.length >>> 0, e = [], d = arguments[1], c, g; for (c = 0; c < a; c++) { if (c in f) { g = f[c]; if (b.call(d, g, c, f)) { e.push(g) } } } return e });
// Array some
[].some || (Array.prototype.some = function(b) { if (this == null) { throw new TypeError("this is null or not defined") } if (typeof b != "function") { throw new TypeError(b + " is not a function") } var e = Object(this), a = e.length >>> 0, d = arguments[1], c; for (c = 0; c < a; c++) { if (c in e && b.call(d, e[c], c, e)) { return true } } return false });
// Function bind
(function() { }).bind || (Function.prototype.bind = function(a) { if (typeof this !== "function") { throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable") } var e = Array.prototype.slice.call(arguments, 1), d = this, b = function() { }, c = function() { return d.apply(this instanceof b && a ? this : a, e.concat(Array.prototype.slice.call(arguments))) }; b.prototype = this.prototype; c.prototype = new b(); return c });
//Object create
Object.create = Object.create || (function() { function F() { } return function(o) { if (arguments.length != 1) { throw new Error("Object.create implementation only accepts one parameter.") } F.prototype = o; return new F() } }());

//Object keys
if (!Object.keys) {
	Object.keys = (function() {
		'use strict';
		var hasOwnProperty = Object.prototype.hasOwnProperty,
			hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
			dontEnums = [
			  'toString',
			  'toLocaleString',
			  'valueOf',
			  'hasOwnProperty',
			  'isPrototypeOf',
			  'propertyIsEnumerable',
			  'constructor'
			],
			dontEnumsLength = dontEnums.length;

		return function(obj) {
			if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
				throw new TypeError('Object.keys called on non-object');
			}

			var result = [], prop, i;

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
		};
	};
};

//requestAnimationFrame
(function(self) {
	'use strict'
	var requestAnimationFrame = self.requestAnimationFrame,
		cancelAnimationFrame = self.cancelAnimationFrame,
		lastTime = 0,
		vendors = ['webkit', 'moz', 'ms'],
		x;
	for (x = 0; x < vendors.length && !requestAnimationFrame; ++x) {
		requestAnimationFrame = self[vendors[x] + 'RequestAnimationFrame'];
		cancelAnimationFrame = self[vendors[x] + 'CancelAnimationFrame'] || self[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!requestAnimationFrame) {
		requestAnimationFrame = function(callback) {
			var currTime = new Date().getTime(),
				timeToCall = Math.max(0, 16 - (currTime - lastTime)),
				id = self.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);

			lastTime = currTime + timeToCall;
			return id;
		};
	}
	if (!cancelAnimationFrame) {
		cancelAnimationFrame = function(id) {
			clearTimeout(id);
		}
	}
	self.requestAnimationFrame = requestAnimationFrame;
	self.cancelAnimationFrame = cancelAnimationFrame;
}(this));

if ("document" in self && !("classList" in document.createElement("_"))) { (function(j) { "use strict"; if (!("Element" in j)) { return } var a = "classList", f = "prototype", m = j.Element[f], b = Object, k = String[f].trim || function() { return this.replace(/^\s+|\s+$/g, "") }, c = Array[f].indexOf || function(q) { var p = 0, o = this.length; for (; p < o; p++) { if (p in this && this[p] === q) { return p } } return -1 }, n = function(o, p) { this.name = o; this.code = DOMException[o]; this.message = p }, g = function(p, o) { if (o === "") { throw new n("SYNTAX_ERR", "An invalid or illegal string was specified") } if (/\s/.test(o)) { throw new n("INVALID_CHARACTER_ERR", "String contains an invalid character") } return c.call(p, o) }, d = function(s) { var r = k.call(s.getAttribute("class") || ""), q = r ? r.split(/\s+/) : [], p = 0, o = q.length; for (; p < o; p++) { this.push(q[p]) } this._updateClassName = function() { s.setAttribute("class", this.toString()) } }, e = d[f] = [], i = function() { return new d(this) }; n[f] = Error[f]; e.item = function(o) { return this[o] || null }; e.contains = function(o) { o += ""; return g(this, o) !== -1 }; e.add = function() { var s = arguments, r = 0, p = s.length, q, o = false; do { q = s[r] + ""; if (g(this, q) === -1) { this.push(q); o = true } } while (++r < p); if (o) { this._updateClassName() } }; e.remove = function() { var t = arguments, s = 0, p = t.length, r, o = false; do { r = t[s] + ""; var q = g(this, r); if (q !== -1) { this.splice(q, 1); o = true } } while (++s < p); if (o) { this._updateClassName() } }; e.toggle = function(p, q) { p += ""; var o = this.contains(p), r = o ? q !== true && "remove" : q !== false && "add"; if (r) { this[r](p) } return !o }; e.toString = function() { return this.join(" ") }; if (b.defineProperty) { var l = { get: i, enumerable: true, configurable: true }; try { b.defineProperty(m, a, l) } catch (h) { if (h.number === -2146823252) { l.enumerable = false; b.defineProperty(m, a, l) } } } else { if (b[f].__defineGetter__) { m.__defineGetter__(a, i) } } }(self)) };