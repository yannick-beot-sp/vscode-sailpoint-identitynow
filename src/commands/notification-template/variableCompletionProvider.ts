import * as vscode from "vscode";
import { URL_PREFIX } from "../../constants";
import {
    completionVariables,
    resolveTemplateIdentity,
    velocityInsertText,
    velocityPrefixLength,
} from "./templateVariableCompletion";
import { NotificationTemplateVariable } from "./templateVariables";

/**
 * Suggests global and template-specific variables while editing a notification template.
 * Triggered when the user types `$`.
 */
export class NotificationTemplateVariableCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): vscode.CompletionItem[] | undefined {
        const linePrefix = document.lineAt(position.line).text.slice(0, position.character);
        const prefixLength = velocityPrefixLength(linePrefix);
        if (prefixLength === undefined) {
            return undefined;
        }

        const identity = resolveTemplateIdentity(document.uri.path, document.uri.query, document.getText());
        const range = new vscode.Range(
            position.line,
            position.character - prefixLength,
            position.line,
            position.character,
        );

        return completionVariables(identity).map(({ scope, variable }) => {
            const item = new vscode.CompletionItem(
                variable.key,
                variable.type === "function"
                    ? vscode.CompletionItemKind.Function
                    : vscode.CompletionItemKind.Variable,
            );
            item.detail = `${scope === "template" ? "Template" : "Global"} · ${variable.type}`;
            item.documentation = documentation(variable);
            item.insertText = velocityInsertText(variable);
            item.filterText = `$${variable.key}`;
            item.sortText = `${scope === "template" ? "0" : "1"}_${variable.key}`;
            item.range = range;
            return item;
        });
    }
}

export function registerNotificationTemplateVariableCompletion(): vscode.Disposable {
    return vscode.languages.registerCompletionItemProvider(
        [
            { scheme: URL_PREFIX, language: "html", pattern: "**/notification-template-body/**" },
            { scheme: URL_PREFIX, language: "json", pattern: "**/notification-templates/**" },
        ],
        new NotificationTemplateVariableCompletionProvider(),
        "$",
    );
}

function documentation(variable: NotificationTemplateVariable): vscode.MarkdownString {
    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown(variable.description);
    if (variable.example !== null && variable.example !== "") {
        markdown.appendMarkdown("\n\n**Example**\n\n");
        const rendered = typeof variable.example === "string"
            ? variable.example
            : JSON.stringify(variable.example, null, 2);
        markdown.appendCodeblock(rendered, typeof variable.example === "string" ? "" : "json");
    }
    return markdown;
}
