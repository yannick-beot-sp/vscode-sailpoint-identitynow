export function isEmpty(strValue: string | null | undefined): boolean {
    return (!strValue || strValue.trim() === "" || (strValue.trim()).length === 0);
}

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export function uint8Array2Str(arr: Uint8Array): string {
    let bufferAsString = String.fromCharCode(...arr);
    return bufferAsString;
}

export function str2Uint8Array(str: string): Uint8Array {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
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
    str= str.replaceAll(':','-');
    str= str.replaceAll(/\..*/g,'');
    return str;
}

export function convertToText(data:any):string {
    if (data) {
        return JSON.stringify(data, null, 4);
    }
    return '';
}