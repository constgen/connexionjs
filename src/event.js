'use strict';

/**
 * Internal event constructor
 */
var ConnexionEvent = function (origin) {
	this.emitter = origin && origin.emitter || '';
	this.scope = origin && origin.scope || '';
	this.isCanceled = false;
	this.type = (origin && origin.type) || '*';
	this.timeStamp = (origin && ('timeStamp' in origin)) ? origin.timeStamp : new Date().getTime();
	this.detail = origin && origin.detail; 
	this.detail = (this.detail && typeof this.detail === 'object') ? this.detail : {};
	this.key = ConnexionEvent.key;
};

//Remove Object inheritance to be possible to convert to JSON
//ConnexionEvent.prototype = Object.create(null);

ConnexionEvent.prototype.cancel = function () {
	this.isCanceled = true;
};

//Random id, that defines Connexion instance, where Event was created.
ConnexionEvent.key = Math.round(Math.random() * Math.pow(10, 15));

//export
module.exports = ConnexionEvent;