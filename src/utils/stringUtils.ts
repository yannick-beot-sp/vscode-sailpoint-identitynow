export function isEmpty(strValue: string | null | undefined): boolean {
    return (!strValue || strValue.trim() === "" || (strValue.trim()).length === 0);
}

export function isNotEmpty(val: any) {
    return typeof val === 'string' && !!val;
}

export function isNotBlank(val: any) {
    return typeof val === 'string' && ((val?.trim()?.length || 0) > 0);
}

export function isBlank(val: any) {
    return typeof val !== 'string' || ((val?.trim()?.length || 0) === 0);
}

export function convertPascalCase2SpaceBased(input:string) {
    return input
    // Look for long acronyms and filter out the last letter
    .replace(/([A-Z]+)([A-Z][a-z])/g, ' $1 $2')
    // Look for lower-case letters followed by upper-case letters
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    // Look for lower-case letters followed by numbers
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/^./, function(str){ return str.toUpperCase(); })
    // Remove any white space left around the word
    .trim();
}