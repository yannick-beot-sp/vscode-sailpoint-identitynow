import * as assert from 'assert';
import { describe, it } from 'mocha';
import { applyNotificationTemplateExamples } from '../../commands/notification-template/previewExamples';
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

        it('walks nested properties and joins primitive arrays', () => {
            const rendered = applyNotificationTemplateExamples(
                '$!{requesterComment.author.name}: $accessibleItems',
                variables,
            );
            assert.strictEqual(rendered, 'Rebecca Requester: Sales Access, Finance Reporting');
        });

        it('keeps unknown references and function calls', () => {
            const rendered = applyNotificationTemplateExamples(
                '$notAVariable $requestedFor.missing $spTools.formatDate($requestedForIdentityName)',
                variables,
            );
            assert.strictEqual(
                rendered,
                '$notAVariable $requestedFor.missing $spTools.formatDate(Ruby Requestee)',
            );
        });

        it('renders a null sample as empty and skips velocity usage snippets', () => {
            const rendered = applyNotificationTemplateExamples('[$__global.emailOverride][$nowDate]', variables);
            assert.strictEqual(rendered, '[][$nowDate]');
        });

        it('lets the first catalog entry win and escapes html', () => {
            assert.strictEqual(applyNotificationTemplateExamples('$owner', variables), 'Template Owner');
            assert.strictEqual(
                applyNotificationTemplateExamples('<p>$note</p>', variables),
                '<p>Tom &amp; &lt;Jerry&gt; &quot;quoted&quot;</p>',
            );
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
    });
});
