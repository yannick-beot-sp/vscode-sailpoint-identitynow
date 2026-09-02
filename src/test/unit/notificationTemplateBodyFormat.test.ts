import * as assert from 'assert';
import { it, describe } from 'mocha';
import { formatNotificationTemplateBody } from '../../commands/notification-template/formatBody';

/**
 * Collapse every run of whitespace that sits between tags or at a text-node edge,
 * so two HTML strings compare equal iff they render the same (a newline that a
 * browser would turn into a space is intentionally NOT collapsed here - that is
 * exactly the kind of change the formatter must not make).
 */
function renderShape(html: string): string {
	return html
		.replace(/>[ \t\r\n]+</g, '><')
		.replace(/^[ \t\r\n]+/, '')
		.replace(/[ \t\r\n]+$/, '');
}

suite('formatNotificationTemplateBody Test Suite', () => {
	const SPAN = '<span style="font-family:\'arial\' , \'helvetica\' , sans-serif;font-size:10pt">';
	const wysiwygBody = [
		'<div>' + SPAN + 'Beste $!{user.preferredFirstName},</span>' + SPAN + ' </span></div>',
		'<div><p>' + SPAN + 'Er is toegang aangevraagd voor ${requestedForIdentityName}<br /></span>'
		+ SPAN + ' Beoordeel deze aanvraag via: </span>'
		+ '<a href="https://example.com/approvals">link</a>' + SPAN + '. </span></p>',
		'<!--[if mso]><table><tr><td><![endif]-->',
		'<p>Test <a href="$identityNowUrl">SailPoint</a> einde.</p></div>',
	].join('\n');

	describe('render stability', () => {
		it('does not change the rendered shape of a WYSIWYG body', () => {
			const formatted = formatNotificationTemplateBody(wysiwygBody);
			assert.strictEqual(renderShape(formatted), renderShape(wysiwygBody));
		});

		it('keeps adjacent inline elements on the same line (no space inserted)', () => {
			const formatted = formatNotificationTemplateBody(wysiwygBody);
			assert.ok(/<\/span><a /.test(formatted), 'expected </span><a to stay contiguous');
			assert.ok(/<\/a><span /.test(formatted), 'expected </a><span to stay contiguous');
			assert.ok(!/<\/span>\s*\n\s*<span/.test(formatted), 'a newline between inline spans would render as a space');
		});

		it('is idempotent', () => {
			const once = formatNotificationTemplateBody(wysiwygBody);
			const twice = formatNotificationTemplateBody(once);
			assert.strictEqual(twice, once);
		});

		it('preserves Velocity placeholders verbatim', () => {
			const formatted = formatNotificationTemplateBody(wysiwygBody);
			assert.ok(formatted.includes('$!{user.preferredFirstName}'));
			assert.ok(formatted.includes('${requestedForIdentityName}'));
			assert.ok(formatted.includes('href="$identityNowUrl"'));
		});

		it('preserves Outlook conditional comments', () => {
			const formatted = formatNotificationTemplateBody(wysiwygBody);
			assert.ok(formatted.includes('<!--[if mso]><table><tr><td><![endif]-->'));
		});
	});
});
