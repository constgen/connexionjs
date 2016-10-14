'use strict'

var environment = require('../../src/environment.js')

describe('environment', function () {
	describe('has a correct interface', function () {
		it('"window" is an Object', function () {
			expect(environment.window).toEqual(jasmine.any(Object))
		})
		it('"global" is an Object', function () {
			expect(environment.global).toEqual(jasmine.any(Object))
		})
		it('"location" is an Object', function () {
			expect(environment.location).toEqual(jasmine.any(Object))
		})
		it('"isNodeJs" is a Boolean', function () {
			expect(environment.isNodeJs).toEqual(jasmine.any(Boolean))
		})
		it('"undefined" is undefined', function () {
			expect(environment.undefined).not.toBeDefined()
		})
	})
})

