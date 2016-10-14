'format cjs';
'use strict';

var window = require('./environment.js').window
var emitter = require('./emitter.js')
require('./channel.js') //include communication channel

var GLOBAL_NAME = 'connexion'

exports.version = '0.6.0';

exports.listen = function (type, handler) {
	emitter.listen(type, handler)
	return this
}
exports.observe = function (type, handler) {
	emitter.observe(type, handler)
	return this
}
exports.listen.once = function (type, handler) {
	emitter.listen.once(type, handler)
	return this
}
exports.observe.once = function (type, handler) {
	emitter.observe.once(type, handler)
	return this
}
exports.unsubscribe = function (type, handler) {
	emitter.unsubscribe(type, handler)
	return this
}
exports.emit = function (type, detail) {
	emitter.emit(type, detail)
	return this
}

/**
 * Connexion public object.
 */
window[GLOBAL_NAME] = exports
