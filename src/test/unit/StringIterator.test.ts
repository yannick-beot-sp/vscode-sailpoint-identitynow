import * as assert from 'assert';
import { it, describe, suite } from 'mocha';
import { StringIterator } from '../../parser/stringIterator';


suite('StringIterator Test Suite', () => {
	describe('StringIterator.readToken()', () => {
        const tests = [
			{ args: 'a.b', expected: 'a' },
			{ args: 'lorem.ipsum', expected: 'lorem' },
			{ args: 'lorem ipsum', expected: 'lorem' },
		];
        tests.forEach(({ args, expected }) => {
			it(`correctly get next token for ${args}`, () => {
				const stringIterator = new StringIterator(args);
                const result = stringIterator.readToken();
				assert.strictEqual(result, expected);
			});
		});
	});

});
