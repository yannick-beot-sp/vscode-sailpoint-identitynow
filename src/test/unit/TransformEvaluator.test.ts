import * as assert from 'assert';
import { it, describe } from 'mocha';
import { normalizeNames } from '../../services/transforms';

suite('Transforms Test Suite', () => {
	describe('normalizeNames', () => {
		const tests = [
			{ args: 'mac-donalds', expected: 'Mac-donalds' }, // cf. https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/73
			{ args: 'jean-baptiste le goff', expected: 'Jean-Baptiste Le Goff' },
			{ args: "o'sullivan", expected: "O'Sullivan" },
			{ args: 'mac donalds', expected: 'Mac Donalds' },
			{ args: 'macdonalds', expected: 'MacDonalds' },
			{ args: 'mc-donalds', expected: 'Mc-donalds' }, 
			{ args: 'mcdonalds', expected: 'McDonalds' }, 
		];
		tests.forEach(({ args, expected }) => {
			it(`should correctly return ${args}`, () => {
				const humanReadableString = normalizeNames(args);
				assert.strictEqual(humanReadableString, expected);
			});
		});
	});

});
