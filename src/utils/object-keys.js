'use strict'

module.exports = Object.keys || function (object) {
	var keys = []
	var key
	for (key in object) {
		keys.push(key)
	}
	return keys
}
