System.config({
	defaultJSExtensions: false,
	meta: {
		'*.json': { loader: 'json' }
	},
	map: {
		'../../src/': 'source:',
		'../../': 'project:',
		'json': '../node_modules/systemjs-plugin-json/json.js', //loader plugin
		'es6-collections': '../node_modules/es6-collections/es6-collections.js',
		'es6-symbol': '../node_modules/es6-symbol',
		'es5-ext': '../node_modules/es5-ext',
		'd': '../node_modules/d/index.js',
		'cross-channel': '../node_modules/cross-channel/src/index.js'
	},
	paths: {
		'project:*': '../*',
		'source:*': '../src/*'
	},
	packages: {
		'es6-symbol': {
			main: 'index.js',
			defaultExtension: 'js'
		},
		'es5-ext': {
			defaultExtension: 'js',
			map: {
				'./object/assign': './object/assign/index',
				'./object/keys': './object/keys/index',
				'./string/#/contains': './string/#/contains/index'
			}
		}
	}
})
