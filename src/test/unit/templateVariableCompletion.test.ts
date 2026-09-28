import * as assert from 'assert';
import { describe, it } from 'mocha';
import { defaultNotificationTemplateId } from '../../utils/notificationTemplateList.js';
import {
    completionVariables,
    resolveTemplateIdentity,
    templateVariablesFor,
    velocityInsertText,
    velocityPrefixLength,
} from '../../commands/notification-template/templateVariableCompletion.js';
import { globalVariables, templateVariables } from '../../commands/notification-template/templateVariables.js';

suite('template variable completion Test Suite', () => {
    describe('velocityInsertText', () => {
        it('inserts a quiet reference for a data variable', () => {
            assert.strictEqual(velocityInsertText({
                key: '__global.productName',
                type: 'string',
                description: 'Product name',
                example: 'SailPoint',
            }), '$!{__global.productName}');
        });

        it('inserts the primary function example', () => {
            assert.strictEqual(velocityInsertText({
                key: '__esc.html()',
                type: 'function',
                description: 'HTML escape',
                example: "$__esc.html($value) or $__esc.html($other)",
            }), '$__esc.html($value)');
        });

        it('inserts the first call when the example is numbered', () => {
            assert.strictEqual(velocityInsertText({
                key: 'spTools.formatDate()',
                type: 'function',
                description: 'Format a date',
                example: "1: $spTools.formatDate($nowDate) - 2: $spTools.formatDate($nowDate, 2, 2)",
            }), '$spTools.formatDate($nowDate)');
        });
    });

    describe('velocityPrefixLength', () => {
        it('matches a velocity prefix at the cursor', () => {
            assert.strictEqual(velocityPrefixLength('Hello $__glob'), '$__glob'.length);
            assert.strictEqual(velocityPrefixLength('$!{user'), '$!{user'.length);
        });

        it('ignores text that is not a variable', () => {
            assert.strictEqual(velocityPrefixLength('Hello'), undefined);
        });
    });

    describe('resolveTemplateIdentity', () => {
        it('reads the key and medium from the body URI query', () => {
            assert.deepStrictEqual(
                resolveTemplateIdentity(
                    '/beta/notification-template-body/custom-1/Access%20Request',
                    'key=access_request_reviewer&medium=EMAIL',
                    '<p>Hello</p>',
                ),
                { key: 'access_request_reviewer', medium: 'EMAIL' },
            );
        });

        it('reads a default template id when the query is absent', () => {
            const id = defaultNotificationTemplateId({
                key: 'approval_request_notification',
                medium: 'EMAIL',
                locale: 'en',
            });
            assert.deepStrictEqual(
                resolveTemplateIdentity(`/beta/notification-template-body/${id}/Approval`, '', ''),
                { key: 'approval_request_notification', medium: 'EMAIL' },
            );
        });

        it('reads the key and medium from the template JSON', () => {
            assert.deepStrictEqual(
                resolveTemplateIdentity(
                    '/beta/notification-templates/custom-1/Approval',
                    '',
                    '{ "key": "certification", "medium": "EMAIL", "body": "Hello" }',
                ),
                { key: 'certification', medium: 'EMAIL' },
            );
        });
    });

    describe('catalog', () => {
        it('stores a description and an example on every variable', () => {
            const templateEntries = Object.values(templateVariables).flatMap((byMedium) => Object.values(byMedium).flat());
            for (const variable of [...globalVariables, ...templateEntries]) {
                assert.ok(variable.key, 'key');
                assert.ok(variable.description, variable.key);
                assert.ok(Object.prototype.hasOwnProperty.call(variable, 'example'), variable.key);
            }
            assert.ok(globalVariables.length > 0);
            assert.ok(templateEntries.length > 0);
        });

        it('offers PRODUCT_NAME with the same example as __global.productName', () => {
            const productName = globalVariables.find((variable) => variable.key === '__global.productName');
            const legacy = globalVariables.find((variable) => variable.key === 'PRODUCT_NAME');
            assert.ok(productName);
            assert.ok(legacy);
            assert.strictEqual(legacy.type, productName.type);
            assert.strictEqual(legacy.description, productName.description);
            assert.strictEqual(legacy.example, productName.example);
            assert.strictEqual(legacy.example, 'SailPoint');
        });

        it('offers template variables before the global ones', () => {
            const identity = { key: Object.keys(templateVariables)[0], medium: 'EMAIL' };
            const mediums = Object.keys(templateVariables[identity.key]);
            identity.medium = mediums[0];
            const items = completionVariables(identity);
            assert.ok(items.length > templateVariablesFor(identity).length);
            assert.strictEqual(items[0].scope, 'template');
            assert.strictEqual(items[items.length - 1].scope, 'global');
        });
    });
});
