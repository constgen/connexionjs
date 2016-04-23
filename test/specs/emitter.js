'use strict';

var emitter = require('../../src/emitter.js'),
	Event = require('../../src/event.js'),
	Observable = require('../../src/observable.js');

describe('event emitter', function () {
	var subject,
		callback = {
			handler1: function () { },
			handler2: function () { },
			handler3: function () { }
		},
		topic1 = 'event1',
		topic2 = 'event2',
		topic3 = 'event3',
		data1 = { a: 1, b: 2 },
		data2 = { c: 3, d: 4 },
		data3 = { e: 5, f: 6 },
		data4 = [7, 8, 9],
		data5 = undefined,
		data6 = null,
		data7 = true,
		data8 = false,
		WAIT_TIME = 10;

	function wait(callback) {
		return setTimeout(callback, WAIT_TIME);
	}

	beforeEach(function () {
		spyOn(callback, 'handler1')
		spyOn(callback, 'handler2')
		spyOn(callback, 'handler3')
		spyOn(emitter, 'unsubscribe').and.callThrough()
		spyOn(emitter, 'emit').and.callThrough()
		spyOn(emitter, 'observe').and.callThrough()
		spyOn(emitter, 'listen').and.callThrough()
	})

	afterEach(function () {
		var key;
		for (key in emitter.subjects) {
			delete emitter.subjects[key]
		}
		for (key in	emitter.subscriptions) {
			delete emitter.subscriptions[key]
		}
	})

	describe('has a correct interface', function () {
		it('emit()', function () {
			expect(emitter.emit).toEqual(jasmine.any(Function))
		})
		it('listen()', function () {
			expect(emitter.listen).toEqual(jasmine.any(Function))
		})
		it('observe()', function () {
			expect(emitter.observe).toEqual(jasmine.any(Function))
		})
		it('unsubscribe()', function () {
			expect(emitter.unsubscribe).toEqual(jasmine.any(Function))
		})
	})

	describe('method', function () {
		it('emit() returns event object', function () {
			var result = emitter.emit(topic1);
			expect(result).toEqual(jasmine.any(Event))
		})
		it('listen() returns observer', function () {
			var result = emitter.listen(topic1, callback.handler1);
			expect(result).toEqual(jasmine.any(Function))
			expect(result).not.toBe(callback.handler1)
		})
		it('observe() returns observer', function () {
			var result = emitter.observe(topic1, callback.handler1);
			expect(result).toEqual(jasmine.any(Function))
			expect(result).not.toBe(callback.handler1)
		})
		it('unsubscribe() returns context', function () {
			var result = emitter.unsubscribe(topic1);
			expect(result).toBe(emitter)
		})
	})

	it('emits events asynchronously', function (done) {
		emitter.listen(topic1, callback.handler1)
		emitter.emit(topic1, data1)
		emitter.listen(topic1, callback.handler2)

		expect(callback.handler1).not.toHaveBeenCalled()
		wait(function () {
			expect(callback.handler1).toHaveBeenCalled()
			expect(callback.handler2).toHaveBeenCalled()
			done()
		})
	})

	it('observes events synchronously on subscription', function (done) {
		emitter.observe(topic1, callback.handler1)
		emitter.emit(topic1, data1)
		emitter.observe(topic1, callback.handler2)

		expect(callback.handler1.calls.count()).toEqual(1)
		expect(callback.handler2.calls.count()).toEqual(1)
		wait(function () {
			expect(callback.handler1.calls.count()).toEqual(2)
			expect(callback.handler2.calls.count()).toEqual(2)
			done()
		})
	})

	it('has `{}` value by default', function (done) {
		emitter.listen(topic1, callback.handler1)
		emitter.emit(topic1)
		
		wait(function () {
			expect(callback.handler1.calls.mostRecent().args[0]).toEqual({})
			done()
		})
	})

	it('has a correct value', function (done) {
		emitter.listen(topic1, callback.handler1)
		emitter.observe(topic1, callback.handler2)
		emitter.emit(topic1, data1)
		
		wait(function () {
			expect(callback.handler1.calls.mostRecent().args[0]).toBe(data1)
			expect(callback.handler2.calls.mostRecent().args[0]).toBe(data1)
			done()
		})
	})

	it('has a correct event object', function (done) {
		emitter.listen(topic1, callback.handler1)
		emitter.observe(topic1, callback.handler2)
		emitter.emit(topic1, data1)

		wait(function () {
			expect(callback.handler1.calls.mostRecent().args[1]).toEqual(jasmine.any(Event))
			expect(callback.handler1.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({
				type: topic1,
				detail: data1
			}))
			expect(callback.handler2.calls.mostRecent().args[1]).toEqual(jasmine.any(Event))
			expect(callback.handler2.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({
				type: topic1,
				detail: data1
			}))
			done()
		})
	})

	it('can listen', function (done) {
		emitter.listen(topic1, callback.handler1)
		emitter.emit(topic1, data1)
		emitter.emit(topic1, data2)

		wait(function () {
			expect(callback.handler1).toHaveBeenCalled()
			expect(callback.handler1.calls.count()).toEqual(2)
			expect(callback.handler1.calls.argsFor(0)[0]).toBe(data1)
			expect(callback.handler1.calls.argsFor(1)[0]).toBe(data2)
			done()
		})
	})

	it('can observe', function (done) {
		emitter.observe(topic1, callback.handler1)
		emitter.emit(topic1, data1)
		emitter.emit(topic1, data2)
		emitter.observe(topic1, callback.handler2)

		wait(function () {
			emitter.observe(topic1, callback.handler3)

			expect(callback.handler1).toHaveBeenCalled()
			expect(callback.handler1.calls.count()).toEqual(3)
			expect(callback.handler1.calls.argsFor(0)[0]).toEqual({})
			expect(callback.handler1.calls.argsFor(1)[0]).toBe(data1)
			expect(callback.handler1.calls.argsFor(2)[0]).toBe(data2)

			expect(callback.handler2).toHaveBeenCalled()
			expect(callback.handler2.calls.count()).toEqual(3)
			expect(callback.handler2.calls.argsFor(0)[0]).toEqual({})
			expect(callback.handler2.calls.argsFor(1)[0]).toBe(data1)
			expect(callback.handler2.calls.argsFor(2)[0]).toBe(data2)

			expect(callback.handler3).toHaveBeenCalled()
			expect(callback.handler3.calls.count()).toEqual(1)
			expect(callback.handler3.calls.mostRecent().args[0]).toBe(data2)
			done()
		})
	})

	it('can listen different events', function (done) {
		emitter.listen(topic1, callback.handler1)
		emitter.listen(topic2, callback.handler2)
		emitter.emit(topic1, data1)
		emitter.emit(topic2, data2)

		wait(function () {
			expect(callback.handler1).toHaveBeenCalled()
			expect(callback.handler2).toHaveBeenCalled()
			done()
		})
	})

	it('can observe different events', function (done) {
		emitter.observe(topic1, callback.handler1)
		emitter.observe(topic2, callback.handler2)
		emitter.emit(topic1, data1)
		emitter.emit(topic2, data2)

		wait(function () {
			expect(callback.handler1).toHaveBeenCalled()
			expect(callback.handler2).toHaveBeenCalled()
			done()
		})
	})

	it('handles multiple subscriptions with the same observer', function (done) {
		emitter.listen(topic1, callback.handler1)
		emitter.observe(topic1, callback.handler1)
		emitter.listen(topic1, callback.handler1)
		emitter.emit(topic1, data1)

		wait(function () {
			expect(callback.handler1.calls.count()).toEqual(4)
			done()
		})
	})

	describe('can unsubscribe', function () {
		it('all subscriptions before the first emitment', function (done) {
			emitter.listen(topic1, callback.handler1)
			emitter.listen(topic1, callback.handler1)
			emitter.observe(topic1, callback.handler2)
			emitter.listen(topic2, callback.handler3)
			emitter.unsubscribe()
			emitter.emit(topic1, data1)
			emitter.emit(topic2, data1)
			emitter.emit(topic1, data2)

			wait(function () {
				expect(callback.handler1).not.toHaveBeenCalled()
				expect(callback.handler2.calls.count()).toEqual(1)
				expect(callback.handler3).not.toHaveBeenCalled()
				done()
			})
		})

		it('all subscriptions after the first emitment', function (done) {
			emitter.listen(topic1, callback.handler1)
			emitter.listen(topic1, callback.handler1)
			emitter.observe(topic1, callback.handler2)
			emitter.listen(topic2, callback.handler3)
			emitter.emit(topic1, data1)
			emitter.emit(topic2, data2)
			emitter.unsubscribe()
			emitter.emit(topic1, data3)
			emitter.emit(topic2, data3)
			emitter.emit(topic1, data2)
			
			wait(function () {
				expect(callback.handler1).not.toHaveBeenCalled()
				expect(callback.handler2.calls.count()).toEqual(1)
				expect(callback.handler3).not.toHaveBeenCalled()
				done()
			})
		})

		it('all subscriptions by an event name before the first emitment', function (done) {
			emitter.listen(topic1, callback.handler1)
			emitter.observe(topic1, callback.handler2)
			emitter.listen(topic1, callback.handler3)
			emitter.listen(topic2, callback.handler3)
			emitter.unsubscribe(topic1)
			emitter.emit(topic1)
			emitter.emit(topic2)

			wait(function () {
				expect(callback.handler1).not.toHaveBeenCalled()
				expect(callback.handler2.calls.count()).toEqual(1)
				expect(callback.handler3.calls.count()).toEqual(1)
				done()
			})
		})

		it('all subscriptions by an event name after the first emitment', function (done) {
			emitter.listen(topic1, callback.handler1)
			emitter.observe(topic1, callback.handler2)
			emitter.listen(topic1, callback.handler3)
			emitter.listen(topic2, callback.handler3)
			emitter.emit(topic1, data1)
			emitter.emit(topic1, data2)
			emitter.unsubscribe(topic1)
			emitter.emit(topic1)
			emitter.emit(topic2)

			wait(function () {
				expect(callback.handler1).not.toHaveBeenCalled()
				expect(callback.handler2.calls.count()).toEqual(1)
				expect(callback.handler3.calls.count()).toEqual(1)
				done()
			})
		})

		it('one listener before the first emitment', function (done) {
			emitter.listen(topic1, callback.handler1)
			emitter.listen(topic1, callback.handler2)
			emitter.unsubscribe(topic1, callback.handler1)
			emitter.emit(topic1, data1)

			wait(function () {
				expect(callback.handler1).not.toHaveBeenCalled()
				expect(callback.handler2).toHaveBeenCalled()
				done()
			})
		})

		it('one observer before the first emitment', function (done) {
			emitter.observe(topic1, callback.handler1)
			emitter.observe(topic1, callback.handler2)
			emitter.unsubscribe(topic1, callback.handler1)
			emitter.emit(topic1, data1)

			wait(function () {
				expect(callback.handler1.calls.count()).toEqual(1)
				expect(callback.handler2.calls.count()).toEqual(2)
				done()
			})
		})

		it('one listener after the first emitment', function (done) {
			emitter.listen(topic1, callback.handler1)
			emitter.listen(topic1, callback.handler2)
			emitter.emit(topic1, data1)
			emitter.unsubscribe(topic1, callback.handler1)
			emitter.emit(topic1, data2)

			wait(function () {
				expect(callback.handler1.calls.count()).toEqual(1)
				expect(callback.handler2.calls.count()).toEqual(2)
				done()
			})
		})

		it('one observer after the first emitment', function (done) {
			emitter.observe(topic1, callback.handler1)
			emitter.observe(topic1, callback.handler2)
			emitter.emit(topic1, data1)
			emitter.unsubscribe(topic1, callback.handler1)
			emitter.emit(topic1, data2)

			wait(function () {
				expect(callback.handler1.calls.count()).toEqual(2)
				expect(callback.handler2.calls.count()).toEqual(3)
				done()
			})
		})

		it('multiple subscriptions with the same observer', function (done) {
			emitter.listen(topic1, callback.handler1)
			emitter.listen(topic1, callback.handler1)
			emitter.observe(topic1, callback.handler1)
			emitter.observe(topic1, callback.handler1)
			emitter.unsubscribe(topic1, callback.handler1)

			callback.handler1.calls.reset()
			emitter.emit(topic1, data1)

			wait(function () {
				expect(callback.handler1).not.toHaveBeenCalled()
				done()
			})
		})
	})

	it('calls handlers in correct way', function (done) {
		var calls = [];
		callback.handler1.and.callFake(function () {
			calls.push('callback1')
		})
		callback.handler2.and.callFake(function () {
			calls.push('callback2')
		})
		callback.handler3.and.callFake(function () {
			calls.push('callback3')
		})

		emitter.listen(topic1, callback.handler1)
		emitter.observe(topic1, callback.handler2)
		emitter.listen(topic1, callback.handler3)
		emitter.emit(topic1)

		wait(function () {
			expect(calls).toEqual(['callback2', 'callback1', 'callback2', 'callback3'])
			done()
		})
	})
})

