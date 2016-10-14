'use strict'

module.exports = function (grunt) {
	var DOC_DIR = 'doc'
	var BUILD_DIR = 'dist'
	var TEST_DIR = 'test'
	var SRC_DIR = 'src'
	var DEMO_DIR = 'demo'
	var MODULE_FILE_NAME = 'connexion'

	grunt.initConfig({
		jshint: {
			dev: {
				options: {
					jshintrc: '.jshintrc'
				},
				src: [
					SRC_DIR + '/**/*.js'
				]
			}
		},
		watch: {
			sources: {
				files: [
					SRC_DIR + '/**/*.js',
					SRC_DIR + '/**/*.json',
					TEST_DIR +  '/**/*.js',
					TEST_DIR +  '/**/*.json',
					DEMO_DIR +  '/**/*'
				],
				//tasks: ['jshint'],
				options: {
					interrupt: true,
					livereload: 35729
				}
			}
		},
		jsdoc: {
			dist: {
				src: [SRC_DIR + '/index.js'],
				dest: DOC_DIR
			}
		},
		clean: {
			doc: [DOC_DIR],
			build: [BUILD_DIR],
			test: [TEST_DIR + '/test.js']
		},
		jasmine: {
			dev: {
				//src: '',
				options: {
					//polyfills: [''],
					//helpers: [''],
					keepRunner: false,
					outfile: TEST_DIR + '/test.html',
					specs: [TEST_DIR + '/test.js']
				}
			}
		},
		systemjs: {
			build: {
				src: SRC_DIR + '/index.js',
				dest: BUILD_DIR + '/' + MODULE_FILE_NAME + '.js',
				options: {
					baseURL: SRC_DIR,
					config: 'system.config.js',
					type: 'build',
					format: 'umd',
					minify: false,
					sourceMaps: true
				}
			},
			buildmin: {
				src: SRC_DIR + '/index.js',
				dest: BUILD_DIR + '/'+ MODULE_FILE_NAME + '.min.js',
				options: {
					baseURL: SRC_DIR,
					config: 'system.config.js',
					type: 'build',
					format: 'umd',
					minify: true,
					sourceMaps: true
				}
			},
			test: {
				src:  TEST_DIR + '/spec.js',
				dest: TEST_DIR + '/test.js',
				options: {
					baseURL: TEST_DIR,
					config: 'system.config.js',
					type: 'build',
					format: 'umd',
					minify: false
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint')
	grunt.loadNpmTasks('grunt-contrib-watch')
	grunt.loadNpmTasks('grunt-jsdoc')
	grunt.loadNpmTasks('grunt-contrib-clean')
	grunt.loadNpmTasks('grunt-contrib-jasmine')
	grunt.loadNpmTasks('grunt-systemjs-bundler')


	grunt.registerTask('live', ['watch'])
	grunt.registerTask('code', ['jshint:dev'])
	grunt.registerTask('doc', ['clean:doc', 'jsdoc'])
	grunt.registerTask('test', ['systemjs:test', 'jasmine', 'clean:test'])
	grunt.registerTask('build', ['clean:build', 'systemjs:build', 'systemjs:buildmin'])
};