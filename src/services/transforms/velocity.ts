import { render } from 'velocityjs';
import { TransformError } from './TransformError.js';

type MethodPayload = { property: string; context: any; params: any[] };

function checkIndex(value: string, index: any, max: number): number {
    if (!Number.isInteger(index) || index < 0 || index > max) {
        throw new TransformError(`StringIndexOutOfBoundsException: index ${index}, length ${value.length}`);
    }
    return index;
}

/**
 * Java String methods that JavaScript strings lack or implement differently.
 * The other methods used in templates (toLowerCase, trim, indexOf, startsWith, etc.) behave the same.
 */
const JAVA_STRING_METHODS: Record<string, (value: string, ...params: any[]) => any> = {
    length: value => value.length,
    // Java throws when an index is out of range, where JavaScript clamps it
    substring: (value, begin, end = value.length) => {
        checkIndex(value, end, value.length);
        return value.substring(checkIndex(value, begin, end), end);
    },
    charAt: (value, index) => value.charAt(checkIndex(value, index, value.length - 1)),
    isEmpty: value => value.length === 0,
    equals: (value, other) => value === other,
    equalsIgnoreCase: (value, other) => typeof other === 'string' && value.toLowerCase() === other.toLowerCase(),
    contains: (value, other) => value.includes(String(other)),
    // Java replace() replaces every occurrence, without regex
    replace: (value, target, replacement) => value.split(String(target)).join(String(replacement)),
    replaceAll: (value, regex, replacement) => value.replace(new RegExp(regex, 'g'), replacement),
    replaceFirst: (value, regex, replacement) => value.replace(new RegExp(regex), replacement),
    matches: (value, regex) => new RegExp(`^(?:${regex})$`).test(value),
    // Java split() uses a regex and removes the trailing empty strings
    split: (value, regex) => {
        const parts = value.split(new RegExp(regex));
        while (parts.length > 0 && parts[parts.length - 1] === '') {
            parts.pop();
        }
        return parts;
    },
};

const JAVA_STRING_HANDLER = {
    uid: 'javaString',
    match: ({ property, context }: MethodPayload) => typeof context === 'string' && Object.prototype.hasOwnProperty.call(JAVA_STRING_METHODS, property),
    resolve: ({ property, context, params }: MethodPayload) => JAVA_STRING_METHODS[property](context, ...params),
};

/**
 * Names of the variables referenced by a template: $name, $!name, ${name} or $!{name}
 */
export function getReferencedVariables(template: string): string[] {
    const names = [...template.matchAll(/\$!?\{?([a-zA-Z][\w-]*)/g)].map(match => match[1]);
    return [...new Set(names)];
}

/**
 * Renders a Velocity template as ISC does for transforms.
 * Undefined references are rendered as is, e.g. `$foo`, and `$!foo` renders an empty string.
 */
export function renderVelocity(template: string, variables: Record<string, any>): string {
    try {
        return render(template, variables, {}, { customMethodHandlers: [JAVA_STRING_HANDLER] });
    } catch (error) {
        if (error instanceof TransformError) {
            throw new TransformError(`${error.message} in Velocity template '${template}'`);
        }
        throw new TransformError(`Invalid Velocity template '${template}': ${error instanceof Error ? error.message : error}`);
    }
}
