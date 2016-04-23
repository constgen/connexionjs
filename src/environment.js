(function(self, nodeGlobal, browserWindow, undefined) {
	'use strict';

	var	window = self.window || browserWindow || {},
		location = window.location || {},
		global = nodeGlobal || (('top' in window) ? (window.top.global || {}) : {}), //NodeJS `global`
		isNodeJs = ('require' in global) && ('process' in global) && (typeof __dirname !== 'undefined') && (global.global === global); //NodeJS context

	//export
	exports.window = window;
	exports.global = global;
	exports.location = location;
	exports.isNodeJs = isNodeJs;
	exports.undefined = undefined;
}(this, (typeof global !== 'undefined') ? global : null, (typeof window !== 'undefined') ? window : null));