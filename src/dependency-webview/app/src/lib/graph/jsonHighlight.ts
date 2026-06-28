const TOKEN_PATTERN = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

function escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Pretty-prints `value` as JSON and wraps each token in a `<span>` for syntax highlighting. */
export function highlightJson(value: unknown): string {
    const json = escapeHtml(JSON.stringify(value, null, 2));
    return json.replace(TOKEN_PATTERN, (match) => {
        let cls = "json-number";
        if (match.startsWith('"')) {
            cls = match.endsWith(":") ? "json-key" : "json-string";
        } else if (match === "true" || match === "false") {
            cls = "json-boolean";
        } else if (match === "null") {
            cls = "json-null";
        }
        return `<span class="${cls}">${match}</span>`;
    });
}
