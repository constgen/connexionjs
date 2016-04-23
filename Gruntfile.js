// usage:
// install node!!!
// npm install -g grunt-cli
// npm install
// grunt

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
					'src/libs/polyfills.js',
					'src/*.js'
				]
			}
		},
		watch: {
			sources: {
				files: [
					'src/libs/polyfills.js',
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
			testAll: {
				//src: '',
				options: {
					polyfills: ['libs/polyfills/polyfills.js'],
					vendor: [
						'node_modules/systemjs/dist/system.src.js'
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
					format: 'amd',
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
					format: 'amd',
					config: 'system.config.js',
					minify: true,
					sourceMaps: true
				}
			},
			test: {
				src:  TEST_DIR + '/specs/specs.js',
				dest: TEST_DIR + '/test.js',
				options: {
					baseURL: './',
					type: 'sfx', //sfx, bundle
					format: 'amd',
					config: 'system.test.config.js'
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