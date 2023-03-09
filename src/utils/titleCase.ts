/**
 * Returns a human readable string from a configuration key
 * "report.accounts.folder" => "Report Accounts Folder"
 * @param key 
 */
export function titleCase(key: string): string {
    // cf. https://stackoverflow.com/a/67023855/3214451
    // replace 1 - upper case first letter and remove _-.
    // replace 2 - add space between lower case letters and upper case letters
    return key
        .replace(/(^|[._-])([a-z])/g, (a, b, c) => c.toUpperCase())
        .replace(/([a-z])([A-Z])/g, (a, b, c) => `${b} ${c}`);
}