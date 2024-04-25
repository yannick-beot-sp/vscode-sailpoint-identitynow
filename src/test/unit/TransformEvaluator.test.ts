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
			{ args: 'jOHN VON SmITh', expected: 'John von Smith' },
			{ args: "Dr. JOHN D. O'BRIEN", expected: "Dr. John D. O'Brien" },
		];
		tests.forEach(({ args, expected }) => {
			it(`should correctly normalize ${args}`, () => {
				const humanReadableString = normalizeNames(args);
				assert.strictEqual(humanReadableString, expected);
			});
		});
	});

});
