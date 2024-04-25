const path = require('node:path');

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export function uint8Array2Str(arr: Uint8Array): string {
    let bufferAsString = new TextDecoder("utf-8").decode(arr);
    return bufferAsString;
}

export function str2Uint8Array(str: string): Uint8Array {
    const bufView = new TextEncoder().encode(str);
    return bufView;
}

export function toTimestamp(strDate: string): number {
    const datum = Date.parse(strDate);
    return datum / 1000;
}

/**
 * Used to create a timestamp-based suffix for files.
 * It is modified from the ISO8601 string to remove ':' and second
 */
export function toDateSuffix(): string {
    const date = new Date();
    let str = date.toISOString(); //"2011-12-19T15:28:46.493Z"
    str = str.replaceAll(':', '-').replace(/\..*$/, '');
    return str;
}

export function convertToText(data: any): string {
    if (data) {
        if (typeof data === 'object') {
            return JSON.stringify(data, null, 4);
        } else {
            return data
        }
    }
    return '';
}

/**
 * Function used to compare 2 objects by the property 'name'. Useful for sorting most IDN objects
 */
export const compareByName = (a: any, b: any) => compareCaseInsensitive(a, b, "name");

/**
 * Function used to compare 2 objects by the property 'priority'. Useful for sorting identity profiles
 */
export const compareByPriority = (a: any, b: any) => (a.priority > b.priority) ? 1 : -1;

/**
 * Function used to compare 2 objects by the property 'priority'. Useful for sorting QuickPickItem or TreeItem
 */
export const compareByLabel = (a: any, b: any) => compareCaseInsensitive(a, b, "label");

function compareCaseInsensitive(a: any, b: any, property: string) {
    return a[property].localeCompare(b[property], undefined, { sensitivity: 'base' })
}

/**
 * Use to get the full tenant name. The idea is to prevent the creation of the same tenant if already present
 */
export function normalizeTenant(tenantName: string) {
    tenantName = tenantName.toLowerCase();
    if (tenantName.indexOf(".") === -1) {
        tenantName += ".identitynow.com";
    }
    return tenantName;
}

// cf. https://stackoverflow.com/questions/38552003/how-to-decode-jwt-token-in-javascript-without-using-a-library
export function parseJwt(token: string): any {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}


// cf. https://github.com/parshap/node-sanitize-filename/blob/master/index.js

const illegalRe = /[\/\\\?<>:\*\|":]/g;
const controlRe = /[\x00-\x1f\x80-\x9f]/g;
const reservedRe = /^\.+$/;
const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;

function sanitizeImpl(input: any, replacement: string, maxLength: number) {
    if (typeof input !== 'string') {
        throw new Error('Input must be string')
    }
    const sanitized = input
        .replace(illegalRe, replacement)
        .replace(controlRe, replacement)
        .replace(reservedRe, replacement)
        .replace(windowsReservedRe, replacement);

    if (maxLength > 0) {
        return truncate(sanitized, maxLength);
    }
    return sanitized
}

// cf. https://gist.github.com/barbietunnie/7bc6d48a424446c44ff4
function truncate(sanitized: string, length: number): string {
    const uint8Array = new TextEncoder().encode(sanitized)
    const truncated = uint8Array.slice(0, length)
    return new TextDecoder().decode(truncated)
}

/**
 * 
 * @param input Can be a path. For instance: WORKFLOW/Template: my super workflow.json
 * @param options optional parameters for invalid character remplacement ('' by default) and max length (255 by default)
 * @returns sanitized path
 */
export function sanitizePath(input: string, options: undefined | { replacement?: string, maxLength?: number } = undefined) {
    const replacement: string = (options && options.replacement) || '';
    let maxLength: number = (options && options.maxLength) || 255;

    const parts = path.parse(input);
    maxLength = maxLength - (parts.ext ?? '').length
    parts.name = sanitizeImpl(parts.name, replacement, maxLength)
    if (replacement !== '') {
        parts.name = sanitizeImpl(parts.name, '', maxLength);
    }
    // Need to remove base otherwise it takes precedence
    parts.base = undefined;
    const output = path.format(parts);
    return output
};


interface String {
    format(...replacements: string[]): string;
}

/**
 * cf. https://stackoverflow.com/a/20070599
 */
export function formatString(str: string, ...args) {
    return str.replace(/{(\d+)}/g, (match, number) => {
        return typeof args[number] !== 'undefined'
            ? args[number]
            : match
            ;
    });
};
