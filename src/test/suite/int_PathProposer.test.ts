import * as assert from 'assert';
import { it, describe } from 'mocha';
import { PathProposer } from '../../services/PathProposer';
import * as os from 'os';
/**
 * PathProposer requires VSCode module
 */
suite('PathProposer Test Suite', () => {
	describe('PathProposer.replaceVariables()', () => {
		const tests = [
			{
				args: {
					context: { S: "Active Directory" },
					pattern: "c:/tmp/%S.json"
				}, expected: 'c:/tmp/Active Directory.json'
			},
			{
				args: {
					context: { S: "Active Directory" },
					pattern: "%u/%S-%y.json"
				}, expected: `${os.homedir}/Active Directory-${(new Date()).getUTCFullYear()}.json`
			},
		];

		tests.forEach(({ args, expected }) => {
			it(`correctly compute the path ${args.pattern}`, () => {
				const computedPath = PathProposer.replaceVariables(args.pattern, args.context);
				assert.strictEqual(computedPath, expected);
			});
		});
	});

});
