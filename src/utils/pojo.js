'use strict'

var create = Object.create

module.exports = function(){
	return create ? create(null) : {}
}