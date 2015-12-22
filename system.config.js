System.config({
	//paths: {
	//	'*rx.core': '*rx.core.js',
	//	'*rx.core.js': '*rx.core.min.js',
	//	'*rx.core.binding': '*rx.core.binding.js',
	//	'*rx.core.binding.js': '*rx.core.binding.min.js'
	//},
	map: {
		'rx.core': 'node_modules/rx-core/rx.core.js'
	},
	paths: {
		//'rx.lite.min': '../node_modules/rx/dist/rx.lite.min.js',
		//'rx.lite': '../node_modules/rx/dist/rx.lite.js',
		'rx-lite': '../node_modules/rx-lite/rx.lite.js',
		'rx-core-binding': '../node_modules/rx-core-binding/rx.core.binding.js',
		'rx-core': '../node_modules/rx-core/rx.core.js',
		'es6-collections': '../node_modules/es6-collections/es6-collections.js'
		//'*/rx.core': '*/node_modules/rx-core/rx.core.js'
	},
	//bundles: {
		//'rx.min': ['../node_modules/rx/dist/rx.core.binding.min.js', '../node_modules/rx/dist/rx.core.min.js'],
		//'rx': ['../node_modules/rx/dist/rx.core.binding.js', '../node_modules/rx/dist/rx.core.js']
	//},
	//packages: {
	//	// meaning [baseURL]/local/package when no other rules are present
	//	// path is normalized using map and paths configuration
	//	'local/package': {
	//		main: 'index.js',
	//		format: 'cjs',
	//		defaultExtension: false,
	//		map: {
	//			// use local jquery for all jquery requires in this package
	//			'jquery': './vendor/local-jquery.js',

	//			// import '/local/package/custom-import' should route to '/local/package/local/import/file.js'
	//			'./custom-import': './local/import/file.js'

	//		},
	//		modules: {
	//			// sets meta for modules within the package
	//			'vendor/*': {
	//				'format': 'global'
	//			}
	//		}
	//	}
	//}
});
