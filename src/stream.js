'use strict';

var Rx = require('rx-lite');

var EventStream = function (initialValue) {
	this.observable = new Rx.BehaviorSubject(initialValue);
	this.event = this.observable.publish();
	this.event.connect();
};

EventStream.prototype.emit = function (detail) {
	return this.observable.onNext(detail);
};

EventStream.prototype.listen = function (callback) {
	return this.event.subscribe(callback);
};

EventStream.prototype.observe = function (callback) {
	return this.observable.subscribe(callback);
};

EventStream.prototype.dispose = function () {
	this.observable.onCompleted();
	return this.observable.dispose();
};

module.exports = EventStream;