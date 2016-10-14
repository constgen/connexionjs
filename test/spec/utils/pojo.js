'use strict'

var pojo = require('../../../src/utils/pojo.js')

describe('utility pojo', function () {
	it('creates an object without a prototype', function () {
		var data = pojo()

		expect(typeof data).toEqual('object')
		expect(data instanceof Object).toBe(false)
		//expect(data).not.toEqual(jasmine.any(Object))
	})

	xit('creates a POJO that is empty', function () {
		var data = pojo()
		expect(data).toEqual({})
	})
	
	it('creates POJOs that are different instances', function () {
		var data1 = pojo()
		var data2 = pojo()
		expect(data1).not.toBe(data2)
	})
})