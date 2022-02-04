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


export function convertToText(data:any):string {
    if (data) {
        return JSON.stringify(data, null, 4);
    }
    return '';
}