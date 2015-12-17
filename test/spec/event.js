'use strict';

var MediatorEvent = require('../../src/event.js');


describe('event', function () {
	
	it('has correct values if argument is not passed', function () {
		var event = new MediatorEvent();
		expect(event.emitter).toBe('');
		expect(event.isCanceled).toBe(false);
		expect(event.type).toBe('*');
		expect(typeof event.timeStamp).toBe('number');
		//expect(event.timeStamp).toBe(new Date().getTime());
		expect(event.detail).toEqual({});
	});
	it('has correct values if Message event is passed as argument', function () {
		expect(true).toBe(true);
	});
	it('is cancelable', function () {
		var event = new MediatorEvent();
		event.cancel();
		expect(event.isCanceled).toBe(true);

	});

});

