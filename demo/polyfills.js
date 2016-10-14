// Function bind
(function() { }).bind || (Function.prototype.bind = function(a) { if (typeof this !== "function") { throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable") } var e = Array.prototype.slice.call(arguments, 1), d = this, b = function() { }, c = function() { return d.apply(this instanceof b && a ? this : a, e.concat(Array.prototype.slice.call(arguments))) }; b.prototype = this.prototype; c.prototype = new b(); return c });
// Array indexOf
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
