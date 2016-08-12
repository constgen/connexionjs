'use strict';
var setAsyncTask = require('./asynctask.js').setAsync,
	ConnexionEvent = require('./event.js'),
	environment = require('./environment.js'),
	Observable = require('./observable.js'),
	once = require('./once.js'),
	isNodeJs = environment.isNodeJs;

function createObserver(callback) {
	var observer = function (event) {
		callback(event.detail, event);
	};
	observer.callback = callback;
	return observer;
}

var Emitter = function () {
	this.subjects = Object.create(null);
	this.subscriptions = Object.create(null);
};

Emitter.prototype._ensureSubjectExists = function (name) {
	var subject = this.subjects[name];
	if (!subject) {
		subject = new Observable(new ConnexionEvent({ type: name, timeStamp: 0 }));
		this.subscriptions[name] = new WeakMap();
		this.subjects[name] = subject;
	}
	return subject;
};

Emitter.prototype._ensureSubjectDestroyed = function (name) {
	var subject = this.subjects[name];
	if (subject) {
		this.subscriptions[name] = undefined;
		this.subjects[name] = undefined;
	}
	return subject;
};

/**
 * Generates global event in Core with attached details.
 * @param {String} eventType Event type.
 * @param {Object} [detail] Details.
 * @return {Object} Host object
 */
Emitter.prototype.emit = function (eventType, detail) {
	var subject,
		commonSubject,
		eventData = eventType,
		event;

	//string+data pair as arguments
	if ((typeof eventType === 'string') || (eventType instanceof String)) {
		event = new ConnexionEvent({
			type: eventType,
			detail: detail,
			scope: isNodeJs ? 'nodejs' : 'window',
			emitter: isNodeJs ? 'nodejs' : (environment.global.name || '') //try to use window.name
		});
	}
	//event object as argument
	else if ((typeof eventData === 'object') && !(eventData instanceof Array)) {
		event = new ConnexionEvent(eventData);
		eventType = event.type;
	}

	subject = this._ensureSubjectExists(eventType);
	commonSubject = this._ensureSubjectExists('*');

	//async emitment
	setAsyncTask(subject.emit.bind(subject, event));

	//async wildcard emitment
	if (eventType !== '*') {
		setAsyncTask(commonSubject.emit.bind(commonSubject, event));
	}
	return event;
};

/**
 * Adds Core event listeners in runtime. This is an alternative way to add listener of Core events.
 * @param {String} eventType Event type.
 * @param {Function} handler Callback handler.
 * @return {Object} Host object
 */
Emitter.prototype.listen = function(eventType, handler) {
	var listeners,
		subject,
		observer,
		observers;
	//object variant
	if (typeof eventType === 'object' && eventType) {
		listeners = eventType;
		for (eventType in listeners) {
			this.listen(eventType, listeners[eventType]);
		}
	}
	//eventtype-handler variant
	else if (eventType && handler) {
		subject = this._ensureSubjectExists(eventType);
		observer = createObserver(handler);
		subject.listen(observer);
							
		observers = this.subscriptions[eventType].get(handler) || [];
		observers.push(observer);
		this.subscriptions[eventType].set(handler, observers);
	}
	return observer;
};

/**
 * 1
 */
Emitter.prototype.observe = function(eventType, handler) {
	var listeners,
		subject,
		observer,
		observers;
	//object variant
	if (typeof eventType === 'object' && eventType) {
		listeners = eventType;
		for (eventType in listeners) {
			this.observe(eventType, listeners[eventType]);
		}
	}
	//eventtype-handler variant
	else if (eventType && handler) {
		subject = this._ensureSubjectExists(eventType);
		//async observing
		observer = createObserver(handler);
		subject.observe(observer);
		
		observers = this.subscriptions[eventType].get(handler) || [];
		observers.push(observer);
		this.subscriptions[eventType].set(handler, observers);
	}
	return observer;
};

/**
 * 1
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
};

Emitter.prototype.listen.once = once;
Emitter.prototype.observe.once = once;

//export
module.exports = new Emitter();
