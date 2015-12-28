'use strict';

var Stream = require('../../src/stream.js');

describe('stream', function () {
	var stream,
		handler = {
			callback1: function () { },
			callback2: function () { },
			callback3: function () { }
		},
		data1 = { a: 1, b: 2 },
		data2 = { c: 3, d: 4 },
		data3 = { e: 5, f: 6 },
		data4 = [7,8,9],
		data5 = undefined,
		data6 = null,
		data7 = true,
		data8 = false,
		WAIT_TIME = 1;

	function wait(callback) {
		return setTimeout(callback, WAIT_TIME);
	}

	beforeEach(function () {
		stream = new Stream();
		spyOn(handler, 'callback1');
		spyOn(handler, 'callback2');
		spyOn(handler, 'callback3');
		spyOn(stream, 'dispose').and.callThrough();
		spyOn(stream, 'emit').and.callThrough();
		spyOn(stream, 'observe').and.callThrough();
		spyOn(stream, 'listen').and.callThrough();
	});

	xit('created with correct initial value', function (done) { });

	it('can be listened', function (done) {
		stream.listen(handler.callback1);
		stream.emit(data1);
		stream.emit(data2);
		wait(function () {
			expect(handler.callback1).toHaveBeenCalled();
			expect(handler.callback1.calls.count()).toEqual(2);
			expect(handler.callback1.calls.argsFor(0)).toEqual([data1]);
			expect(handler.callback1.calls.argsFor(1)).toEqual([data2]);
			done();
		});
	});

	it('emits synchronously', function (done) {
		stream.emit(data1);
		stream.listen(handler.callback1);
		wait(function () {
			expect(handler.callback1).not.toHaveBeenCalled();
			done();
		});
	});

	it('can be observed', function (done) {
		stream.observe(handler.callback1);
		stream.emit(data1);
		stream.emit(data2);
		wait(function () {
			expect(handler.callback1).toHaveBeenCalled();
			expect(handler.callback1.calls.count()).toEqual(3);
			expect(handler.callback1.calls.argsFor(0)).toEqual([undefined]);
			expect(handler.callback1.calls.argsFor(1)).toEqual([data1]);
			expect(handler.callback1.calls.argsFor(2)).toEqual([data2]);
			done();
		});
	});

	it('observs synchronously', function (done) {
		stream.emit(data1);
		stream.observe(handler.callback1);
		expect(handler.callback1).toHaveBeenCalled();
		wait(function () {
			expect(handler.callback1.calls.count()).toEqual(1);
			done();
		});
	});

	describe('can be closed', function () {
		it('before first emitment', function (done) {
			stream.listen(handler.callback1);
			stream.observe(handler.callback2);
			stream.listen(handler.callback3);
			stream.dispose();
			wait(function () {
				expect(handler.callback1).not.toHaveBeenCalled();
				expect(handler.callback2).toHaveBeenCalled();
				expect(handler.callback3).not.toHaveBeenCalled();
				done();
			});
		});

		it('after first emitment', function (done) {
			stream.listen(handler.callback1);
			stream.observe(handler.callback2);
			stream.listen(handler.callback3);
			stream.emit(data1);
			stream.emit(data2);
			stream.dispose();
			wait(function () {
				expect(handler.callback1).toHaveBeenCalled();
				expect(handler.callback2).toHaveBeenCalled();
				expect(handler.callback3).toHaveBeenCalled();
				done();
			});
		});
		
		it('and throws error, if emit something after that', function (done) {
			stream.emit(data1);
			wait(function () {
				stream.dispose();
				expect(function () {
					stream.emit(data2);
				}).toThrowError();
				done();
			});
		});

		it('after some callback was called', function (done) {
			stream.listen(handler.callback1);
			stream.observe(handler.callback2);
			stream.listen(handler.callback3);
			stream.emit(data1);
			stream.emit(data2);
			wait(function () {
				stream.dispose();
				try {
					stream.emit(data3);
				} catch (err){}
				wait(function () {
					expect(handler.callback1.calls.count()).toEqual(2);
					expect(handler.callback2.calls.count()).toEqual(3);
					expect(handler.callback3.calls.count()).toEqual(2);
					done();
				});
			});
		});

	});

	it('calls listeners first, and observers last', function (done) {
		var calls = [];
		handler.callback1.and.callFake(function () {
			calls.push('callback1');
		});
		handler.callback2.and.callFake(function () {
			calls.push('callback2');
		});
		handler.callback3.and.callFake(function () {
			calls.push('callback3');
		});
		
		stream.listen(handler.callback1);
		stream.observe(handler.callback2);
		stream.listen(handler.callback3);
		stream.emit();
		wait(function () {
			expect(calls).toEqual(['callback2', 'callback1', 'callback3', 'callback2'])
			done();
		});
	});
});

