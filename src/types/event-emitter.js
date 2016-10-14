'use strict';
var setAsyncTask = require('../asynctask.js').setAsync
var ConnexionEvent = require('./event.js')
var environment = require('../environment.js')
var Observable = require('./observable.js')

var isNodeJs = environment.isNodeJs

function createObserver(callback) {
	var observer = function (event) {
		callback(event.detail, event)
	}
	observer.callback = callback
	return observer
}

var Emitter = function () {
	this.subjects = Object.create(null)
	this.subscriptions = Object.create(null)
}

Emitter.prototype._ensureSubjectExists = function (name) {
	var subject = this.subjects[name]
	if (!subject) {
		subject = new Observable(new ConnexionEvent({ type: name, timeStamp: 0 }))
		this.subscriptions[name] = new WeakMap()
		this.subjects[name] = subject
	}
	return subject
}

Emitter.prototype._ensureSubjectDestroyed = function (name) {
	var subject = this.subjects[name]
	if (subject) {
		this.subscriptions[name] = undefined
		this.subjects[name] = undefined
	}
	return subject
};

/**
 * Fires event.
 * @param {String} eventType - Event type
 * @param {Object} [detail] - Event details
 * @return {Object} - Fired event object
 */
Emitter.prototype.emit = function (eventType, detail) {
	var subject
	var commonSubject
	var eventData = eventType
	var event

	//string+data pair as arguments
	if ((typeof eventType === 'string') || (eventType instanceof String)) {
		event = new ConnexionEvent({
			type: eventType,
			detail: detail,
			scope: isNodeJs ? 'nodejs' : 'window',
			emitter: isNodeJs ? 'nodejs' : (environment.global.name || '') //try to use window.name
		})
	}
	//event object as argument
	else if ((typeof eventData === 'object') && !(eventData instanceof Array)) {
		event = new ConnexionEvent(eventData)
		eventType = event.type
	}

	subject = this._ensureSubjectExists(eventType)
	commonSubject = this._ensureSubjectExists('*')

	//async emitment
	setAsyncTask(subject.emit.bind(subject, event))

	//async wildcard emitment
	if (eventType !== '*') {
		setAsyncTask(commonSubject.emit.bind(commonSubject, event))
	}
	return event
}

/**
 * Adds event listeners.
 * @param {String} eventType - Event type
 * @param {Function} handler - Callback handler
 * @return {Object} - Observer object
 */
Emitter.prototype.listen = function(eventType, handler) {
	return this.subscribe('listen', eventType, handler)
}

/**
 * Adds event observer.
 * @param {String} eventType - Event type
 * @param {Function} handler - Callback handler
 * @return {Object} - Observer object
 */
Emitter.prototype.observe = function(eventType, handler) {
	return this.subscribe('observe', eventType, handler)
}

Emitter.prototype.subscribe = function(subscriberName, eventType, handler) {
	var listeners
	var subject
	var observer
	var observers
	//object variant
	if (typeof eventType === 'object' && eventType) {
		listeners = eventType
		for (eventType in listeners) {
			this[subscriberName](eventType, listeners[eventType])
		}
	}
	//eventtype-handler variant
	else if (eventType && handler) {
		subject = this._ensureSubjectExists(eventType)
		observer = createObserver(handler)
		subject[subscriberName](observer)
		
		observers = this.subscriptions[eventType].get(handler) || []
		observers.push(observer);
		this.subscriptions[eventType].set(handler, observers)
	}
	return observer
}

/**
 * Adds event handler.
 * @param {String} eventType - Event type
 * @param {Function} handler - Callback handler
 * @return {Object} - Emitter object
 */
Emitter.prototype.unsubscribe = function (eventType, handler) {
	var listeners,
		subject,
		subjects,
		observer,
		observers,
		i;
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
			//setAsyncTask(subject.unsubscribe.bind(subject));
			this._ensureSubjectDestroyed(eventType); //releases all subscriptions references
		}
	}
	//eventtype-handler variant
	else if (eventType && handler) {
		subject = this.subjects[eventType];
		//if (subject) {
		//	subject.unsubscribe(handler);
		//}



		
		listeners = this.subscriptions[eventType];
		if (listeners) {
			//if the second argument is an observer
			if ('callback' in handler) {
				observer = handler;
				handler = observer.callback;
				//remove handler
				subject.unsubscribe(observer);
				//setAsyncTask(subject.unsubscribe.bind(subject, observer));
				observer.callback = undefined;

				observers = listeners.get(handler);
				if (observers) {
					i = observers.indexOf(observer);
					if (~i) {
						observers.splice(i, 1);
					}
				}
			}
			else {
				observers = listeners.get(handler);
				if (observers) {
					i = -1;
					while (++i in observers) {
						observer = observers[i];
						//remove handler
						subject.unsubscribe(observer);
						//setAsyncTask(subject.unsubscribe.bind(subject, observer));
						observer.callback = undefined;
					}
					listeners.delete(handler);
				}
			}
			
		}
		
	}
	return this; 
}

Emitter.prototype.once = function(subscriber, eventType, handler){
	var emitter = this
	var observer = subscriber.call(emitter, eventType, handler)
	subscriber.call(emitter, eventType, unsubscriber)
	function unsubscriber() {
		emitter.unsubscribe(eventType, unsubscriber)
		emitter.unsubscribe(eventType, observer)
	}
	return observer
}

//export
module.exports = Emitter