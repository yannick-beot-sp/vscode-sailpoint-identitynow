import { render as renderVelocity } from "velocityjs";
import { attachGlobalTools } from "./templateTools";
import { NotificationTemplateVariable, NotificationTemplateVariableExample } from "./templateVariables";

const BLOCKED_PATH_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const MAX_EXAMPLE_DEPTH = 32;

export const MAX_EXAMPLE_JSON_CHARS = 1_000_000;

export type ParsedExampleValues =
    | { ok: true; values: Record<string, unknown> }
    | { ok: false; error: string };

/**
 * Render a Velocity notification template with catalog example values.
 *
 * Template-specific entries precede global entries in the catalog and therefore
 * win when both provide the same key. Usage snippets are not data. Global
 * functions from the catalog are attached as executable tools.
 *
 * `exampleValues` replaces the catalog data when the preview editor applies a
 * custom JSON object. Tools are still attached.
 */
export function applyNotificationTemplateExamples(
    body: string,
    variables: NotificationTemplateVariable[],
    exampleValues?: Record<string, unknown>,
): string {
    return renderVelocity(body, exampleContext(variables, exampleValues));
}

/**
 * JSON object shown in the preview: one property per data variable, excluding
 * functions and Velocity usage snippets. Dotted keys such as
 * `__global.productName` are nested under their parent object. Earlier entries
 * win on duplicate keys.
 */
export function exampleValueMap(variables: NotificationTemplateVariable[]): Record<string, unknown> {
    const values = Object.create(null) as Record<string, unknown>;
    for (const variable of variables) {
        if (!isSampledVariable(variable) || hasBlockedSegment(variable.key)) {
            continue;
        }
        setPathIfAbsent(values, variable.key, cloneExample(variable.example));
    }
    return values;
}

export function parseExampleValues(text: string): ParsedExampleValues {
    if (text.length > MAX_EXAMPLE_JSON_CHARS) {
        return { ok: false, error: "Example values JSON is too large" };
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch (caught) {
        const message = caught instanceof Error ? caught.message : String(caught);
        return { ok: false, error: `Invalid JSON: ${message}` };
    }
    if (!isRecord(parsed)) {
        return { ok: false, error: "Example values must be a JSON object" };
    }
    const reason = validateExampleTree(parsed, 0, "");
    if (reason) {
        return { ok: false, error: reason };
    }
    return { ok: true, values: cloneJsonValue(parsed) as Record<string, unknown> };
}

export function exampleContext(
    variables: NotificationTemplateVariable[],
    exampleValues?: Record<string, unknown>,
): Record<string, unknown> {
    const context = Object.create(null) as Record<string, unknown>;

    if (exampleValues) {
        for (const [key, value] of Object.entries(exampleValues)) {
            setPath(context, key, cloneJsonValue(value));
        }
    } else {
        // Applying from the end lets a template-specific value replace a global
        // value with the same key.
        for (let index = variables.length - 1; index >= 0; index--) {
            const variable = variables[index];
            if (!isSampledVariable(variable)) {
                continue;
            }
            setPath(context, variable.key, cloneExample(variable.example));
        }
    }

    attachGlobalTools(context);
    return context;
}

function isSampledVariable(variable: NotificationTemplateVariable): boolean {
    if (variable.type === "function") {
        return false;
    }
    return !(typeof variable.example === "string" && variable.example.trimStart().startsWith("$"));
}

function hasBlockedSegment(path: string): boolean {
    return path.split(".").some((segment) => !segment || BLOCKED_PATH_KEYS.has(segment));
}

function validateExampleTree(value: unknown, depth: number, path: string): string | undefined {
    if (depth > MAX_EXAMPLE_DEPTH) {
        return "Example values are nested too deeply";
    }
    if (Array.isArray(value)) {
        for (let index = 0; index < value.length; index++) {
            const reason = validateExampleTree(value[index], depth + 1, `${path}[${index}]`);
            if (reason) {
                return reason;
            }
        }
        return undefined;
    }
    if (!isRecord(value)) {
        if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            return undefined;
        }
        return "Example values must contain only JSON values";
    }
    for (const key of Object.keys(value)) {
        const childPath = path ? `${path}.${key}` : key;
        if (hasBlockedSegment(key)) {
            return `Example values cannot use the property "${childPath}"`;
        }
        const reason = validateExampleTree(value[key], depth + 1, childPath);
        if (reason) {
            return reason;
        }
    }
    return undefined;
}

function cloneJsonValue(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => cloneJsonValue(item));
    }
    if (isRecord(value)) {
        const cloned = Object.create(null) as Record<string, unknown>;
        for (const [key, child] of Object.entries(value)) {
            if (!hasBlockedSegment(key)) {
                cloned[key] = cloneJsonValue(child);
            }
        }
        return cloned;
    }
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return value;
    }
    return null;
}

function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
    if (hasBlockedSegment(path)) {
        return;
    }
    const segments = path.split(".");

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

function setPathIfAbsent(target: Record<string, unknown>, path: string, value: unknown): void {
    const segments = path.split(".");

    let current = target;
    for (let index = 0; index < segments.length - 1; index++) {
        const segment = segments[index];
        if (!Object.prototype.hasOwnProperty.call(current, segment)) {
            current[segment] = Object.create(null) as Record<string, unknown>;
        } else if (!isRecord(current[segment])) {
            return;
        }
        current = current[segment] as Record<string, unknown>;
    }

    const finalSegment = segments[segments.length - 1];
    if (!Object.prototype.hasOwnProperty.call(current, finalSegment)) {
        current[finalSegment] = value;
        return;
    }
    const existing = current[finalSegment];
    if (isRecord(existing) && isRecord(value)) {
        current[finalSegment] = mergeRecords(value, existing);
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

