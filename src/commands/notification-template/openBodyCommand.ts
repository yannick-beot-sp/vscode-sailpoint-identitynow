import * as vscode from 'vscode';
import { NotificationTemplateTreeItem } from "../../models/ISCTreeItem.js";
import { openPreview } from '../../utils/vsCodeHelpers.js';
import {
    SECTION_CONF,
    NOTIFICATION_TEMPLATE_FORMAT_BODY_ON_OPEN_CONF,
    NOTIFICATION_TEMPLATE_PREVIEW_BODY_ON_OPEN_CONF,
} from '../../configurationConstants.js';
import { PREVIEW_NOTIFICATION_TEMPLATE_BODY } from '../constants.js';

/**
 * Opens the `body` of a notification template as a standalone HTML document
 * instead of forcing the user to edit it as an escaped string inside the
 * template JSON. Saving the document writes the body back through the upsert.
 */
export class OpenNotificationTemplateBodyCommand {

    async execute(node?: NotificationTemplateTreeItem): Promise<void> {
        console.log("> OpenNotificationTemplateBodyCommand.execute", node);
        if (node === undefined || !node.hasOwnProperty("uri")) {
            console.log("WARNING: OpenNotificationTemplateBodyCommand: invalid item", node);
            throw new Error("OpenNotificationTemplateBodyCommand: invalid item");
        }
        if (node.medium !== "EMAIL") {
            vscode.window.showErrorMessage("Edit body (HTML) is available for e-mail templates only.");
            return;
        }

        const newPath = node.uri.path.replace("/notification-templates/", "/notification-template-body/");
        const newUri = node.uri.with({
            path: newPath,
            query: new URLSearchParams({
                key: node.templateKey,
                medium: node.medium,
            }).toString(),
        });

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Opening template body...',
            cancellable: false
        }, async () => {
            await openPreview(newUri, 'html');

            const document = await vscode.workspace.openTextDocument(newUri);

            const formatOnOpen = vscode.workspace
                .getConfiguration(SECTION_CONF)
                .get<boolean>(NOTIFICATION_TEMPLATE_FORMAT_BODY_ON_OPEN_CONF, true);
            if (formatOnOpen) {
                await formatDocument(document);
            }

            // Turn on soft wrap for this editor so long lines do not force
            // horizontal scroll, unless the user already wraps HTML.
            await enableSoftWrapIfNeeded(document);

            const previewOnOpen = vscode.workspace
                .getConfiguration(SECTION_CONF)
                .get<boolean>(NOTIFICATION_TEMPLATE_PREVIEW_BODY_ON_OPEN_CONF, true);
            if (previewOnOpen) {
                await vscode.commands.executeCommand(PREVIEW_NOTIFICATION_TEMPLATE_BODY, newUri);
            }
        });
    }
}

async function enableSoftWrapIfNeeded(document: vscode.TextDocument): Promise<void> {
    const wordWrap = vscode.workspace.getConfiguration('editor', document).get<string>('wordWrap');
    if (wordWrap && wordWrap !== 'off') {
        return;
    }
    const editor = await vscode.window.showTextDocument(document, { preview: true, preserveFocus: false });
    if (vscode.window.activeTextEditor === editor) {
        await vscode.commands.executeCommand('editor.action.toggleWordWrap');
    }
}

/**
 * Format the body with the editor's formatter (`editor.action.formatDocument`),
 * so the formatter, indentation and wrapping follow the user's settings
 * (`editor.defaultFormatter`, `editor.tabSize`, `html.format.*`, …).
 */
async function formatDocument(document: vscode.TextDocument): Promise<void> {
    try {
        const editor = await vscode.window.showTextDocument(document, { preview: true, preserveFocus: false });
        if (vscode.window.activeTextEditor !== editor) {
            return;
        }
        await vscode.commands.executeCommand('editor.action.formatDocument');
    } catch (error) {
        console.warn("> OpenNotificationTemplateBodyCommand: could not format body", error);
    }
}
