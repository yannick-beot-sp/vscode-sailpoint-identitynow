import { Index } from "sailpoint-api-client/dist/search/api.js";
import { IdentityAccessItemType } from "../models/IdentityAccessItem.js";

export const REQUESTABLE_ACCESS_INDICES: Index[] = [
	Index.Roles,
	Index.Accessprofiles,
	Index.Entitlements,
];

export const REQUESTABLE_ACCESS_SEARCH_FIELDS = [
	"id",
	"name",
	"displayName",
	"description",
	"source",
	"attribute",
];

export function escapeSearchTerm(term: string): string {
	return term.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function buildRequestableAccessItemQuery(term: string): string {
	const quoted = `"${escapeSearchTerm(term)}"`;
	return `(id:${quoted} OR name:${quoted}) AND requestable:true`;
}

/**
 * Search documents from roles, access profiles, and entitlements share one result
 * list and have no type field. Entitlements carry `attribute`, access profiles
 * carry `source`, and roles carry neither.
 */
export function accessItemTypeFromSearchDocument(record: Record<string, unknown>): IdentityAccessItemType {
	if (isPresent(record.attribute)) {
		return "ENTITLEMENT";
	}
	if (isPresent(record.source)) {
		return "ACCESS_PROFILE";
	}
	return "ROLE";
}

function isPresent(value: unknown): boolean {
	return value !== undefined && value !== null && value !== "";
}
