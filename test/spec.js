'use strict';
'format cjs';
describe('Module', function () {
	require('./spec/index.js')
	require('./spec/environment.js')
	require('./spec/asynctask.js')
	require('./spec/types/event.js')
	require('./spec/types/observable.js')
	require('./spec/emitter.js')
	require('./spec/utils/pojo.js')
});
