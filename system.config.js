System.config({
	defaultJSExtensions: false,
	meta: {
		'*.json': {loader: 'json'}
	},
	map: {
		'../../src/': 'source:',
		'../../': 'project:',
		'json': '../node_modules/systemjs-plugin-json/json.js', //loader plugin
		'es6-collections': '../node_modules/es6-collections/es6-collections.js'
	},
	paths: {
		'project:*': '../*',
		'source:*': '../src/*'
	}
	// packages: {
	// 	'es6-symbol': {
	// 		main: 'index.js',
	// 		defaultExtension: 'js'
	// 	},
	// 	'es5-ext': {
	// 		defaultExtension: 'js',
	// 		map: {
	// 			'./object/assign': './object/assign/index',
	// 			'./object/keys': './object/keys/index',
	// 			'./string/#/contains': './string/#/contains/index'
	// 		}
	// 	}
	// }
})
