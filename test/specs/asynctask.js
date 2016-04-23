'use strict';

var task = require('../../src/asynctask.js'),
	setAsyncTask = task.setAsync,
	clearAsyncTask = task.clearAsync;


describe('asynctask', function () {
	var handler = {
		callback: function () { },
		callback2: function () { }
	}

	beforeEach(function () {
		spyOn(handler, 'callback');
		spyOn(handler, 'callback2');
	});
	
	it('asynchronously calls callbacks', function (done) {
		setAsyncTask(handler.callback);
		expect(handler.callback).not.toHaveBeenCalled();
		setTimeout(function () {
			expect(handler.callback).toHaveBeenCalled();
			done();
		}, 1)
	});

	it('cancells callback by ID', function (done) {
		var id1 = setAsyncTask(handler.callback),
			id2 = setAsyncTask(handler.callback2);
		clearAsyncTask(id1);
		setTimeout(function () {
			expect(handler.callback).not.toHaveBeenCalled();
			expect(handler.callback2).toHaveBeenCalled();
			done();
		}, 1)
	});

	it('calls all current tasks at a single event loop', function (done) {
		setAsyncTask(handler.callback);
		setTimeout(handler.callback2, 0);
		setAsyncTask(function () {
			expect(handler.callback).toHaveBeenCalled();
			expect(handler.callback2).not.toHaveBeenCalled();
			done();
		});
	})
});

