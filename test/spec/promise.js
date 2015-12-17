'use strict';

var PromiseHelper = require('../../src/promise.js');

describe('promise helper', function () {
	var success1 = Promise.resolve(),
		success2 = Promise.resolve(),
		success3 = Promise.resolve(),
		error1 = Promise.reject(),
		error2 = Promise.reject(),
		error3 = Promise.reject(),
		some = PromiseHelper.somePromises,
		any = PromiseHelper.anyPromises;

	var handler = {
		success: function() {},
		error: function () {}
	}
	
	beforeEach(function () {
		spyOn(handler, 'success');
		spyOn(handler, 'error');
	});

	xit('resolved, when all promises are resolved, while looking for some', function (done) {
		some(success1, success2, success3).then(handler.success, handler.error).then(function (r) {
			console.log(r)
			expect(handler.success).toHavebeenCalled();
		}, function (err) {
			console.error(err)
		}).then(done, done);
	});

	xit('resolved, when some of promises are resolved, while looking for some', function (done) {
		some(success1, error2, success3).then(function () {

		}).then(done, done);
	});

	xit('rejected, when all promises are rejected while looking for some', function (done) {
		some(error1, error2, error3).then(function () {

		}).then(done, done);
	});

	xit('can resolve, when any promises are resolved', function (done) {
		any
	});
	
	xit('not rejected, when all promises are rejected while looking for any', function (done) {
		any
	});
});

