//Internal task scheduling
'use strict'

var stack = [],
	ids = {},
	idCounter = 0,
	implementation,
	createTask,
	cancelTask = function () { }

if (typeof Promise !== 'undefined') { //use microtask
	createTask = function (callback) {
		new Promise(function (resolve, reject) {
			implementation = {
				reject: reject
			}
			resolve()
		})
		.then(callback)['catch'](function(err) {
			console.error(err)
		})
	}
	cancelTask = function () {
		implementation.reject()
	}
}
else {// fallback
	createTask = function (callback) {
		implementation = setTimeout(callback, 0)
	}
	cancelTask = function () {
		clearTimeout(implementation)
	}
}

//export
exports.setAsync = function (taskFunc) {
	if (typeof taskFunc !== 'function') {
		return
	}
	var id = idCounter++
	ids[id] = taskFunc //save reference to callback
	//If already has tasks, than just add new one. Execution is already scheduled.
	if (stack.length) {
		stack.push(taskFunc)
	}
		//Else add first task and schedule async execution.
	else {
		stack.push(taskFunc)
		createTask(function () {
			var task
			while (stack.length) {
				task = stack.shift()
				task()
			}
		})
	}
	return id
}

exports.clearAsync = function (id) {
	if (typeof id !== 'number' || !(id in ids) || !stack.length) {
		return
	}
	var task, i = -1

	while (++i in stack) {
		task = stack[i]
		if (task === ids[id]) {
			stack.splice(i, 1)
			delete ids[id]
		}
	}
	if (!stack.length) { //cancel async operation if no functions to execute
		cancelTask()
	}
}
