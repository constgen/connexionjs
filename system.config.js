System.config({
	defaultJSExtensions: false,
	meta: {
		'*.json': {
			loader: 'json'
		}
	},
	map: {
		'../../src/': 'source:',
		'../../': 'project:'
	},
	paths: {
		//loader plugins
		'json': '../node_modules/systemjs-plugin-json/json.js',
		
		'project:*': '../*',
		'source:*': '../src/*',
		'es6-collections': '../node_modules/es6-collections/es6-collections.js'
	}
});
