'use strict'

module.exports = function (grunt) {
	var DOC_DIR = 'doc',
		BUILD_DIR = 'dist',
		TEST_DIR = 'test',
		SRC_DIR = 'src';

	grunt.initConfig({
		jshint: {
			dev: {
				options: {
					jshintrc: '.jshintrc'
				},
				src: [
					'src/*.js'
				]
			}
		},
		watch: {
			sources: {
				files: [
					'src/**/*.js',
                    'test/**/*.js'
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
				src: ['src/*.js'],
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
					vendor: [
						'./node_modules/systemjs-builder/node_modules/systemjs/dist/system.src.js'
					],
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
				dest: BUILD_DIR + '/connexion.js',
				options: {
					baseURL: SRC_DIR,
					type: 'sfx', //sfx, bundle
					format: 'umd',
					config: 'system.config.js',
					minify: false,
					sourceMaps: true
				}
			},
			buildmin: {
				src: SRC_DIR + '/index.js',
				dest: BUILD_DIR + '/connexion.min.js',
				options: {
					baseURL: SRC_DIR,
					type: 'sfx', //sfx, bundle
					format: 'umd',
					config: 'system.config.js',
					minify: true,
					sourceMaps: true
				}
			},
			test: {
				src:  TEST_DIR + '/spec.js',
				dest: TEST_DIR + '/test.js',
				options: {
					baseURL: TEST_DIR,
					type: 'sfx', //sfx, bundle
					format: 'umd',
					config: 'system.config.js'
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadTasks('custom_modules/grunt-systemjs-bundler/tasks');


	grunt.registerTask('live', ['watch']);
	grunt.registerTask('code', ['jshint:dev']);
	grunt.registerTask('doc', ['clean:doc', 'jsdoc']);
	grunt.registerTask('test', ['systemjs:test', 'jasmine', 'clean:test']);
	grunt.registerTask('build', ['clean:build', 'systemjs:build', 'systemjs:buildmin']);
};