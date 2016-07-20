'use strict'

var emitter

function once(eventType, handler) {
	emitter = emitter || require('./emitter.js')
	var observer = this.call(emitter, eventType, handler)
	this.call(emitter, eventType, function unsubscriber() {
		emitter.unsubscribe(eventType, unsubscriber)
		emitter.unsubscribe(eventType, observer)
	})
}

module.exports = once