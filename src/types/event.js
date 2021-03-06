﻿'use strict'

/**
 * Internal event constructor
 */
var ConnexionEvent = function (origin) {
	this.emitter = origin && origin.emitter || ''
	this.scope = origin && origin.scope || ''
	this.type = (origin && origin.type) || '*'
	this.timeStamp = (origin && ('timeStamp' in origin)) ? origin.timeStamp : new Date().getTime()
	this.detail = origin && origin.detail
	this.detail = (this.detail && typeof this.detail === 'object') ? this.detail : {}
}

//export
module.exports = ConnexionEvent