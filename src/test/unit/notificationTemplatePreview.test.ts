import * as assert from 'assert';
import { describe, it } from 'mocha';
import { applyNotificationTemplateExamples, exampleValueMap, parseExampleValues } from '../../commands/notification-template/previewExamples';
import { completionVariables } from '../../commands/notification-template/templateVariableCompletion';
import { NotificationTemplateVariable } from '../../commands/notification-template/templateVariables';

suite('notification template preview examples Test Suite', () => {
    const variables: NotificationTemplateVariable[] = [
        {
            key: 'requestedForIdentityName',
            type: 'string',
            description: 'Requestee',
            example: 'Ruby Requestee',
        },
        {
            key: 'requestedFor',
            type: 'object',
            description: 'Requestee identity',
            example: { name: 'Ruby Requestee', id: 'abc' },
        },
        {
            key: 'requesterComment',
            type: 'object',
            description: 'Comment',
            example: { author: { name: 'Rebecca Requester' } },
        },
        {
            key: 'accessibleItems',
            type: 'array',
            description: 'Items',
            example: ['Sales Access', 'Finance Reporting'],
        },
        {
            key: '__global.emailOverride',
            type: 'string',
            description: 'Override',
            example: null,
        },
        {
            key: '__global.productName',
            type: 'string',
            description: 'Product',
            example: 'SailPoint',
        },
        {
            key: 'owner',
            type: 'string',
            description: 'Template value wins',
            example: 'Template Owner',
        },
        {
            key: 'owner',
            type: 'string',
            description: 'Global value',
            example: 'Global Owner',
        },
        {
            key: 'nowDate',
            type: 'object',
            description: 'Usage snippet, not a sample',
            example: '$nowDate',
        },
        {
            key: 'spTools.formatDate()',
            type: 'function',
            description: 'Format a date',
            example: '$spTools.formatDate($nowDate)',
        },
        {
            key: 'note',
            type: 'string',
            description: 'Needs escaping',
            example: `Tom & <Jerry> "quoted"`,
        },
    ];

    describe('applyNotificationTemplateExamples', () => {
        it('replaces formal, quiet, and informal references', () => {
            const body = '<p>Hi $!{requestedFor.name}, ${requestedForIdentityName} from $__global.productName.</p>';
            const rendered = applyNotificationTemplateExamples(body, variables);
            assert.strictEqual(rendered, '<p>Hi Ruby Requestee, Ruby Requestee from SailPoint.</p>');
        });

        it('walks nested properties and renders arrays', () => {
            const rendered = applyNotificationTemplateExamples(
                '$!{requesterComment.author.name}: #foreach($item in $accessibleItems)$item#if($foreach.hasNext), #end#end',
                variables,
            );
            assert.strictEqual(rendered, 'Rebecca Requester: Sales Access, Finance Reporting');
        });

        it('keeps unknown references and function calls', () => {
            const rendered = applyNotificationTemplateExamples(
                '$notAVariable $requestedFor.missing $unknownTool.call($requestedForIdentityName)',
                variables,
            );
            assert.strictEqual(
                rendered,
                '$notAVariable $requestedFor.missing $unknownTool.call($requestedForIdentityName)',
            );
        });

        it('renders null samples and supplies the current date', () => {
            const rendered = applyNotificationTemplateExamples(
                '[$__global.emailOverride][#if($nowDate)now#end]',
                variables,
            );
            assert.strictEqual(rendered, '[null][now]');
        });

        it('lets the first catalog entry win and preserves Velocity output', () => {
            assert.strictEqual(applyNotificationTemplateExamples('$owner', variables), 'Template Owner');
            assert.strictEqual(
                applyNotificationTemplateExamples('<p>$note</p>', variables),
                '<p>Tom & <Jerry> "quoted"</p>',
            );
        });

        it('evaluates conditionals, assignments, loops, and macros', () => {
            const rendered = applyNotificationTemplateExamples(
                '#set($prefix = "Item")#macro(row $value)<li>$prefix: $value</li>#end'
                + '#if($accessibleItems)#foreach($item in $accessibleItems)#row($item)#end#end',
                variables,
            );
            assert.strictEqual(
                rendered,
                '<li>Item: Sales Access</li><li>Item: Finance Reporting</li>',
            );
        });

        it('provides the playground date helper and a current date', () => {
            const rendered = applyNotificationTemplateExamples(
                '$date.format("yyyy-MM-dd HH:mm:ss", "2025-08-20T22:32:41Z")|'
                + '$__dateTool.iso($__dateTool.parse("2025-08-20T22:32:41Z"))|'
                + '#if($nowDate)now#end',
                variables,
            );
            assert.match(rendered, /^2025-08-\d{2} \d{2}:32:41\|2025-08-20T22:32:41\.000Z\|now$/);
        });

        it('throws a useful error for an invalid Velocity template', () => {
            assert.throws(
                () => applyNotificationTemplateExamples('#foreach($item in)', variables),
                /Parse error/,
            );
        });

        it('blocks prototype assignment and constructor traversal', () => {
            delete (Object.prototype as { previewPolluted?: string }).previewPolluted;
            const rendered = applyNotificationTemplateExamples(
                '#set($__proto__.previewPolluted = "yes")'
                + '#set($fn = $requestedFor.constructor.constructor)'
                + '#set($result = $fn("return process"))$result',
                variables,
            );
            assert.strictEqual((Object.prototype as { previewPolluted?: string }).previewPolluted, undefined);
            assert.strictEqual(rendered, '$result');
        });

        it('interprets the global date, number, escape, and SailPoint tools', () => {
            const rendered = applyNotificationTemplateExamples(
                '#set($dateObj = $__dateTool.toDate("yyyy-MM-dd\'T\'HH:mm:ss", "2023-12-15T15:09:56.99"))'
                + '$__dateTool.format("dd/MM/yyyy", $dateObj)|'
                + '$__dateTool.format("medium", $dateObj)|'
                + '$__dateTool.getYear($dateObj)-$__dateTool.getMonth($dateObj)-$__dateTool.getDay($dateObj)|'
                + '$__esc.html("Tom & <Jerry>")|$__esc.sql("O\'Brien")|$__esc.velocity("$#")|$__esc.unicode("\\u20AC")|'
                + '$__numberTool.integer(1234.6)|$__numberTool.currency(1234.5)|$__numberTool.percent(0.25)|$__numberTool.format(\'#,##0.00\', 1234.5)|'
                + '$__util.sanitizeAndValidateEmailAddress(" user@example.com ")|'
                + '$__util.getObjectByJsonPath($requestedFor, "$.name")',
                variables,
            );
            assert.strictEqual(
                rendered,
                '15/12/2023|Dec 15, 2023|2023-11-15|Tom &amp; &lt;Jerry&gt;|O\'\'Brien|${esc.d}${esc.h}|€|'
                + '1,235|$1,234.50|25%|1,234.50|user@example.com|Ruby Requestee',
            );
        });

        it('formats spTools dates in the calendar timezone and rewrites anchored UI URLs', () => {
            const rendered = applyNotificationTemplateExamples(
                '#set($calendar = $spTools.convertToTimeZone("2022-12-13T15:30:26Z", "UTC"))'
                + '$spTools.formatDate($calendar)|'
                + '$spTools.formatDate($calendar, "MM/dd/yyyy HH:mm")|'
                + '$spTools.formatDate($calendar, 3, 1)|'
                + '$spTools.formatURL("https://tenant.identitynow.com/ui/main#launch:tasks")|'
                + '$spTools.formatURL("https://tenant.identitynow.com/ui/d/dashboard")',
                variables,
            );
            assert.strictEqual(
                rendered,
                '12/13/22 3:30 PM|12/13/2022 15:30|12/13/22 3:30:26 PM UTC|'
                + 'https://tenant.identitynow.com/ui/rest/redirect?url='
                + 'https%3A%2F%2Ftenant.identitynow.com%2Fui%2Fmain%23launch%3Atasks|'
                + 'https://tenant.identitynow.com/ui/d/dashboard',
            );
        });

        it('resolves utility lookups from example values and lets a domain date win', () => {
            const rendered = applyNotificationTemplateExamples(
                '$__util.getUser($__recipient.id).email|'
                + '$__util.getMultipleIdentitiesDetailsByID($__recipient.id, "missing").size()|'
                + '$date',
                [
                    ...variables,
                    {
                        key: '__recipient',
                        type: 'object',
                        description: 'Recipient',
                        example: { id: 'recipient-1', name: 'user.name', email: 'user@example.com', phone: '+15555550100' },
                    },
                    {
                        key: 'date',
                        type: 'string',
                        description: 'Domain value',
                        example: 'domain-date',
                    },
                ],
            );
            assert.strictEqual(rendered, 'user@example.com|1|domain-date');
        });

        it('uses the access-request catalog', () => {
            const catalog = completionVariables({
                key: 'access_request_reassignment',
                medium: 'EMAIL',
            }).map((item) => item.variable);
            const rendered = applyNotificationTemplateExamples(
                'Hello $!{requestedFor.name} at $__global.productName',
                catalog,
            );
            assert.ok(rendered.includes('Ruby Requestee'));
            assert.ok(rendered.includes('SailPoint'));
            assert.ok(!rendered.includes('$!{requestedFor.name}'));
        });

        it('renders edited example values and still provides the tools', () => {
            const rendered = applyNotificationTemplateExamples(
                '$owner|$!{requestedFor.name}|$__global.productName|$__esc.html("a&b")',
                variables,
                {
                    owner: 'Edited Owner',
                    requestedFor: { name: 'Ada' },
                    '__global.productName': 'Acme',
                },
            );
            assert.strictEqual(rendered, 'Edited Owner|Ada|Acme|a&amp;b');
        });

        it('renders the editable map the same way as the catalog', () => {
            const body = '$!{requestedFor.name}|$__global.productName|$owner|$note|$__esc.html("a&b")';
            assert.strictEqual(
                applyNotificationTemplateExamples(body, variables, exampleValueMap(variables)),
                applyNotificationTemplateExamples(body, variables),
            );
            const catalog = completionVariables({
                key: 'access_request_reassignment',
                medium: 'EMAIL',
            }).map((item) => item.variable);
            const catalogBody = '$!{requestedFor.name}|$accessProfileName|$__global.productName';
            assert.strictEqual(
                applyNotificationTemplateExamples(catalogBody, catalog, exampleValueMap(catalog)),
                applyNotificationTemplateExamples(catalogBody, catalog),
            );
        });
    });

    describe('exampleValueMap', () => {
        it('keeps data variables, skips functions and usage snippets, and lets the first key win', () => {
            const values = exampleValueMap(variables);
            assert.deepStrictEqual(Object.keys(values), [
                'requestedForIdentityName',
                'requestedFor',
                'requesterComment',
                'accessibleItems',
                '__global',
                'owner',
                'note',
            ]);
            assert.deepStrictEqual({ ...(values.__global as object) }, {
                emailOverride: null,
                productName: 'SailPoint',
            });
            assert.strictEqual(values.owner, 'Template Owner');
            assert.strictEqual(values['spTools.formatDate()'], undefined);
            assert.strictEqual(values.nowDate, undefined);
            const catalog = completionVariables({
                key: 'access_request_reassignment',
                medium: 'EMAIL',
            }).map((item) => item.variable);
            const catalogValues = exampleValueMap(catalog);
            for (const key of Object.keys(catalogValues)) {
                assert.ok(!key.endsWith('()'), key);
                assert.ok(!key.includes('.'), key);
            }
            assert.strictEqual((catalogValues.__global as Record<string, unknown>).productName, 'SailPoint');
        });

        it('merges nested keys with whole objects and keeps the first value', () => {
            const values = exampleValueMap([
                { key: 'user.name', type: 'string', description: '', example: 'First' },
                { key: 'user', type: 'object', description: '', example: { name: 'Second', id: 'u1' } },
            ]);
            assert.deepStrictEqual({ ...(values.user as object) }, { name: 'First', id: 'u1' });
        });
    });

    describe('parseExampleValues', () => {
        it('accepts a JSON object', () => {
            const parsed = parseExampleValues('{\n  "owner": "Ada"\n}');
            assert.strictEqual(parsed.ok, true);
            if (parsed.ok) {
                assert.strictEqual(parsed.values.owner, 'Ada');
            }
        });

        it('rejects JSON that is not an object', () => {
            assert.strictEqual(parseExampleValues('["owner"]').ok, false);
            assert.strictEqual(parseExampleValues('null').ok, false);
            const invalid = parseExampleValues('{');
            assert.strictEqual(invalid.ok, false);
            if (!invalid.ok) {
                assert.ok(invalid.error.startsWith('Invalid JSON:'));
            }
        });

        it('rejects prototype paths', () => {
            delete (Object.prototype as { previewPolluted?: string }).previewPolluted;
            const parsed = parseExampleValues('{"__proto__":{"previewPolluted":"yes"},"owner":"Ada"}');
            assert.strictEqual(parsed.ok, false);
            assert.strictEqual(parseExampleValues('{"user":{"constructor":{"x":1}}}').ok, false);
            assert.strictEqual(parseExampleValues('{"a.constructor":1}').ok, false);
            assert.strictEqual((Object.prototype as { previewPolluted?: string }).previewPolluted, undefined);
        });
    });
});
