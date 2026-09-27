import { escapeFilter } from "./stringUtils";

/**
 * Client-side listing of notification templates.
 *
 * IdentityNow exposes two collections: the product defaults
 * (`GET /notification-template-defaults`) and the templates a tenant has
 * customized (`GET /notification-templates`). A customization replaces the
 * default that shares the same key, medium and locale.
 */

export const NOTIFICATION_TEMPLATE_MEDIUMS = ["EMAIL", "SLACK", "TEAMS"] as const;

const MEDIUM_LABELS: Record<string, string> = {
	EMAIL: "Email",
	SLACK: "Slack",
	TEAMS: "Teams",
};

const DEFAULT_TEMPLATE_ID_PREFIX = "default.";

export interface NotificationTemplateIdentity {
	key?: string;
	name?: string;
	medium?: string;
	locale?: string;
	description?: string | null;
}

export interface NotificationTemplateListEntry {
	id: string;
	key: string;
	name?: string;
	medium: string;
	locale: string;
	description?: string;
	customized: boolean;
}

export function notificationTemplateMediumLabel(medium: string | undefined): string {
	if (!medium) {
		return "";
	}
	return MEDIUM_LABELS[medium] ?? medium;
}

/** Secondary text shown beside the template name: the channel, not the locale. */
export function notificationTemplateDescription(medium: string | undefined): string {
	return notificationTemplateMediumLabel(medium);
}

export function isNotificationTemplateMediumFilterActive(mediums: readonly string[] | undefined): boolean {
	if (!mediums || mediums.length === 0) {
		return false;
	}
	const known = new Set<string>(NOTIFICATION_TEMPLATE_MEDIUMS);
	const selected = mediums.filter(medium => known.has(medium));
	return selected.length > 0 && selected.length < NOTIFICATION_TEMPLATE_MEDIUMS.length;
}

export function defaultNotificationTemplateId(template: { key: string; medium: string; locale: string }): string {
	const payload = Buffer.from(`${template.key}\n${template.medium}\n${template.locale}`, "utf8").toString("base64url");
	return `${DEFAULT_TEMPLATE_ID_PREFIX}${payload}`;
}

export function parseDefaultNotificationTemplateId(id: string): { key: string; medium: string; locale: string } | undefined {
	if (!id.startsWith(DEFAULT_TEMPLATE_ID_PREFIX)) {
		return undefined;
	}
	const encoded = id.slice(DEFAULT_TEMPLATE_ID_PREFIX.length);
	if (!encoded) {
		return undefined;
	}
	const raw = Buffer.from(encoded, "base64url").toString("utf8");
	const parts = raw.split("\n");
	if (parts.length < 3) {
		return undefined;
	}
	const locale = parts.pop();
	const medium = parts.pop();
	const key = parts.join("\n");
	if (!key || !medium || !locale) {
		return undefined;
	}
	return { key, medium, locale };
}

export function isDefaultNotificationTemplateId(id: string | undefined): boolean {
	return !!id && parseDefaultNotificationTemplateId(id) !== undefined;
}

/**
 * `GET /notification-template-defaults` filter.
 * Product defaults have no id: `GET /notification-templates/{id}` does not return them,
 * so a default is loaded by listing defaults with this filter on `key`.
 * Spec: beta `listNotificationTemplateDefaults` (`key` supports `eq`).
 */
export function notificationTemplateKeyFilter(key: string): string {
	return `key eq "${escapeFilter(key)}"`;
}

/**
 * Admin Web UI path for an e-mail template.
 * Customized templates are addressed by id
 * (`/ui/a/admin/global/email-templates/customized/{id}`).
 * Defaults are addressed by key
 * (`/ui/a/admin/global/email-templates/default/{key}`).
 * The synthetic tree id (`default.<base64>`) is not a valid segment there.
 * Slack and Teams templates have no page in this UI.
 */
export function notificationTemplateWebUiSegments(template: {
	medium?: string;
	customized: boolean;
	id: string;
	key: string;
}): [string, string] | undefined {
	if (template.medium !== "EMAIL") {
		return undefined;
	}
	if (template.customized) {
		return ["ui/a/admin/global/email-templates/customized", template.id];
	}
	return ["ui/a/admin/global/email-templates/default", template.key];
}

function identityKey(template: { key: string; medium: string; locale: string }): string {
	return `${template.key}\0${template.medium}\0${template.locale}`;
}

function toEntry(
	template: NotificationTemplateIdentity & { id?: string },
	customized: boolean,
): NotificationTemplateListEntry | undefined {
	if (!template.key || !template.medium || !template.locale) {
		return undefined;
	}
	const id = customized && template.id
		? template.id
		: (template.id || defaultNotificationTemplateId({
			key: template.key,
			medium: template.medium,
			locale: template.locale,
		}));
	return {
		id,
		key: template.key,
		name: template.name || undefined,
		medium: template.medium,
		locale: template.locale,
		description: template.description ?? undefined,
		customized,
	};
}

/**
 * Defaults first, then custom templates. A custom template replaces the default
 * with the same key, medium and locale.
 */
export function mergeNotificationTemplates(
	defaults: NotificationTemplateIdentity[],
	custom: Array<NotificationTemplateIdentity & { id?: string }>,
): NotificationTemplateListEntry[] {
	const byIdentity = new Map<string, NotificationTemplateListEntry>();

	for (const template of defaults) {
		const entry = toEntry(template, false);
		if (entry) {
			byIdentity.set(identityKey(entry), entry);
		}
	}

	for (const template of custom) {
		const entry = toEntry(template, true);
		if (entry) {
			byIdentity.set(identityKey(entry), entry);
		}
	}

	return [...byIdentity.values()];
}

export function filterNotificationTemplates<T extends NotificationTemplateIdentity>(
	templates: T[],
	filter: { query?: string; mediums?: readonly string[] },
): T[] {
	const query = filter.query?.trim().toLowerCase() ?? "";
	const mediumFilter = isNotificationTemplateMediumFilterActive(filter.mediums)
		? new Set(filter.mediums)
		: undefined;

	return templates.filter(template => {
		if (mediumFilter && !mediumFilter.has(template.medium ?? "")) {
			return false;
		}
		if (!query) {
			return true;
		}
		const haystack = [template.name, template.key, template.description, template.locale]
			.filter((part): part is string => !!part)
			.join("\n")
			.toLowerCase();
		return haystack.includes(query);
	});
}
