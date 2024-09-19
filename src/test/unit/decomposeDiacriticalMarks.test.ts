import * as assert from 'assert';
import { it, describe } from 'mocha';
import { toCamelCase } from '../../utils/stringUtils';

suite('decomposeDiacriticalMarks Test Suite', () => {
	// vscode.window.showInformationMessage('Start all tests.');
	describe('decomposeDiacriticalMarks', () => {
		const tests = [
			{ args: 'Āric', expected: 'Aric' },
			{ args: 'Dubçek', expected: 'Dubcek' },
			{ args: 'Amélie', expected: 'Amelie' },
			{ args: "àáâãäåçèéêëìíîïñòóôõöùúûüýÿ", expected: 'aaaaaaceeeeiiiinooooouuuuyy' },
		];
		tests.forEach(({ args, expected }) => {
			it(`should correctly format ${args}`, () => {
				const result = decomposeDiacriticalMarks(args);
				assert.strictEqual(result, expected);
			});
		});
	});

});
