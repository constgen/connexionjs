'use strict';

var Observable = require('../../src/observable.js');

describe('observable', function () {
    var subject,
		callback = {
			handler1: function () { },
			handler2: function () { },
			handler3: function () { }
		},
		data1 = { a: 1, b: 2 },
		data2 = { c: 3, d: 4 },
		data3 = { e: 5, f: 6 },
		data4 = [7,8,9],
		data5 = undefined,
		data6 = null,
		data7 = true,
		data8 = false,
		WAIT_TIME = 10;

	function wait(callback) {
		return setTimeout(callback, WAIT_TIME);
	}
	
    beforeEach(function(){
        subject = new Observable()
		spyOn(callback, 'handler1')
		spyOn(callback, 'handler2')
		spyOn(callback, 'handler3')
		spyOn(subject, 'unsubscribe').and.callThrough()
		spyOn(subject, 'emit').and.callThrough()
		spyOn(subject, 'observe').and.callThrough()
		spyOn(subject, 'listen').and.callThrough()
    });
    
    it('is a constructor', function () {
		expect(subject).toEqual(jasmine.any(Observable))
	})
    
    describe('has a correct interface', function () {
		it('value', function(){
			expect('value' in subject).toBe(true)
		})
		it('observers[]', function(){
			expect(subject.observers).toEqual(jasmine.any(Array))
		})        
		it('emit()', function(){
			expect(subject.emit).toEqual(jasmine.any(Function))
		})
		it('listen()', function(){
			expect(subject.listen).toEqual(jasmine.any(Function))
		})
		it('observe()', function(){
			expect(subject.observe).toEqual(jasmine.any(Function))
		})
		it('unsubscribe()', function(){
			expect(subject.unsubscribe).toEqual(jasmine.any(Function))
		})
	})
    
    it('has a correct value by default', function () {
		expect(subject.value).toBeUndefined()
	})
    
    it('has a correct value, when passed on creation', function () {
        var value = {test: "test"};
        subject = new Observable(value)
		expect(subject.value).toBe(value)
	})
	
	it('emits synchronously', function (done) {
		subject.listen(callback.handler1)
		subject.emit(data1)
		expect(callback.handler1).toHaveBeenCalled()
		subject.listen(callback.handler2)
		wait(function () {
			expect(callback.handler2).not.toHaveBeenCalled()
			done()
		})
	})
	
	it('observes synchronously', function (done) {
		subject.emit(data1)
		subject.observe(callback.handler1)
		expect(callback.handler1).toHaveBeenCalled()
		wait(function () {
			expect(callback.handler1.calls.count()).toEqual(1)
			done()
		})
	})
	
	it('can be listened', function () {
		subject.listen(callback.handler1)
		subject.emit(data1)
		subject.emit(data2)
		
		expect(callback.handler1).toHaveBeenCalled()
		expect(callback.handler1.calls.count()).toEqual(2)
		expect(callback.handler1.calls.argsFor(0)).toEqual([data1])
		expect(callback.handler1.calls.argsFor(1)).toEqual([data2])
	})
	
	it('can be observed', function () {
		subject.observe(callback.handler1)
		subject.emit(data1)
		subject.emit(data2)
		subject.observe(callback.handler2)
		
		expect(callback.handler1).toHaveBeenCalled()
		expect(callback.handler1.calls.count()).toEqual(3)
		expect(callback.handler1.calls.argsFor(0)).toEqual([undefined])
		expect(callback.handler1.calls.argsFor(1)).toEqual([data1])
		expect(callback.handler1.calls.argsFor(2)).toEqual([data2])
		expect(callback.handler2).toHaveBeenCalled()
		expect(callback.handler2.calls.count()).toEqual(1)
		expect(callback.handler2).toHaveBeenCalledWith(data2)
	})
	
	it('handles multiple subscriptions with the same observer', function () {
		subject.listen(callback.handler1)
		subject.observe(callback.handler1)
		subject.listen(callback.handler1)
		subject.emit(data1)

		expect(callback.handler1.calls.count()).toEqual(4)
	})

	
	describe('can unsubscribe', function () {
		it('all observers before the first emitment', function () {
			subject.listen(callback.handler1)
			subject.observe(callback.handler2)
			subject.listen(callback.handler3)
			subject.unsubscribe()
			subject.emit(data1)
			
			expect(callback.handler1).not.toHaveBeenCalled()
			expect(callback.handler2.calls.count()).toEqual(1)
			expect(callback.handler3).not.toHaveBeenCalled()
		})
		
		it('all observers after the first emitment', function () {
			subject.listen(callback.handler1)
			subject.observe(callback.handler2)
			subject.listen(callback.handler3)
			subject.emit(data1)
			subject.emit(data2)
			subject.unsubscribe()
			subject.emit(data3)
			
			expect(callback.handler1.calls.count()).toEqual(2)
			expect(callback.handler2.calls.count()).toEqual(3)
			expect(callback.handler3.calls.count()).toEqual(2)			
		})
		
		it('one observer before the first emitment', function () {
			subject.listen(callback.handler1)
			subject.observe(callback.handler2)
			subject.listen(callback.handler3)
			subject.unsubscribe(callback.handler1)
			subject.emit(data1)
			
			expect(callback.handler1).not.toHaveBeenCalled()
			expect(callback.handler2).toHaveBeenCalled()
			expect(callback.handler3).toHaveBeenCalled()	
		})
		
		it('one observer after the first emitment', function () {
			subject.listen(callback.handler1)
			subject.observe(callback.handler2)
			subject.listen(callback.handler3)
			subject.emit(data1)
			subject.emit(data2)
			subject.unsubscribe(callback.handler1)
			subject.unsubscribe(callback.handler2)
			subject.emit(data3)

			expect(callback.handler1.calls.count()).toEqual(2)
			expect(callback.handler2.calls.count()).toEqual(3)
			expect(callback.handler3.calls.count()).toEqual(3)
		})

		it('multiple subscriptions with the same observer', function () {
			subject.listen(callback.handler1)
			subject.listen(callback.handler1)
			subject.listen(callback.handler1)
			subject.unsubscribe(callback.handler1)
			subject.emit(data1)

			expect(callback.handler1).not.toHaveBeenCalled()
		})
	})
	
	it('calls handlers in correct way', function () {
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
		
		subject.listen(callback.handler1)
		subject.observe(callback.handler2)
		subject.listen(callback.handler3)
		subject.emit()
	
		expect(calls).toEqual(['callback2', 'callback1', 'callback2', 'callback3'])
	})
})

