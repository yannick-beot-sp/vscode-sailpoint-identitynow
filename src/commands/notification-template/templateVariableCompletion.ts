import { parseDefaultNotificationTemplateId } from "../../utils/notificationTemplateList";
import {
    NotificationTemplateVariable,
    globalVariables,
    templateVariables,
} from "./templateVariables";

export interface TemplateVariableIdentity {
    key?: string;
    medium?: string;
}

const VELOCITY_PREFIX = /\$!?\{?[A-Za-z0-9_.]*$/;

/**
 * Text inserted for a variable.
 * Data variables use the quiet Velocity reference. Functions insert the primary example call.
 */
export function velocityInsertText(variable: NotificationTemplateVariable): string {
    if (variable.type === "function" && typeof variable.example === "string") {
        const primary = variable.example.split(/\s+or\s+/)[0].trim();
        if (primary.startsWith("$")) {
            return primary;
        }
        const call = primary.match(/\$[A-Za-z0-9_.]+\([^)]*\)/);
        if (call) {
            return call[0];
        }
    }
    return `$!{${variable.key}}`;
}

export function velocityPrefixLength(linePrefix: string): number | undefined {
    const match = linePrefix.match(VELOCITY_PREFIX);
    if (!match) {
        return undefined;
    }
    return match[0].length;
}

export function resolveTemplateIdentity(
    uriPath: string,
    uriQuery: string,
    text: string,
): TemplateVariableIdentity {
    const params = new URLSearchParams(uriQuery);
    const queryKey = params.get("key");
    const queryMedium = params.get("medium");
    if (queryKey && queryMedium) {
        return { key: queryKey, medium: queryMedium };
    }

    if (uriPath.includes("/notification-templates/")) {
        const fromJson = identityFromTemplateJson(text);
        if (fromJson) {
            return fromJson;
        }
    }

    const id = uriPath.match(/^\/.+\/(.*?)\/.*?$/)?.[1];
    const parsed = id ? parseDefaultNotificationTemplateId(id) : undefined;
    if (parsed) {
        return { key: parsed.key, medium: parsed.medium };
    }
    return {};
}

export function templateVariablesFor(identity: TemplateVariableIdentity): NotificationTemplateVariable[] {
    if (!identity.key || !identity.medium) {
        return [];
    }
    return templateVariables[identity.key]?.[identity.medium] ?? [];
}

export function completionVariables(identity: TemplateVariableIdentity): Array<{
    scope: "template" | "global";
    variable: NotificationTemplateVariable;
}> {
    const specific = templateVariablesFor(identity).map((variable) => ({ scope: "template" as const, variable }));
    const shared = globalVariables.map((variable) => ({ scope: "global" as const, variable }));
    return [...specific, ...shared];
}

function identityFromTemplateJson(text: string): TemplateVariableIdentity | undefined {
    const key = text.match(/"key"\s*:\s*"([^"\\]+)"/)?.[1];
    const medium = text.match(/"medium"\s*:\s*"([^"\\]+)"/)?.[1];
    if (!key || !medium) {
        return undefined;
    }
    return { key, medium };
}
