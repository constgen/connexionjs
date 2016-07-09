'format cjs';
'use strict';

/**
 * Connexion public object.
 */
var connexion = exports;

//include polyfills
require('./polyfills/polyfills.js');
require('es6-collections');

connexion.version = '0.4.2';

connexion.chanel = require('./postmessage.channel.js');

var DOMWindow = require('./environment.js').window,
	emitter = require('./emitter.js');

connexion.listen = function (type, handler) {
	emitter.listen(type, handler);
	return this;
};
connexion.observe = function (type, handler) {
	emitter.observe(type, handler);
	return this;
};
connexion.unsubscribe = function (type, handler) {
	emitter.unsubscribe(type, handler);
	return this;
};
connexion.emit = function (type, detail) {
	emitter.emit(type, detail);
	return this;
};

DOMWindow.connexion = connexion;
