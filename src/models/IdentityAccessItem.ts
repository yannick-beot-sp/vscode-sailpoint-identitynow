export type IdentityAccessItemType = "ROLE" | "ACCESS_PROFILE" | "ENTITLEMENT";

export interface IdentityAccessItem {
	type: IdentityAccessItemType;
	id: string;
	name?: string;
	displayName?: string;
	description?: string;
	sourceName?: string;
	removeDate?: string;
	assignmentId?: string;
	nativeIdentity?: string;
	raw: Record<string, unknown>;
}
