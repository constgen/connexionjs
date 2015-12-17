'use strict';
/*Promise Collections*/
var PromiseHelper = {};
var promiseCollection = function (specificFunc) {
	return function (Iterable) {
		var PromArr = [],
			len,
			props = {
				length: 0,
				done: 0,
				error: 0,
				Results: [],
				ErrorResults: []
			};

		if (arguments.length > 1) {
			PromArr = Array.prototype.slice.call(arguments);
		}
		else if (Iterable instanceof Array || (typeof Iterable === 'object' && 0 in Iterable)) { //like Array
			PromArr = Iterable;
		}
		else if (arguments.length) {
			PromArr.push(Iterable);
		}

		len = props.length = PromArr.length;

		return new Promise(function (resolve, reject) {
			//create closure of current state for callbacks
			var itemCallbacks = specificFunc(props, resolve, reject),
				i = 0;

			var nextStep = function (promise, i) {
				//check if Iterable was augmented
				var callback = function () {
					props.length = PromArr.length;
					if (len !== props.length) {
						len = props.length;
						//continue iteration
						iterationLoop();
					}
				};
				if (i == len - 1) {
					promise.then(callback, callback);
				}
				promise.then(
					itemCallbacks.itemResolved && itemCallbacks.itemResolved.bind(undefined, i),
					itemCallbacks.itemRejected && itemCallbacks.itemRejected.bind(undefined, i)
				);
			};

			var iterationLoop = function () {
				var promise;
				while (i < len || ((len = props.length = PromArr.length) && i < len)) {
					if (i in PromArr) {
						//ensure that item is a Promise
						promise = Promise.resolve(PromArr[i]);
						nextStep(promise, i);
					}
					else { //skip item
						if (itemCallbacks.itemSkipped) {
							itemCallbacks.itemSkipped(i);
						}
					}
					i += 1;
				}
			};

			//start loop
			iterationLoop();
		});
	};
};

//gathers many promises and becomes resolved, when they all resolved
//PromiseHelper.allPromises = promiseCollection(function(props, resolveCollection, rejectCollection) {
//	//if no arguments, resolve collection
//	if (!props.length) {
//		resolveCollection([]);
//	}

//	return {
//		itemSkipped: function() {
//			props.done += 1;
//			if (props.done == props.length) {
//				resolveCollection(props.Results);
//			}
//		},
//		itemResolved: function(i, result) {
//			props.done += 1;
//			props.Results[i] = result;
//			if (props.done == props.length) {
//				resolveCollection(props.Results);
//			}
//		},
//		itemRejected: function(i, err) {
//			rejectCollection(err);
//		},
//		itemProgressed: undefined
//	};
//});

//gathers many promises and becomes resolved, when they all fulfilled with any results.
PromiseHelper.anyPromises = promiseCollection(function (props, resolveCollection) {
	//if no arguments, resolve collection
	if (!props.length) {
		resolveCollection([]);
	}

	return {
		itemSkipped: function () {
			props.done += 1;
			if (props.done == props.length) {
				resolveCollection(props.Results);
			}
		},
		itemResolved: function (i, result) {
			props.done += 1;
			props.Results[i] = result;
			if (props.done == props.length) {
				resolveCollection(props.Results);
			}
		},
		itemRejected: function (i, err) {
			props.done += 1;
			props.Results[i] = err;
			if (props.done == props.length) {
				resolveCollection(props.Results);
			}
		},
		itemProgressed: undefined
	};
});

//gathers many promises and becomes resolved, when they all fulfilled with any results. But if all promises are rejected `some` also becomes rejected.
PromiseHelper.somePromises = promiseCollection(function (props, resolveCollection, rejectCollection) {
	return {
		itemSkipped: function () {
			props.done += 1;
			props.error += 1;
			if (props.error == props.length) {
				//if all promise collection was rejected
				rejectCollection(props.ErrorResults);
			} else if (props.done == props.length) {
				//return only successful results
				resolveCollection(props.Results.filter(function (itm, j) {
					return j in props.Results;
				}));
			}
		},
		itemResolved: function (i, result) {
			props.done += 1;
			props.Results[i] = result;
			if (props.done == props.length) {
				//return only successful results
				resolveCollection(props.Results.filter(function (itm, j) {
					return j in props.Results;
				}));
			}
		},
		itemRejected: function (i, err) {
			props.done += 1;
			props.error += 1;
			props.ErrorResults[i] = err;
			if (props.error == props.length) {
				//if all promise collection was rejected
				rejectCollection(props.ErrorResults);
			} else if (props.done == props.length) {
				//return only successful results
				resolveCollection(props.Results.filter(function (itm, j) {
					return j in props.Results;
				}));
			}
		},
		itemProgressed: undefined
	};
});

//export
module.exports = PromiseHelper;