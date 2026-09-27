import { render as renderVelocity } from "velocityjs";
import { attachGlobalTools } from "./templateTools";
import { NotificationTemplateVariable, NotificationTemplateVariableExample } from "./templateVariables";

const BLOCKED_PATH_KEYS = new Set(["__proto__", "prototype", "constructor"]);

/**
 * Render a Velocity notification template with catalog example values.
 *
 * Template-specific entries precede global entries in the catalog and therefore
 * win when both provide the same key. Usage snippets are not data. Global
 * functions from the catalog are attached as executable tools.
 */
export function applyNotificationTemplateExamples(
    body: string,
    variables: NotificationTemplateVariable[],
): string {
    return renderVelocity(body, exampleContext(variables));
}

export function exampleContext(variables: NotificationTemplateVariable[]): Record<string, unknown> {
    const context = Object.create(null) as Record<string, unknown>;

    // Applying from the end lets a template-specific value replace a global
    // value with the same key.
    for (let index = variables.length - 1; index >= 0; index--) {
        const variable = variables[index];
        if (variable.type === "function") {
            continue;
        }
        if (typeof variable.example === "string" && variable.example.trimStart().startsWith("$")) {
            continue;
        }
        setPath(context, variable.key, cloneExample(variable.example));
    }

    attachGlobalTools(context);
    return context;
}

function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
    const segments = path.split(".");
    if (segments.length === 0 || segments.some((segment) => !segment || BLOCKED_PATH_KEYS.has(segment))) {
        return;
    }

    let current = target;
    for (let index = 0; index < segments.length - 1; index++) {
        const segment = segments[index];
        const existing = current[segment];
        if (!isRecord(existing)) {
            current[segment] = Object.create(null) as Record<string, unknown>;
        }
        current = current[segment] as Record<string, unknown>;
    }

    const finalSegment = segments[segments.length - 1];
    const existing = current[finalSegment];
    if (isRecord(existing) && isRecord(value)) {
        current[finalSegment] = mergeRecords(existing, value);
    } else {
        current[finalSegment] = value;
    }
}

function cloneExample(value: NotificationTemplateVariableExample): unknown {
    if (Array.isArray(value)) {
        return value.map(cloneExample);
    }
    if (isRecord(value)) {
        const cloned = Object.create(null) as Record<string, unknown>;
        for (const [key, child] of Object.entries(value)) {
            if (!BLOCKED_PATH_KEYS.has(key)) {
                cloned[key] = cloneExample(child as NotificationTemplateVariableExample);
            }
        }
        return cloned;
    }
    return value;
}

function mergeRecords(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
    const merged = Object.create(null) as Record<string, unknown>;
    for (const [key, value] of Object.entries(base)) {
        if (!BLOCKED_PATH_KEYS.has(key)) {
            merged[key] = value;
        }
    }
    for (const [key, value] of Object.entries(override)) {
        if (BLOCKED_PATH_KEYS.has(key)) {
            continue;
        }
        merged[key] = isRecord(merged[key]) && isRecord(value)
            ? mergeRecords(merged[key] as Record<string, unknown>, value)
            : value;
    }
    return merged;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

