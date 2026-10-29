/* eslint-disable @typescript-eslint/naming-convention */
import * as assert from 'assert';
import { it, describe } from 'mocha';
import { EvaluationContext } from '../../services/transforms/EvaluationContext.js';
import { TransformEngine } from '../../services/transforms/TransformEngine.js';
import { NotImplementedError, TransformError } from '../../services/transforms/TransformError.js';

const RULE_NAME = 'Cloud Services Deployment Utility';

class FakeContext implements EvaluationContext {
    implicitInputCalls = 0;
    identityCalls = 0;

    constructor(
        private readonly implicitInput = 'John Doe',
        private readonly identities: Record<string, any> = {},
        private readonly transforms: Record<string, any> = {},
        private readonly accounts: any[] = [],
    ) { }

    async getImplicitInput() {
        this.implicitInputCalls++;
        return this.implicitInput;
    }
    async getIdentityNameOrId() {
        this.identityCalls++;
        return 'john.doe';
    }
    async getIdentity(identityNameOrId: string) { return this.identities[identityNameOrId]; }
    async getSourceId(sourceName: string) { return sourceName === 'HR' ? 'hr-id' : undefined; }
    async getAccountsByIdentity(identityId: string) { return this.accounts.filter(account => account.identityId === identityId); }
    async getTransformByName(name: string) { return this.transforms[name]; }
}

function evaluate(transform: any, context = new FakeContext()) {
    return new TransformEngine(context).evaluate({ name: 'Test', ...transform });
}

suite('TransformEngine Test Suite', () => {

    describe('validation', () => {
        it('should require a name', async () => {
            await assert.rejects(new TransformEngine(new FakeContext()).evaluate({ type: 'lower' }), /Missing required attribute 'name'/);
        });
        it('should reject an unknown type', async () => {
            await assert.rejects(evaluate({ type: 'foo' }), /Invalid transform type 'foo'/);
        });
        it('should list missing required attributes', async () => {
            await assert.rejects(evaluate({ type: 'replace', attributes: { input: 'a' } }), /Missing required attribute\(s\) \[regex,replacement\]/);
        });
        it('should reject an input on a type without input', async () => {
            await assert.rejects(evaluate({ type: 'uuid', attributes: { input: 'a' } }), /do not require attribute 'input'/);
        });
    });

    describe('input', () => {
        it('should ask the implicit input once per evaluation', async () => {
            const context = new FakeContext('Jean');
            const result = await evaluate({
                type: 'concat',
                attributes: { values: [{ type: 'upper' }, '-', { type: 'lower' }] }
            }, context);
            assert.strictEqual(result, 'JEAN-jean');
            assert.strictEqual(context.implicitInputCalls, 1);
        });
        it('should not leak the input of a nested transform to its parent', async () => {
            const result = await evaluate({
                type: 'substring',
                attributes: {
                    input: 'john.doe@example.com',
                    begin: { type: 'indexOf', attributes: { input: 'xx@', substring: '@' } },
                }
            });
            assert.strictEqual(result, 'hn.doe@example.com');
        });
        it('should give a null result for a null input', async () => {
            const result = await evaluate({ type: 'upper', attributes: { input: { type: 'lookup', attributes: { input: 'x', table: {} } } } });
            assert.strictEqual(result, null);
        });
    });

    describe('string transforms', () => {
        const tests = [
            { transform: { type: 'leftPad', attributes: { input: '42', length: '5' } }, expected: '   42' },
            { transform: { type: 'rightPad', attributes: { input: '42', length: 5, padding: '0' } }, expected: '42000' },
            { transform: { type: 'lastIndexOf', attributes: { input: 'a.b.c', substring: { type: 'static', attributes: { value: '.' } } } }, expected: 3 },
            { transform: { type: 'substring', attributes: { input: 'abcdef', begin: -1, beginOffset: 2, end: 3 } }, expected: 'abc' },
            { transform: { type: 'substring', attributes: { input: 'abcdef', begin: 1, end: 0, endOffset: 4 } }, expected: 'bcd' },
            { transform: { type: 'split', attributes: { input: 'a,b', delimiter: ',', index: 5 } }, expected: null },
            { transform: { type: 'replaceAll', attributes: { input: 'a-b_c', table: { '-': ' ', '_': ' ' } } }, expected: 'a b c' },
            { transform: { type: 'e164phone', attributes: { input: '06 12 34 56 78', defaultRegion: 'FR' } }, expected: '+33612345678' },
            { transform: { type: 'e164phone', attributes: { input: '(415) 555-2671' } }, expected: '+14155552671' },
            { transform: { type: 'e164phone', attributes: { input: '+44 20 7946 0958' } }, expected: '+442079460958' },
            { transform: { type: 'e164phone', attributes: { input: '12' } }, expected: null },
            { transform: { type: 'base64Encode', attributes: { input: 'hello' } }, expected: 'aGVsbG8=' },
            { transform: { type: 'rule', attributes: { name: RULE_NAME, operation: 'getEndOfString', numChars: '3', input: 'abcdef' } }, expected: 'def' },
        ];
        tests.forEach(({ transform, expected }) => {
            it(`should evaluate ${transform.type}`, async () => {
                assert.strictEqual(await evaluate(transform), expected);
            });
        });
        it('should throw when split is out of bounds and throws is true', async () => {
            await assert.rejects(evaluate({ type: 'split', attributes: { input: 'a,b', delimiter: ',', index: 5, throws: true } }), /IndexOutOfBoundsException/);
        });
        it('should reject an invalid e164phone region', async () => {
            await assert.rejects(evaluate({ type: 'e164phone', attributes: { input: '1', defaultRegion: 'XX' } }), /Invalid defaultRegion 'XX'/);
            await assert.rejects(evaluate({ type: 'e164phone', attributes: { input: '1', defaultRegion: 'FRA' } }), /ISO 3166-1 alpha-2/);
        });
        it('should check the rule name', async () => {
            await assert.rejects(evaluate({ type: 'rule', attributes: { name: 'Other', operation: 'getEndOfString', numChars: 1, input: 'a' } }), /Invalid attributes.name/);
        });
    });

    describe('value transforms', () => {
        it('should resolve variables in conditional', async () => {
            const result = await evaluate({
                type: 'conditional',
                attributes: {
                    expression: '$department eq Engineering',
                    department: { type: 'static', attributes: { value: 'Engineering' } },
                    positiveCondition: '$label',
                    negativeCondition: 'other',
                    label: 'eng',
                }
            });
            assert.strictEqual(result, 'eng');
        });
        it('should only evaluate the selected branch of conditional', async () => {
            const result = await evaluate({
                type: 'conditional',
                attributes: { expression: 'a eq b', positiveCondition: '$missing', negativeCondition: 'no' }
            });
            assert.strictEqual(result, 'no');
        });
        it('should resolve a literal variable in static', async () => {
            assert.strictEqual(await evaluate({ type: 'static', attributes: { value: '$v', v: 'x' } }), 'x');
        });
        it('should return the first non-null value of firstValid', async () => {
            const result = await evaluate({
                type: 'firstValid',
                attributes: { values: [{ type: 'lookup', attributes: { input: 'x', table: {} } }, 'second', 'third'] }
            });
            assert.strictEqual(result, 'second');
        });
        it('should ignore errors in firstValid when ignoreErrors is true', async () => {
            const transform = { type: 'firstValid', attributes: { values: [{ type: 'identityAttribute', attributes: { name: 'email' } }, 'fallback'] } };
            await assert.rejects(evaluate(transform), TransformError);
            assert.strictEqual(await evaluate({ ...transform, attributes: { ...transform.attributes, ignoreErrors: 'true' } }), 'fallback');
        });
        it('should use the default of lookup', async () => {
            assert.strictEqual(await evaluate({ type: 'lookup', attributes: { input: 'x', table: { a: '1', default: 'd' } } }), 'd');
        });
        it('should evaluate a reference', async () => {
            const context = new FakeContext('Jean', {}, { 'To Upper': { name: 'To Upper', type: 'upper', attributes: {} } });
            assert.strictEqual(await evaluate({ type: 'reference', attributes: { id: 'To Upper' } }, context), 'JEAN');
        });
        it('should compare dates', async () => {
            const result = await evaluate({
                type: 'dateCompare',
                attributes: { firstDate: '2020-01-01T00:00:00Z', secondDate: 'now', operator: 'LT', positiveCondition: 'past', negativeCondition: 'future' }
            });
            assert.strictEqual(result, 'past');
        });
    });

    describe('static with Velocity', () => {
        const tests = [
            { title: 'several variables', attributes: { value: '$firstName.$lastName', firstName: 'john', lastName: 'doe' }, expected: 'john.doe' },
            { title: 'Java string methods', attributes: { value: '$fn.substring(0,1).toUpperCase()$ln.toLowerCase()', fn: 'john', ln: 'DOE' }, expected: 'Jdoe' },
            { title: 'length()', attributes: { value: '$v.length()', v: 'abcd' }, expected: '4' },
            { title: 'equalsIgnoreCase()', attributes: { value: '#if($v.equalsIgnoreCase("EMPLOYEE"))E#{else}C#end', v: 'employee' }, expected: 'E' },
            { title: 'Java replace() of every occurrence', attributes: { value: '$v.replace("-", "")', v: 'a-b-c' }, expected: 'abc' },
            { title: 'Java split() with a regex', attributes: { value: '$v.split("[,;]")[1]', v: 'a;b,c' }, expected: 'b' },
            { title: '#if/#else', attributes: { value: "#if($type == 'Employee')Full-Time#{else}Contingent#end", type: 'Contractor' }, expected: 'Contingent' },
            { title: '#set', attributes: { value: '#set($sep = "_")$a$sep$b', a: 'x', b: 'y' }, expected: 'x_y' },
            { title: 'undefined references as is', attributes: { value: '[$missing][$!missing]' }, expected: '[$missing][]' },
            { title: 'no HTML escaping', attributes: { value: '$v & co', v: '<b>' }, expected: '<b> & co' },
        ];
        tests.forEach(({ title, attributes, expected }) => {
            it(`should render ${title}`, async () => {
                assert.strictEqual(await evaluate({ type: 'static', attributes }), expected);
            });
        });
        it('should evaluate nested transforms as variables', async () => {
            const result = await evaluate({
                type: 'static',
                attributes: {
                    value: '$initial$last',
                    initial: { type: 'substring', attributes: { input: 'john', begin: 0, end: 1 } },
                    last: { type: 'lower', attributes: { input: 'DOE' } },
                }
            });
            assert.strictEqual(result, 'jdoe');
        });
        it('should only evaluate the referenced attributes', async () => {
            const context = new FakeContext();
            await evaluate({ type: 'static', attributes: { value: 'fixed', unused: { type: 'upper' } } }, context);
            assert.strictEqual(context.implicitInputCalls, 0);
        });
        it('should ignore errors of variables when ignoreErrors is true', async () => {
            const attributes = { value: '$!email', email: { type: 'identityAttribute', attributes: { name: 'email' } } };
            await assert.rejects(evaluate({ type: 'static', attributes }), TransformError);
            assert.strictEqual(await evaluate({ type: 'static', attributes: { ...attributes, ignoreErrors: true } }), '');
        });
        it('should report an invalid template', async () => {
            await assert.rejects(evaluate({ type: 'static', attributes: { value: '#if(' } }), /Invalid Velocity template/);
        });
    });

    describe('date transforms', () => {
        const dateFormats = [
            { input: '2024-03-05T14:07:09.123Z', inputFormat: undefined, outputFormat: undefined, expected: '2024-03-05T14:07:09.123Z' },
            { input: '2024-03-05T14:07:09Z', inputFormat: 'ISO8601', outputFormat: 'PEOPLE_SOFT', expected: '03/05/2024' },
            { input: '03/05/2024', inputFormat: 'PEOPLE_SOFT', outputFormat: 'ISO8601', expected: '2024-03-05T00:00:00.000Z' },
            { input: '20240305140709.0Z', inputFormat: 'LDAP', outputFormat: 'ISO8601', expected: '2024-03-05T14:07:09.000Z' },
            { input: '2024-03-05T14:07:09Z', inputFormat: 'ISO8601', outputFormat: 'LDAP', expected: '20240305140709.+0000' },
            { input: '1709647629000', inputFormat: 'EPOCH_TIME_JAVA', outputFormat: 'ISO8601', expected: '2024-03-05T14:07:09.000Z' },
            { input: '2024-03-05T14:07:09Z', inputFormat: 'ISO8601', outputFormat: 'EPOCH_TIME_WIN32', expected: '133541212290000000' },
            { input: '133541212290000000', inputFormat: 'EPOCH_TIME_WIN32', outputFormat: 'EPOCH_TIME_JAVA', expected: '1709647629000' },
            { input: '20240305', inputFormat: 'yyyyMMdd', outputFormat: "EEEE d MMMM yyyy 'at' h:mm a", expected: 'Tuesday 5 March 2024 at 12:00 AM' },
            { input: '5-Mar-24 2:07 PM', inputFormat: 'd-MMM-yy h:mm a', outputFormat: 'yyyy-MM-dd HH:mm', expected: '2024-03-05 14:07' },
            { input: '2024-03-05 16:07 +0200', inputFormat: 'yyyy-MM-dd HH:mm Z', outputFormat: "HH:mm'Z'", expected: '14:07Z' },
        ];
        dateFormats.forEach(({ input, inputFormat, outputFormat, expected }) => {
            it(`should format '${input}' from ${inputFormat ?? 'default'} to ${outputFormat ?? 'default'}`, async () => {
                assert.strictEqual(await evaluate({ type: 'dateFormat', attributes: { input, inputFormat, outputFormat } }), expected);
            });
        });
        it('should reject a date that does not match the input format', async () => {
            await assert.rejects(evaluate({ type: 'dateFormat', attributes: { input: '2024-03-05', inputFormat: 'MM/dd/yyyy' } }), /does not match the format/);
        });
        it('should report unsupported pattern letters as not implemented', async () => {
            await assert.rejects(evaluate({ type: 'dateFormat', attributes: { input: '2024-03-05T00:00:00Z', outputFormat: 'D' } }), NotImplementedError);
        });

        const dateMaths = [
            { input: '2024-01-31T10:20:30Z', expression: '+1M', roundUp: false, expected: '2024-02-29T10:20:30.000Z' },
            { input: '2024-03-05T10:20:30Z', expression: '-1y+2w-3d+4h-5m+6s', roundUp: false, expected: '2023-03-16T14:15:36.000Z' },
            { input: '2024-03-05T10:20:30Z', expression: '/d', roundUp: false, expected: '2024-03-05T00:00:00.000Z' },
            { input: '2024-03-05T10:20:30Z', expression: '/d', roundUp: true, expected: '2024-03-05T23:59:59.999Z' },
            { input: '2024-03-07T10:20:30Z', expression: '/w', roundUp: false, expected: '2024-03-04T00:00:00.000Z' },
            { input: '2024-03-05T10:20:30Z', expression: '+1d/M', roundUp: true, expected: '2024-03-31T23:59:59.999Z' },
        ];
        dateMaths.forEach(({ input, expression, roundUp, expected }) => {
            it(`should apply '${expression}'${roundUp ? ' rounding up' : ''}`, async () => {
                assert.strictEqual(await evaluate({ type: 'dateMath', attributes: { input, expression, roundUp } }), expected);
            });
        });
        it('should not ask the input when the expression starts with now', async () => {
            const context = new FakeContext();
            const result = await evaluate({ type: 'dateMath', attributes: { expression: 'now/y' } }, context);
            assert.strictEqual(result, `${new Date().getUTCFullYear()}-01-01T00:00:00.000Z`);
            assert.strictEqual(context.implicitInputCalls, 0);
        });
        it('should only accept rounding at the end', async () => {
            await assert.rejects(evaluate({ type: 'dateMath', attributes: { input: '2024-03-05T10:20:30Z', expression: '/d+1h' } }), /Invalid date math expression/);
        });
    });

    describe('country, language and name transforms', () => {
        const tests = [
            { transform: { type: 'iso3166', attributes: { input: 'France' } }, expected: 'FR' },
            { transform: { type: 'iso3166', attributes: { input: 'us', format: 'alpha3' } }, expected: 'USA' },
            { transform: { type: 'iso3166', attributes: { input: 'ESP', format: 'numeric' } }, expected: '724' },
            { transform: { type: 'iso3166', attributes: { input: '4', format: 'alpha2' } }, expected: 'AF' },
            { transform: { type: 'iso3166', attributes: { input: 'Atlantis' } }, expected: null },
            { transform: { type: 'rfc5646', attributes: { input: 'English' } }, expected: 'en' },
            { transform: { type: 'rfc5646', attributes: { input: 'fra' } }, expected: 'fr' },
            { transform: { type: 'rfc5646', attributes: { input: 'Klingon' } }, expected: null },
        ];
        tests.forEach(({ transform, expected }) => {
            it(`should convert '${transform.attributes.input}' with ${transform.type}`, async () => {
                assert.strictEqual(await evaluate(transform), expected);
            });
        });
        it('should reject an invalid iso3166 format', async () => {
            await assert.rejects(evaluate({ type: 'iso3166', attributes: { input: 'FR', format: 'alpha4' } }), /Invalid format/);
        });
        it('should prefer the preferred name in displayName', async () => {
            const input = { givenName: 'Robert', familyName: 'Smith', preferredName: { type: 'static', attributes: { value: 'Bob' } } };
            assert.strictEqual(await evaluate({ type: 'displayName', attributes: { input } }), 'Bob Smith');
            assert.strictEqual(await evaluate({ type: 'displayName', attributes: { input: { ...input, preferredName: '' } } }), 'Robert Smith');
        });
        it('should require a map as displayName input', async () => {
            await assert.rejects(evaluate({ type: 'displayName', attributes: { input: 'Bob' } }), /must be a map/);
        });
        it('should explain why usernameGenerator is not evaluated', async () => {
            await assert.rejects(evaluate({ type: 'usernameGenerator', attributes: { type: 'usernameGenerator', patterns: ['$fn'] } }), /cannot be evaluated locally/);
        });
    });

    describe('generators', () => {
        it('should accept a string length', async () => {
            assert.match(await evaluate({ type: 'randomNumeric', attributes: { length: '6' } }), /^[0-9]{6}$/);
        });
        it('should default to 32 characters', async () => {
            assert.match(await evaluate({ type: 'randomAlphaNumeric' }), /^[a-zA-Z0-9]{32}$/);
        });
        it('should reject a length above 450', async () => {
            await assert.rejects(evaluate({ type: 'randomNumeric', attributes: { length: 451 } }), /Maximum allowable length/);
        });
    });

    describe('identity transforms', () => {
        const identities = {
            'john.doe': {
                id: 'john-id',
                attributes: { email: 'john@example.com' },
                manager: { name: 'jane.boss' },
            },
            'jane.boss': { attributes: { email: 'jane@example.com' } },
        };
        const account = (nativeIdentity: string, created: string, attributes: any, properties: any = {}) =>
            ({ identityId: 'john-id', sourceId: 'hr-id', nativeIdentity, name: nativeIdentity, created, attributes, ...properties });
        const accounts = [
            account('E002', '2021-06-01T00:00:00Z', { department: 'Sales', type: 'Employee' }),
            account('E001', '2020-01-01T00:00:00Z', { department: null, type: 'Employee' }),
            account('*DELETED*E000', '2019-01-01T00:00:00Z', { department: 'Legal', type: 'Contractor' }, { disabled: true }),
            { ...account('X001', '2018-01-01T00:00:00Z', { department: 'Other source' }), sourceId: 'other-id' },
        ];
        const accountAttribute = (attributes: any) =>
            evaluate({ type: 'accountAttribute', attributes: { sourceName: 'HR', attributeName: 'department', ...attributes } }, new FakeContext('', identities, {}, accounts));

        it('should get an identity attribute', async () => {
            assert.strictEqual(await evaluate({ type: 'identityAttribute', attributes: { name: 'email' } }, new FakeContext('', identities)), 'john@example.com');
        });
        it('should return the first non-null value of the oldest accounts first', async () => {
            assert.strictEqual(await accountAttribute({}), 'Legal');
        });
        it('should return the value of the first account with accountReturnFirstLink', async () => {
            assert.strictEqual(await accountAttribute({ accountFilter: '!(nativeIdentity.startsWith("*DELETED*"))', accountReturnFirstLink: true }), null);
        });
        it('should sort the accounts', async () => {
            assert.strictEqual(await accountAttribute({ accountSortDescending: 'true' }), 'Sales');
            assert.strictEqual(await accountAttribute({ accountSortAttribute: 'nativeIdentity', accountFilter: 'disabled != true' }), 'Sales');
        });
        it('should filter on account properties and attributes', async () => {
            assert.strictEqual(await accountAttribute({ accountFilter: '!(nativeIdentity.startsWith("*DELETED*"))' }), 'Sales');
            assert.strictEqual(await accountAttribute({ accountPropertyFilter: '(type == "Contractor" || department.isNull())', accountReturnFirstLink: true }), 'Legal');
            assert.strictEqual(await accountAttribute({ accountPropertyFilter: 'type.in({"Employee"}) && department.notNull()' }), 'Sales');
            assert.strictEqual(await accountAttribute({ accountPropertyFilter: 'type == "Nobody"' }), null);
        });
        it('should report an invalid filter', async () => {
            await assert.rejects(accountAttribute({ accountFilter: 'nativeIdentity ==' }), /Invalid filter 'nativeIdentity =='/);
            await assert.rejects(accountAttribute({ accountFilter: 'name.foo("x")' }), /unknown method/);
        });
        it('should report an identity without account on the source', async () => {
            await assert.rejects(
                evaluate({ type: 'accountAttribute', attributes: { sourceName: 'HR', attributeName: 'department' } }, new FakeContext('', identities)),
                /No account found/);
        });
        it('should get a manager attribute', async () => {
            const result = await evaluate({
                type: 'rule',
                attributes: { name: RULE_NAME, operation: 'getReferenceIdentityAttribute', uid: 'manager', attributeName: 'email' }
            }, new FakeContext('', identities));
            assert.strictEqual(result, 'jane@example.com');
        });
        it('should ask the identity once per evaluation', async () => {
            const context = new FakeContext('', identities, {}, accounts);
            const result = await evaluate({
                type: 'concat',
                attributes: { values: [{ type: 'identityAttribute', attributes: { name: 'email' } }, { type: 'accountAttribute', attributes: { sourceName: 'HR', attributeName: 'department' } }] }
            }, context);
            assert.strictEqual(result, 'john@example.comLegal');
            assert.strictEqual(context.identityCalls, 1);
        });
    });
});
