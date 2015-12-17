'use strict';

module.exports = function (grunt) {
	grunt.registerMultiTask('systemjs', 'SystemJS modules builder', function () {
		var done = this.async(),
			path = require('path'),
			Builder = require('systemjs-builder'),
			taskConfig = this.data,
			relativePath,
			relativeUrl;

		// Merge task-specific options with these defaults.
		var options = this.options({
			baseURL: '.', //'file:/' + process.cwd(),
			format: 'global', //'amd', 'cjs', 'esm', 'global'
			minify: false,
			mangle: false,
			sourceMaps: false
		});
		
		//grunt.log.writeln(JSON.stringify(this.files));
		//grunt.log.writeln(process.cwd());
		//grunt.log.writeln(__dirname);
		//grunt.log.writeln(process.execPath);
		//grunt.log.writeln(this.target + ': ' + JSON.stringify(options));
		//grunt.log.writeln(path.relative(options.baseURL, taskConfig.src));

		var builder = new Builder(
			String(options.baseURL),
			options.config
		);

		//Fix paths in config. They will become relative to builder root
		Object.keys(builder.loader.paths).forEach(function (pathAlias) {
			var relativePath = path.resolve(options.baseURL, builder.loader.paths[pathAlias])
			var relativeUrl = './' + path.relative('./', relativePath).replace(/\\/g, '/');
			builder.loader.paths[pathAlias] = relativeUrl;
			//console.log(relativeUrl);
		});

		function build(params) {
			switch (params.buildType) {
				case 'sfx':
					return builder.buildStatic(params.src, params.dest, params.buildConfig);
				case 'bundle':
					return builder.bundle(params.src, params.dest, params.buildConfig);
				case 'package':
				default:
					return builder.build(params.src, params.dest, params.buildConfig);
			}
		}

		Promise.resolve()
			//.then(function () {
			//	if (options.config) {
			//		return builder.loadConfig(options.config);
			//	}
			//})
			.then(function () {
				//builder.config();
				return build({
					src: path.relative(options.baseURL, taskConfig.src), //makre path relative to baseURL because of strange behaviour of System Builder
					dest: taskConfig.dest, 
					buildType: options.type,
					buildConfig: {
						format: options.format,
						minify: Boolean(options.minify),
						mangle: Boolean(options.mangle),
						sourceMaps: Boolean(options.sourceMaps)
						//sourceRoot: '' ????
					}
				});
			})
			.then(function () {
				console.log('Build complete');
				done();
			})
			.catch(function (err) {
				console.log('Build error');
				console.log(err);
				done(false);
			});
	});
};