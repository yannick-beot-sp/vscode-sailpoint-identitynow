import * as assert from 'assert';
import { it, describe } from 'mocha';
import { toCamelCase } from '../../utils/stringUtils';

suite('toCamelCase Test Suite', () => {
	// vscode.window.showInformationMessage('Start all tests.');
	describe('toCamelCase', () => {
		const tests = [
			{ args: 'NE Populations Jobtitles', expected: 'nePopulationsJobtitles' },
			{ args: 'Test1 test2 3', expected: 'test1Test23' },
			{ args: 'TeSt1 test2 3', expected: 'test1Test23' },
			{ args: "displayName", expected: 'displayname' },
		];
		tests.forEach(({ args, expected }) => {
			it(`should correctly format ${args}`, () => {
				const result = toCamelCase(args);
				assert.strictEqual(result, expected);
			});
		});
	});

});
