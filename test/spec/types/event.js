'use strict'

var ConnexionEvent = require('../../../src/types/event.js')

describe('event', function () {
	var message
	var emptyEvent
	var messageEvent

	beforeEach(function(){
		message = {
			type: 'test',
			emitter: 'system',
			detail: {
				a: 1,
				b: 2
			}
		}
		emptyEvent = new ConnexionEvent()
		messageEvent = new ConnexionEvent(message)
	})

	it('is a constructor', function () {
		expect(emptyEvent).toEqual(jasmine.any(ConnexionEvent))
		expect(messageEvent).toEqual(jasmine.any(ConnexionEvent))
	})

	describe('if argument is not passed, has correct property', function () {
		it('emitter', function () {
			expect(emptyEvent.emitter).toBe('')
		})
		it('type', function () {
			expect(emptyEvent.type).toBe('*')
		})
		it('timeStamp', function () {
			expect(typeof emptyEvent.timeStamp).toBe('number')
			//expect(emptyEvent.timeStamp).toBe(new Date().getTime())
		})
		it('detail', function () {
			expect(emptyEvent.detail).toEqual({})
		})
	})

	describe('has correct values if Event is passed as argument', function () {
		it('emitter', function () {
			expect(messageEvent.emitter).toBe(message.emitter)
		})
		it('type', function () {
			expect(messageEvent.type).toBe(message.type)
		})
		it('timeStamp', function () {
			expect(typeof messageEvent.timeStamp).toBe('number')
			//expect(messageEvent.timeStamp).toBe(new Date().getTime())
		})
		it('detail', function () {
			expect(messageEvent.detail).toEqual(message.detail)
		})
	})

	xit('accespts only object as a detail', function(){

	})
})

