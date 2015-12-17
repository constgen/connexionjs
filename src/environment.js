(function(self, nodeGlobal, browserWindow, undefined) {
	'use strict';

	var	window = self.window || browserWindow || {},
		document = window.document || {},
		location = window.location || {},
		global = nodeGlobal || (('top' in window) ? (window.top.global || {}) : {}), //NodeJS `global`
		isNodeJs = ('require' in global) && ('process' in global) && (typeof __dirname !== 'undefined') && (global.global === global); //NodeJS context

	//HTML polyfills
	if (!('head' in document)) {
		document.head = (document.getElementsByTagName && document.getElementsByTagName('head')[0]) || document.documentElement;
	}
	//support <template> and <content> polyfills
	if ('createElement' in document) {
		document.createElement('template');
		document.createElement('content');
	}

	//export
	exports.window = window;
	exports.global = global;
	exports.location = location;
	exports.isNodeJs = isNodeJs;
	exports.undefined = undefined;

}(this, (typeof global !== 'undefined') ? global : null, (typeof window !== 'undefined') ? window : null));