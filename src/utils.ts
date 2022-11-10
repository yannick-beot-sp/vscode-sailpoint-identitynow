export function isEmpty(strValue: string | null | undefined): boolean {
    return (!strValue || strValue.trim() === "" || (strValue.trim()).length === 0);
}

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
    var datum = Date.parse(strDate);
    return datum / 1000;
}

/**
 * Used to create a timestamp-based suffix for files.
 * It is modified from the ISO8601 string to remove ':' and second
 */
export function toDateSuffix(): string {
    var date = new Date();
    let str = date.toISOString(); //"2011-12-19T15:28:46.493Z"
    str = str.replaceAll(':', '-');
    str = str.replaceAll(/\..*/g, '');
    return str;
}

export function convertToText(data: any): string {
    if (data) {
        return JSON.stringify(data, null, 4);
    }
    return '';
}

/**
 * Function used to compare 2 objects by the property 'name'. Useful for sorting most IDN objects
 */
export const compareByName = (a: any, b: any) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1;

/**
 * Function used to compare 2 objects by the property 'priority'. Useful for sorting identity profiles
 */
 export const compareByPriority = (a: any, b: any) => (a.priority > b.priority) ? 1 : -1;


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