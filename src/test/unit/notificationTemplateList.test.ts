import * as assert from 'assert';
import { describe, it } from 'mocha';
import {
	defaultNotificationTemplateId,
	filterNotificationTemplates,
	isDefaultNotificationTemplateId,
	mergeNotificationTemplates,
	notificationTemplateDescription,
	notificationTemplateKeyFilter,
	notificationTemplateWebUiSegments,
	parseDefaultNotificationTemplateId,
} from '../../utils/notificationTemplateList';

suite('notification template list Test Suite', () => {
	const accessRequestEmail = {
		key: 'access_request',
		name: 'Access Request',
		medium: 'EMAIL',
		locale: 'en',
		description: 'Sent when access is requested',
	};
	const accessRequestSlack = {
		key: 'access_request',
		name: 'Access Request',
		medium: 'SLACK',
		locale: 'en',
	};

	describe('mergeNotificationTemplates', () => {
		it('keeps a default that has not been customized', () => {
			const merged = mergeNotificationTemplates([accessRequestEmail], []);
			assert.strictEqual(merged.length, 1);
			assert.strictEqual(merged[0].customized, false);
			assert.strictEqual(merged[0].name, 'Access Request');
			assert.strictEqual(isDefaultNotificationTemplateId(merged[0].id), true);
		});

		it('replaces a default with the customization that shares key, medium and locale', () => {
			const merged = mergeNotificationTemplates(
				[accessRequestEmail, accessRequestSlack],
				[{ ...accessRequestEmail, id: 'custom-1', name: 'Access Request (custom)' }],
			);
			assert.strictEqual(merged.length, 2);
			const email = merged.find(template => template.medium === 'EMAIL');
			const slack = merged.find(template => template.medium === 'SLACK');
			assert.strictEqual(email?.id, 'custom-1');
			assert.strictEqual(email?.customized, true);
			assert.strictEqual(email?.name, 'Access Request (custom)');
			assert.strictEqual(slack?.customized, false);
		});

		it('keeps a customization that has no matching default', () => {
			const merged = mergeNotificationTemplates([], [{
				id: 'custom-2',
				key: 'tenant_only',
				name: 'Tenant only',
				medium: 'TEAMS',
				locale: 'fr',
			}]);
			assert.strictEqual(merged.length, 1);
			assert.strictEqual(merged[0].id, 'custom-2');
			assert.strictEqual(merged[0].customized, true);
		});
	});

	describe('filterNotificationTemplates', () => {
		const templates = mergeNotificationTemplates(
			[accessRequestEmail, accessRequestSlack, {
				key: 'password_reset',
				name: 'Password Reset',
				medium: 'EMAIL',
				locale: 'fr',
			}],
			[],
		);

		it('matches name, key or locale on the client', () => {
			assert.deepStrictEqual(
				filterNotificationTemplates(templates, { query: 'password' }).map(template => template.key),
				['password_reset'],
			);
			assert.deepStrictEqual(
				filterNotificationTemplates(templates, { query: 'fr' }).map(template => template.key),
				['password_reset'],
			);
		});

		it('filters by medium', () => {
			const slack = filterNotificationTemplates(templates, { mediums: ['SLACK'] });
			assert.deepStrictEqual(slack.map(template => template.medium), ['SLACK']);
		});

		it('combines the text query and the medium', () => {
			const matches = filterNotificationTemplates(templates, { query: 'access', mediums: ['EMAIL'] });
			assert.strictEqual(matches.length, 1);
			assert.strictEqual(matches[0].medium, 'EMAIL');
			assert.strictEqual(matches[0].key, 'access_request');
		});

		it('treats every medium, or none, as no medium filter', () => {
			assert.strictEqual(filterNotificationTemplates(templates, { mediums: [] }).length, 3);
			assert.strictEqual(
				filterNotificationTemplates(templates, { mediums: ['EMAIL', 'SLACK', 'TEAMS'] }).length,
				3,
			);
		});
	});

	describe('defaultNotificationTemplateId', () => {
		it('round-trips key, medium and locale', () => {
			const id = defaultNotificationTemplateId({ key: 'access_request', medium: 'EMAIL', locale: 'en' });
			assert.deepStrictEqual(parseDefaultNotificationTemplateId(id), {
				key: 'access_request',
				medium: 'EMAIL',
				locale: 'en',
			});
		});
	});

	describe('notificationTemplateKeyFilter', () => {
		it('filters the default-template list on the key', () => {
			assert.strictEqual(
				notificationTemplateKeyFilter('access_profile_cleanup_notification'),
				'key eq "access_profile_cleanup_notification"',
			);
		});

		it('escapes quotes in the key', () => {
			assert.strictEqual(notificationTemplateKeyFilter('a"b'), 'key eq "a\\"b"');
		});
	});

	describe('notificationTemplateWebUiSegments', () => {
		it('addresses a customized e-mail template by id', () => {
			assert.deepStrictEqual(notificationTemplateWebUiSegments({
				medium: 'EMAIL',
				customized: true,
				id: 'df32c059-59a8-4ac3-bec0-fed1ca64df7a',
				key: 'access_profile_cleanup_notification',
			}), [
				'ui/a/admin/global/email-templates/customized',
				'df32c059-59a8-4ac3-bec0-fed1ca64df7a',
			]);
		});

		it('addresses a default e-mail template by key, not by the synthetic id', () => {
			const syntheticId = defaultNotificationTemplateId({
				key: 'access_profile_cleanup_notification',
				medium: 'EMAIL',
				locale: 'en',
			});
			assert.deepStrictEqual(notificationTemplateWebUiSegments({
				medium: 'EMAIL',
				customized: false,
				id: syntheticId,
				key: 'access_profile_cleanup_notification',
			}), [
				'ui/a/admin/global/email-templates/default',
				'access_profile_cleanup_notification',
			]);
		});

		it('has no Web UI page for other mediums', () => {
			assert.strictEqual(notificationTemplateWebUiSegments({
				medium: 'SLACK',
				customized: false,
				id: 'ignored',
				key: 'access_request',
			}), undefined);
		});
	});

	describe('notificationTemplateDescription', () => {
		it('states the medium without the locale', () => {
			assert.strictEqual(notificationTemplateDescription('EMAIL'), 'Email');
			assert.strictEqual(notificationTemplateDescription('SLACK'), 'Slack');
			assert.strictEqual(notificationTemplateDescription('TEAMS'), 'Teams');
		});
	});
});
