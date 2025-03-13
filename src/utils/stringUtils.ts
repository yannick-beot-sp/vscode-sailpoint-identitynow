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

export function convertPascalCase2SpaceBased(input: string) {
    return input
        // Look for long acronyms and filter out the last letter
        .replace(/([A-Z]+)([A-Z][a-z])/g, ' $1 $2')
        // Look for lower-case letters followed by upper-case letters
        .replace(/([a-z\d])([A-Z])/g, '$1 $2')
        // Look for lower-case letters followed by numbers
        .replace(/([a-zA-Z])(\d)/g, '$1 $2')
        .replace(/^./, function (str) { return str.toUpperCase(); })
        // Remove any white space left around the word
        .trim();
}
/**
 * CREATE_GROUP => Create Group
 * @param constantString 
 * @returns 
 */
export function convertConstantToTitleCase(constantString: string): string {
    return constantString
        .split('_') // Divise la chaîne en utilisant les underscores
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Met la première lettre en majuscule et le reste en minuscules
        .join(' '); // Joint les mots avec des espaces
}

export function capitalizeFirstLetter(input: string) {
    return input.charAt(0).toUpperCase()
        + input.slice(1).toLowerCase()
}

export function toCamelCase(input: string): string {
    // Split the input string into words
    const words = input.split(/[\s-_]+/);

    // Process each word
    return words.map((word, index) => {
        // Convert the word to lowercase
        word = word.toLowerCase();

        // If it's not the first word, capitalize the first letter
        if (index !== 0) {
            word = word.charAt(0).toUpperCase() + word.slice(1);
        }

        return word;
    }).join('');
}

export function decomposeDiacriticalMarks(input: string): string {
    return input
        // Decompose the string into separate unicode symbols for diacritical marks in compatibility mode, 
        .normalize('NFKD')
        // Remove the unicode diacritical marks.
        .replace(/[\u0300-\u036f]/g, "");
}


/**
 * cf. https://developer.sailpoint.com/docs/api/standard-collection-parameters/#escaping-special-characters-in-a-filter
 */
export function escapeFilter(input: string | undefined) {
    return input?.replaceAll("\\", "\\\\")
        .replaceAll("\"", "\\\"")
    // .replaceAll("%", "%25")
    // .replaceAll("#", "%23")
    // .replaceAll("&", "%26")
}