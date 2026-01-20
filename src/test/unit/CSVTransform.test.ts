import * as assert from 'assert';
import { it, describe } from 'mocha';
import { transformNewlines } from '../../utils/CSVTransform';


function runTests(tests: Array<{ input: any, expected: any, it: string }>) {
    tests.forEach(({ input, expected, it: testName }) => {
        it(testName, () => {
            const result = transformNewlines(input);
            assert.strictEqual(result, expected);
        });
    });
}

suite('transformNewlines Test Suite', () => {
    describe('Transform "\\n" to newline character', () => {
        const tests = [
            { input: 'Line 1\\nLine 2', expected: 'Line 1\nLine 2', it: 'should transform "\\n" to newline character' },
            { input: 'A\\nB\\nC', expected: 'A\nB\nC', it: 'should transform multiple "\\n"' },
        ];
        runTests(tests)
    });

    describe('Transform "\\\\n" to "\\n" string', () => {
        const tests = [
            { input: 'Test\\\\nSuite', expected: 'Test\\nSuite', it: 'should transform "\\\\n" to "\\n" string (not to newline)' },
            { input: 'A\\\\nB\\\\nC', expected: 'A\\nB\\nC', it: 'should transform multiple "\\\\n"' },
        ];
        runTests(tests)
    });

    describe('Mixed cases', () => {
        const tests = [
            { input: 'Line 1\\nLine 2\\\\nLine 3', expected: 'Line 1\nLine 2\\nLine 3', it: 'should handle mix of "\\n" and "\\\\n"' },
            { input: 'A\\nB\\\\nC\\nD\\\\nE', expected: 'A\nB\\nC\nD\\nE', it: 'should handle multiple mixed occurrences' },
        ];
        runTests(tests)
    });

    describe('Non-string values', () => {
        const obj = { key: 'value' }
        const arr = [1, 2, 3]
        const tests = [
            { input: null, expected: null, it: 'should return null if value is null' },
            { input: undefined, expected: undefined, it: 'should return undefined if value is undefined' },
            { input: 123, expected: 123, it: 'should return number as is' },
            { input: obj, expected: obj, it: 'should return object as is' },
            { input: arr, expected: arr, it: 'should return array as is' },
            { input: true, expected: true, it: 'should return boolean as is' },
        ];
        runTests(tests)
    });

    describe('Edge cases', () => {
        const tests = [
            { input: '', expected: '', it: 'should handle empty string' },
            { input: 'Simple text', expected: 'Simple text', it: 'should handle string without "\\n"' },
            { input: '\\nStart', expected: '\nStart', it: 'should handle "\\n" at start' },
            { input: 'End\\n', expected: 'End\n', it: 'should handle "\\n" at end' },
            { input: '\\\\nStart', expected: '\\nStart', it: 'should handle "\\\\n" at start' },
            { input: 'End\\\\n', expected: 'End\\n', it: 'should handle "\\\\n" at end' },
        ];
        runTests(tests)
    });
});
