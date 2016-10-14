'use strict';
var Emitter = require('./types/event-emitter.js')

var emitter = new Emitter()


emitter.listen.once = function(eventType, handler){
	return emitter.once(emitter.listen, eventType, handler)
}
emitter.observe.once = function(eventType, handler){
	return emitter.once(emitter.listen, eventType, handler)
}


module.exports = emitter
