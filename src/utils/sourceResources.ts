import { isNotBlank } from "./stringUtils.js";

/**
 * Dataset schemas carry a non-empty `configuration.datasetId`.
 * They stay out of the Schemas folder so that folder lists account and group schemas.
 * cf. api-specs idn/apis/sources/schemas/sourcedatasetresource.yaml
 */
export function schemaHasDatasetId(schema: { configuration?: object } | null | undefined): boolean {
    const datasetId = (schema?.configuration as { datasetId?: unknown } | undefined)?.datasetId;
    return isNotBlank(datasetId);
}

/**
 * Codicon id (VS Code product icons).
 * Unknown types use `package`.
 * https://code.visualstudio.com/api/references/icons-in-labels#icon-listing
 */
const SOURCE_RESOURCE_TYPE_ICONS: Record<string, string> = {
    "std:account": "account",
    "std:access": "shield",
    "std:agent": "hubot",
    "std:capability": "tools",
    "std:application": "window",
    "std:credential": "key",
};

export function sourceResourceIconName(type: string | undefined): string {
    return (type && SOURCE_RESOURCE_TYPE_ICONS[type]) || "package";
}
