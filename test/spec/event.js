'use strict';

var ConnexionEvent = require('../../src/event.js');

describe('event', function () {
	var message = {
		type: 'test',
		emitter: 'system',
		detail: {
			a: 1,
			b: 2
		}
	}

	it('is a constructor', function () {
		var defaultEvent = new ConnexionEvent();
		var messageEvent = new ConnexionEvent(message);
		expect(defaultEvent).toEqual(jasmine.any(ConnexionEvent))
		expect(messageEvent).toEqual(jasmine.any(ConnexionEvent))
	})

	describe('if argument is not passed, has correct property', function () {
		var event = new ConnexionEvent();

		it('emitter', function () {
			expect(event.emitter).toBe('')
		})
		it('isCanceled', function () {
			expect(event.isCanceled).toBe(false)
		})
		it('type', function () {
			expect(event.type).toBe('*')
		})
		it('timeStamp', function () {
			expect(typeof event.timeStamp).toBe('number')
			//expect(event.timeStamp).toBe(new Date().getTime())
		})
		it('detail', function () {
			expect(event.detail).toEqual({})
		})
		it('key', function () {
			expect(event.key).toEqual(ConnexionEvent.key)
		})
	})

	describe('has correct values if Event is passed as argument', function () {
		var event = new ConnexionEvent(message);

		it('emitter', function () {
			expect(event.emitter).toBe(message.emitter)
		})
		it('isCanceled', function () {
			expect(event.isCanceled).toBe(false)
		})
		it('type', function () {
			expect(event.type).toBe(message.type)
		})
		it('timeStamp', function () {
			expect(typeof event.timeStamp).toBe('number')
			//expect(event.timeStamp).toBe(new Date().getTime())
		})
		it('detail', function () {
			expect(event.detail).toEqual(message.detail)
		})
		it('key', function () {
			expect(event.key).toEqual(ConnexionEvent.key)
		})
	})

	it('can be canceled', function () {
		var event = new ConnexionEvent();
		event.cancel()

		expect(event.isCanceled).toBe(true)
	});

});

