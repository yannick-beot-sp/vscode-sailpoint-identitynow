import * as assert from 'assert';
import { it, describe } from 'mocha';
import { escapeFilter } from '../../utils/stringUtils';

suite('escapeFilter Test Suite', () => {
	describe('escapeFilter', () => {
		const tests = [
			{ args: '#Employees', expected: '%23Employees' },
			{ args: '"Employees"', expected: '\\"Employees\\"' },
			{ args: undefined, expected: undefined },
		];
		tests.forEach(({ args, expected }) => {
			it(`should correctly escape ${args}`, () => {
				const result = escapeFilter(args);
				assert.strictEqual(result, expected);
			});
		});
	});

});
