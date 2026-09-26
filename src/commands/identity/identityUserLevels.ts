import { AuthUserV2025CapabilitiesV2025, UserLevelSummaryDTOV2025 } from 'sailpoint-api-client';
const OOTB_USER_LEVEL_NAMES: Record<string, string> = {
    ORG_ADMIN: "Admin",
    HELPDESK: "Helpdesk",
    CERT_ADMIN: "Certification Administrator",
    CLOUD_GOV_ADMIN: "Cloud Governance Administrator",
    CLOUD_GOV_USER: "Cloud Governance User",
    REPORT_ADMIN: "Report Administrator",
    ROLE_ADMIN: "Role Administrator",
    ROLE_SUBADMIN: "Role Subadministrator",
    SAAS_MANAGEMENT_ADMIN: "SaaS Management Administrator",
    SAAS_MANAGEMENT_READER: "SaaS Management Reader",
    SOURCE_ADMIN: "Source Administrator",
    SOURCE_SUBADMIN: "Source Subadministrator",
    "das:ui-administrator": "Data Access Security Administrator",
    "das:ui-compliance_manager": "Data Access Security Compliance Manager",
    "das:ui-auditor": "Data Access Security Auditor",
    "das:ui-data-scope": "Data Access Security Data Scope",
    "sp:aic-dashboard-read": "AIC Dashboard Read",
    "sp:aic-dashboard-write": "AIC Dashboard Write",
    "sp:ui-config-hub-admin": "Config Hub Admin",
    "sp:ui-config-hub-backup-admin": "Config Hub Backup Admin",
    "sp:ui-config-hub-read": "Config Hub Read",
};

export function getUserLevelCapabilityValue(level: UserLevelSummaryDTOV2025): string {
    return level.legacyGroup ?? level.id ?? "";
}

export function isAdminUserLevel(level: UserLevelSummaryDTOV2025): boolean {
    return level.legacyGroup === "ORG_ADMIN" || level.name?.toLowerCase() === "admin";
}

export function isCustomUserLevel(level: UserLevelSummaryDTOV2025): boolean {
    return level.custom === true;
}

export function compareUserLevels(a: UserLevelSummaryDTOV2025, b: UserLevelSummaryDTOV2025): number {
    const aIsAdmin = isAdminUserLevel(a);
    const bIsAdmin = isAdminUserLevel(b);
    if (aIsAdmin && !bIsAdmin) {
        return -1;
    }
    if (!aIsAdmin && bIsAdmin) {
        return 1;
    }

    const aIsCustom = isCustomUserLevel(a);
    const bIsCustom = isCustomUserLevel(b);
    if (aIsCustom && !bIsCustom) {
        return 1;
    }
    if (!aIsCustom && bIsCustom) {
        return -1;
    }

    return (a.name ?? "").localeCompare(b.name ?? "");
}

export function isUserLevelAssigned(level: UserLevelSummaryDTOV2025, capabilities: string[]): boolean {
    const capabilityValue = getUserLevelCapabilityValue(level);
    return capabilities.includes(capabilityValue)
        || (level.id !== undefined && capabilities.includes(level.id));
}

function formatCapabilityLabel(capability: string): string {
    if (capability.includes(":")) {
        const part = capability.split(":").pop() ?? capability;
        return part.replace(/[-_]/g, " ").replace(/\b\w/g, character => character.toUpperCase());
    }

    return capability
        .split("_")
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");
}

export function getOotbUserLevels(): UserLevelSummaryDTOV2025[] {
    return Object.values(AuthUserV2025CapabilitiesV2025).map(capability => ({
        name: OOTB_USER_LEVEL_NAMES[capability] ?? formatCapabilityLabel(capability),
        legacyGroup: capability,
        custom: false,
    }));
}

export function mergeUserLevels(
    customLevels: UserLevelSummaryDTOV2025[],
    currentCapabilities: string[] = []
): UserLevelSummaryDTOV2025[] {
    const byCapability = new Map<string, UserLevelSummaryDTOV2025>();

    for (const level of getOotbUserLevels()) {
        byCapability.set(getUserLevelCapabilityValue(level), level);
    }

    for (const level of customLevels) {
        const key = getUserLevelCapabilityValue(level);
        if (key) {
            byCapability.set(key, level);
        }
    }

    for (const capability of currentCapabilities) {
        if (!byCapability.has(capability)) {
            byCapability.set(capability, {
                name: capability,
                legacyGroup: capability,
                custom: false,
            });
        }
    }

    return Array.from(byCapability.values());
}
