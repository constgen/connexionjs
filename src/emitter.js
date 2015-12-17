'use strict';
var setAsyncTask = require('./asynctask.js').setAsyncTask,
	ConnexionEvent = require('./event.js'),
	environment = require('./environment.js'),
	EventStream = require('./stream.js'),
	es6collections = require('es6-collections'),
	WeakMap = es6collections.WeakMap || environment.global.WeakMap,
	isNodeJs = environment.isNodeJs;

function createObserver(callback) {
	var observer;
	observer = function (event) {
		if (event.isCanceled) {
			return; //EXIT
		}
		callback(event.detail, event);
	};
	return observer;
}

function createAsyncObserver(callback) {
	var observer;
	observer = function (event) {
		if (event.isCanceled) {
			return; //EXIT
		}
		setAsyncTask(function () {
			callback(event.detail, event);
		});
	};
	return observer;
}

function ensureStreamExists(emitter, name) {
	var stream = emitter.subjects[name];
	if (!stream) {
		stream = new EventStream(new ConnexionEvent({ type: name, timeStamp: 0}));
		emitter.subscriptions[name] = new WeakMap();
		emitter.subjects[name] = stream;
	}
	return stream;
}

function ensureStreamDestroyed(emitter, name) {
	var stream = emitter.subjects[name];
	if (stream) {
		emitter.subscriptions[name] = null;
		emitter.subjects[name] = null;
	}
	return stream;
}

var Emitter = function () {
	this.subjects = Object.create(null);
	this.subscriptions = Object.create(null);
};

/**
 * Generates global event in Core with attached details.
 * @param {String} eventType Event type.
 * @param {Object} [detail] Details.
 * @return {Object} Host object
 */
Emitter.prototype.emit = function (eventType, detail) {
	var stream,
		commonStream,
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

	stream = ensureStreamExists(this, eventType);
	commonStream = ensureStreamExists(this, '*');

	//async emitment
	setAsyncTask(stream.emit.bind(stream, event));

	//async wildcard emitment
	if (eventType !== '*') {
		setAsyncTask(commonStream.emit.bind(commonStream, event));
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
	return;
	var listeners,
		stream,
		observer,
		subscription;
	//object variant
	if (typeof eventType === 'object' && eventType) {
		listeners = eventType;
		for (eventType in listeners) {
			this.listen(eventType, listeners[eventType]);
		}
	}
	//eventtype-handler variant
	else if (eventType && handler) {
		stream = ensureStreamExists(this, eventType);
		observer = createObserver(handler);
		subscription = stream.listen(observer);
		listeners = this.subscriptions[eventType].get(handler) || [];
		listeners.push(subscription);
		this.subscriptions[eventType].set(handler, listeners);
		subscription.callback = handler;
	}
	return subscription;
};

/**
 * 1
 */
Emitter.prototype.observe = function(eventType, handler) {
	return;
	var listeners,
		stream,
		observer,
		subscription;
	//object variant
	if (typeof eventType === 'object' && eventType) {
		listeners = eventType;
		for (eventType in listeners) {
			this.listen(eventType, listeners[eventType]);
		}
	}
	//eventtype-handler variant
	else if (eventType && handler) {
		stream = ensureStreamExists(this, eventType);
		//async observing
		observer = createAsyncObserver(handler);
		subscription = stream.observe(observer);
		listeners = this.subscriptions[eventType].get(handler) || [];
		listeners.push(subscription);
		this.subscriptions[eventType].set(handler, listeners);
		subscription.callback = handler;
	}
	return subscription;
};

/**
 * 1
 */
Emitter.prototype.unsubscribe = function (eventType, handler) {
	var listeners,
		stream,
		streams,
		subscription,
		subscriptions,
		i;
	//all listeners and all events
	if (!eventType && !handler) {
		streams = this.subjects;
		for (eventType in streams) {
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
		stream = this.subjects[eventType];
		if (stream) {
			//finish old stream
			stream.dispose();
			ensureStreamDestroyed(this, eventType); //releases all subscriptions references
		}
	}
	//eventtype-handler variant
	else if (eventType && handler) {
		subscriptions = this.subscriptions[eventType];
		if (subscriptions) {
			//if the second argument is a disposable object
			if ('dispose' in handler) {
				subscription = handler;
				handler = subscription.callback;
				//remove handler
				subscription.dispose();
				subscription.callback = undefined;

				listeners = subscriptions.get(handler);
				if (listeners) {
					i = -1;
					while (++i in listeners) {
						if (subscription === listeners[i]) {
							//clear reference				
							listeners.splice(i, 1);			
							break;
						}
					}
				}
			}
			else {
				listeners = subscriptions.get(handler);
				if (listeners) {
					i = -1;
					while (++i in listeners) {
						subscription = listeners[i];
						//remove handler
						subscription.dispose();
						subscription.callback = undefined;
					}
					subscriptions.delete(handler);
				}
			}
			
		}
	}
	return this; 
};


//export
module.exports = new Emitter();
