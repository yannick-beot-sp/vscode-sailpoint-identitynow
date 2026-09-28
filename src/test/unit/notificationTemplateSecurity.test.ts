import * as assert from 'assert';
import { it, describe } from 'mocha';
import { highlightJson } from '../../commands/identity/jsonDrawerSnippet.js';
import { buildNotificationTemplatePreviewHtml, buildNotificationTemplatePreviewPage } from '../../commands/notification-template/previewHtml.js';
import {
    notificationTemplateIdentityConflict,
    selectNotificationTemplate,
    wouldReplaceNonEmptyBody,
} from '../../commands/notification-template/templateGuards.js';

suite('notification template security Test Suite', () => {
    describe('selectNotificationTemplate', () => {
        const stored = {
            id: 'tpl-1',
            key: 'access_request',
            medium: 'EMAIL',
            locale: 'en',
            body: '<p>Hello ${user.name}</p>',
        };

        it('keeps the list body when GET returns an empty body', () => {
            const selected = selectNotificationTemplate(
                { ...stored, body: '' },
                stored,
            );
            assert.strictEqual(selected?.body, stored.body);
            assert.strictEqual(selected?.key, stored.key);
        });

        it('keeps the GET body when the list copy is shorter', () => {
            const selected = selectNotificationTemplate(
                stored,
                { ...stored, body: '<p>Hello' },
            );
            assert.strictEqual(selected?.body, stored.body);
        });

        it('uses the list when GET returned nothing', () => {
            const selected = selectNotificationTemplate(undefined, stored);
            assert.strictEqual(selected, stored);
        });
    });

    describe('notificationTemplateIdentityConflict', () => {
        const stored = { id: 'tpl-1', key: 'access_request', medium: 'EMAIL', locale: 'en' };

        it('accepts a save of the same template', () => {
            assert.strictEqual(notificationTemplateIdentityConflict(stored, { ...stored, body: '<p>x</p>' }), undefined);
        });

        it('rejects a key change that would upsert a different template', () => {
            assert.strictEqual(
                notificationTemplateIdentityConflict(stored, { ...stored, key: 'other' }),
                'key',
            );
        });

        it('rejects an id that does not match the opened template', () => {
            assert.strictEqual(
                notificationTemplateIdentityConflict(stored, { ...stored, id: 'tpl-2' }),
                'id',
            );
        });
    });

    describe('wouldReplaceNonEmptyBody', () => {
        it('refuses to replace a stored body with an empty one', () => {
            assert.strictEqual(wouldReplaceNonEmptyBody('<p>Hello</p>', '   '), true);
        });

        it('allows a non-empty edit and an already empty body', () => {
            assert.strictEqual(wouldReplaceNonEmptyBody('<p>Hello</p>', '<p>Hi</p>'), false);
            assert.strictEqual(wouldReplaceNonEmptyBody('', ''), false);
        });
    });

    describe('buildNotificationTemplatePreviewHtml', () => {
        const hostile = '</head><meta http-equiv="Content-Security-Policy" content="default-src *"><script>alert(1)</script><img src="https://evil.test/pixel.png"><iframe src="https://evil.test/"></iframe>';

        it('keeps the fragment inside a sandboxed srcdoc and blocks remote content', () => {
            const html = buildNotificationTemplatePreviewHtml(hostile);
            assert.strictEqual(html.match(/<iframe/g)?.length, 1);
            assert.ok(html.includes('sandbox="allow-popups allow-popups-to-escape-sandbox"'));
            assert.ok(!html.includes('allow-scripts'));
            assert.ok(html.includes("img-src data:"));
            assert.ok(!html.includes('img-src https'));
            assert.ok(!html.includes('style-src \'unsafe-inline\' https'));
            assert.ok(!html.includes('<script>alert(1)</script>'));
            assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
            assert.ok(!html.includes('src="https://evil.test/pixel.png"'));
        });
    });

    describe('buildNotificationTemplatePreviewPage', () => {
        const hostile = '"></iframe><script>alert(1)</script><img src="https://evil.test/pixel.png">';

        it('puts a header checkbox above one sandboxed frame', () => {
            const html = buildNotificationTemplatePreviewPage({
                body: '<p>Hello ${user.name}</p>',
                showExamples: false,
                nonce: 'nonce-1',
            });
            assert.ok(html.includes('id="example-values"'));
            assert.ok(!html.includes('id="example-values" type="checkbox" checked'));
            assert.strictEqual(html.match(/<iframe/g)?.length, 1);
            assert.ok(html.includes('sandbox="allow-popups allow-popups-to-escape-sandbox"'));
            assert.ok(!html.includes('allow-scripts'));
            assert.ok(html.includes("script-src 'nonce-nonce-1'"));
            assert.ok(html.includes('<script nonce="nonce-1">'));
        });

        it('checks the box when example values are shown', () => {
            const html = buildNotificationTemplatePreviewPage({
                body: '<p>Ruby Requestee</p>',
                showExamples: true,
                nonce: 'nonce-2',
            });
            assert.ok(html.includes('id="example-values" type="checkbox" checked'));
            assert.ok(html.includes('Ruby Requestee'));
        });

        it('shows an escaped Velocity rendering error', () => {
            const html = buildNotificationTemplatePreviewPage({
                body: '<p>Template source</p>',
                showExamples: true,
                nonce: 'nonce-error',
                error: '<script>alert("error")</script>',
            });
            assert.ok(html.includes('Velocity error: &lt;script&gt;alert(&quot;error&quot;)&lt;/script&gt;'));
            assert.ok(!html.includes('<script>alert("error")</script>'));
        });

        it('keeps a hostile fragment inside the escaped srcdoc', () => {
            const html = buildNotificationTemplatePreviewPage({
                body: hostile,
                showExamples: false,
                nonce: 'nonce-3',
            });
            assert.ok(!html.includes('<script>alert(1)</script>'));
            assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
            assert.ok(!html.includes('src="https://evil.test/pixel.png"'));
            assert.strictEqual(html.match(/<script /g)?.length, 1);
            assert.ok(html.includes('id="examples" hidden'));
            assert.ok(html.includes('id="example-json"'));
            assert.ok(html.includes('Update preview'));
        });

        it('shows escaped example JSON in the editor', () => {
            const html = buildNotificationTemplatePreviewPage({
                body: '<p>Ruby</p>',
                showExamples: true,
                nonce: 'nonce-json',
                examplesJson: '{\n  "name": "Tom & <Jerry>"\n}',
                jsonError: '</p><script>alert(1)</script>',
            });
            assert.ok(!html.includes('id="examples" hidden'));
            assert.ok(html.includes('&quot;name&quot;: &quot;Tom &amp; &lt;Jerry&gt;&quot;'));
            assert.ok(html.includes('&lt;/p&gt;&lt;script&gt;alert(1)&lt;/script&gt;'));
            assert.ok(!html.includes('<script>alert(1)</script>'));
            assert.strictEqual(html.match(/<script /g)?.length, 1);
        });

        it('colors example JSON with the shared highlighter', () => {
            const sample = '{\n  "name": "a<b&c",\n  "ok": true,\n  "n": -2.5,\n  "z": null\n}';
            const html = buildNotificationTemplatePreviewPage({
                body: '<p>Ruby</p>',
                showExamples: true,
                nonce: 'nonce-color',
                examplesJson: sample,
            });
            assert.ok(html.includes('id="example-editor"'));
            assert.ok(html.includes('id="example-highlight" aria-hidden="true"'));
            assert.ok(html.includes('.json-key'));
            assert.ok(html.includes('.json-string'));
            assert.ok(html.includes('function paintExamples'));
            assert.strictEqual(html.match(/<script /g)?.length, 1);

            const script = html.match(/<script nonce="nonce-color">([\s\S]*?)<\/script>/)?.[1] ?? '';
            const start = script.indexOf('function highlightJson');
            const end = script.indexOf('const vscode');
            assert.ok(start >= 0 && end > start);
            const run = new Function(`${script.slice(start, end)}\nreturn highlightJson;`) as () => (json: string) => string;
            const colored = run()(sample);
            assert.strictEqual(colored, highlightJson(sample));
            assert.ok(colored.includes('<span class="json-key">"name"</span>:'));
            assert.ok(colored.includes('<span class="json-string">"a&lt;b&amp;c"</span>'));
            assert.ok(!colored.includes('<b'));
            assert.ok(html.includes('&quot;name&quot;'));
            assert.ok(!html.includes(colored));
        });

        it('keeps a textarea breakout inside the example JSON', () => {
            const html = buildNotificationTemplatePreviewPage({
                body: '<p>Hello</p>',
                showExamples: true,
                nonce: 'nonce-breakout',
                examplesJson: '</textarea><script>alert(1)</script>',
            });
            assert.ok(html.includes('&lt;/textarea&gt;&lt;script&gt;alert(1)&lt;/script&gt;'));
            assert.ok(!html.includes('</textarea><script>alert(1)</script>'));
            assert.strictEqual(html.match(/<script /g)?.length, 1);
            assert.strictEqual(html.match(/<iframe/g)?.length, 1);
        });
    });
});
