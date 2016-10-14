'use strict';

var Observable = function (initialValue) {
	this.value = initialValue
	this.observers = []
};

Observable.prototype.emit = function (value) {
	var i = -1
   var observers = this.observers

	this.value = value
	while (++i in observers) {
		observers[i](value)
	}
	return this
};

Observable.prototype.listen = function (callback) {
	this.observers.push(callback)
	return this
};

Observable.prototype.observe = function (callback) {
	this.observers.push(callback)
	callback(this.value)
	return this
};

Observable.prototype.unsubscribe = function (callback) {
	var index
	//unsubscribe all
	if (callback === undefined) {
		this.observers.length = 0
	}
	//unsubscribe a certain observer
	else {
		index = this.observers.indexOf(callback)
		while (~index) {
			this.observers.splice(index, 1)
			index = this.observers.indexOf(callback)
		}
	}
	return this
};

module.exports = Observable