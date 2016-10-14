'use strict'

var connexion = require('../../src/index.js'),
	packageManifest = require('../../package.json');

describe('connexion', function () {
	describe('has a correct interface', function () {
		it('"listen" is a Function', function () {
			expect(connexion.listen).toEqual(jasmine.any(Function))
		})
		it('"observe" is a Function', function () {
			expect(connexion.observe).toEqual(jasmine.any(Function))
		})
		it('"unsubscribe" is a Function', function () {
			expect(connexion.unsubscribe).toEqual(jasmine.any(Function))
		})
		it('"emit" is a Function', function () {
			expect(connexion.emit).toEqual(jasmine.any(Function))
		})
		it('"version" is the same as in the package.json', function () {
			expect(connexion.version).toEqual(packageManifest.version)
		})
	})
})

