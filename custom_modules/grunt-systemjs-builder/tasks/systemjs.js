
'use strict';

module.exports = function (grunt) {
	grunt.registerMultiTask('systemjs', 'SystemJS modules builder', function () {
		var done = this.async(),
			path = require('path'),
			Builder = require('systemjs-builder');

		// Merge task-specific options with these defaults.
		var options = this.options({
			source: './src/index',
			output: './build/build.js'
		});
		
		//grunt.log.writeln(JSON.stringify(this.files));
		//grunt.log.writeln(process.cwd());
		//grunt.log.writeln(__dirname);
		//grunt.log.writeln(process.execPath);
		//grunt.log.writeln(this.target + ': ' + JSON.stringify(options));



		var builder = new Builder({
			baseURL: 'file:/' + process.cwd()
		});

		Promise.resolve().then(function () {
			if (options.config) {
				return builder.loadConfig(options.config);
			}
		}).then(function () {
			return builder.buildStatic(options.source, options.output, {
				format: 'amd',
				minify: !!options.minify,
				mangle: false, // !!options.minify,
				sourceMaps: !!options.sourceMaps
			});
		}).then(function () {
			console.log('Build complete');
			done();
		}).catch(function (err) {
			console.log('Build error');
			console.log(err);
			done(false);
		});
	});
};