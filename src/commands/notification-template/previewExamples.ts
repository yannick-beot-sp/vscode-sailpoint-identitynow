import { NotificationTemplateVariable, NotificationTemplateVariableExample } from "./templateVariables";

const NOT_FOUND = Symbol("not-found");

/**
 * Replace Velocity references with catalog example values.
 *
 * Formal (`${user.name}`, `$!{user.name}`) and informal (`$user.name`) references
 * are replaced when the catalog has a sample. Function calls (`$tool.method(...)`)
 * and directives (`#if`, `#foreach`) are left as written. An unknown reference
 * stays visible so the author can see it was not sampled.
 */
export function applyNotificationTemplateExamples(
    body: string,
    variables: NotificationTemplateVariable[],
): string {
    const catalog = catalogFrom(variables);
    const identifier = "[A-Za-z_][A-Za-z0-9_]*(?:\\.[A-Za-z_][A-Za-z0-9_]*)*";
    const velocityReference = new RegExp(
        `\\$!?\\{(${identifier})\\}|\\$!?(${identifier})(?![\\w(])(?!\\.[A-Za-z_])`,
        "g",
    );
    return body.replace(velocityReference, (match, formal: string | undefined, informal: string | undefined) => {
        const path = formal ?? informal;
        if (!path) {
            return match;
        }
        const value = lookup(path, catalog);
        if (value === NOT_FOUND) {
            return match;
        }
        return formatExample(value);
    });
}

function catalogFrom(variables: NotificationTemplateVariable[]): Map<string, NotificationTemplateVariableExample> {
    const catalog = new Map<string, NotificationTemplateVariableExample>();
    // Template-specific entries are listed before globals. Applying from the
    // end lets a template value replace a global one with the same key.
    for (let index = variables.length - 1; index >= 0; index--) {
        const variable = variables[index];
        if (variable.type === "function") {
            continue;
        }
        if (typeof variable.example === "string" && variable.example.trimStart().startsWith("$")) {
            continue;
        }
        catalog.set(variable.key, variable.example);
    }
    return catalog;
}

function lookup(
    path: string,
    catalog: Map<string, NotificationTemplateVariableExample>,
): NotificationTemplateVariableExample | typeof NOT_FOUND {
    const remainder: string[] = [];
    let candidate = path;
    while (candidate.length > 0) {
        if (catalog.has(candidate)) {
            const base = catalog.get(candidate);
            if (base === undefined) {
                return NOT_FOUND;
            }
            return remainder.length === 0 ? base : walk(base, remainder);
        }
        const dot = candidate.lastIndexOf(".");
        if (dot <= 0) {
            break;
        }
        remainder.unshift(candidate.slice(dot + 1));
        candidate = candidate.slice(0, dot);
    }
    return NOT_FOUND;
}

function walk(
    value: NotificationTemplateVariableExample,
    segments: string[],
): NotificationTemplateVariableExample | typeof NOT_FOUND {
    let current = value;
    for (const segment of segments) {
        if (segment === "__proto__" || segment === "prototype" || segment === "constructor") {
            return NOT_FOUND;
        }
        if (current === null || typeof current !== "object" || Array.isArray(current)) {
            return NOT_FOUND;
        }
        if (!Object.prototype.hasOwnProperty.call(current, segment)) {
            return NOT_FOUND;
        }
        const next = current[segment];
        if (next === undefined) {
            return NOT_FOUND;
        }
        current = next;
    }
    return current;
}

function formatExample(value: NotificationTemplateVariableExample): string {
    if (value === null) {
        return "";
    }
    if (typeof value === "string") {
        return escapeHtml(value);
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    if (Array.isArray(value) && value.every(isPrimitiveExample)) {
        return value.map((item) => (item === null ? "" : escapeHtml(String(item)))).join(", ");
    }
    return escapeHtml(JSON.stringify(value));
}

function isPrimitiveExample(value: NotificationTemplateVariableExample): boolean {
    return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
