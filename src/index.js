'format cjs';
'use strict';

/**
 * Connexion public object.
 */
var connexion = exports;

connexion.version = '0.2.3';

//Node webkit patch. Should be removed in the future
//require('./emitter.nw');

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
