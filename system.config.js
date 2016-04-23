System.config({
	defaultJSExtensions: false,
	map: {
		'../../src/': 'source:',
	},
	paths: {
		'source:*': '../src/*',
		'es6-collections': '../node_modules/es6-collections/es6-collections.js'
	}
});
