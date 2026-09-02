import * as vscode from 'vscode';
import { NotificationTemplateTreeItem } from "../../models/ISCTreeItem";
import { openPreview } from '../../utils/vsCodeHelpers';
import {
    SECTION_CONF,
    NOTIFICATION_TEMPLATE_FORMAT_BODY_ON_OPEN_CONF,
    NOTIFICATION_TEMPLATE_PREVIEW_BODY_ON_OPEN_CONF,
} from '../../configurationConstants';
import { PREVIEW_NOTIFICATION_TEMPLATE_BODY } from '../constants';
import { formatNotificationTemplateBody } from './formatBody';

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

        const newPath = node.uri.path.replace("/notification-templates/", "/notification-template-body/");
        const newUri = node.uri.with({ path: newPath });

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

            // The body is left unwrapped (wrapping HTML risks shifting rendered
            // whitespace), so turn on soft wrap for this editor to avoid the long
            // inline lines forcing horizontal scroll - unless the user already
            // wraps HTML.
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
 * Pretty-print the body in place using js-beautify (the engine VS Code's own
 * HTML formatter is built on), with e-mail-safe options. Applied as a workspace
 * edit so it does not depend on the document being the focused editor.
 */
async function formatDocument(document: vscode.TextDocument): Promise<void> {
    const original = document.getText();
    let formatted: string;
    try {
        formatted = formatNotificationTemplateBody(original);
    } catch (error) {
        console.warn("> OpenNotificationTemplateBodyCommand: could not format body", error);
        return;
    }
    if (formatted === original) {
        return;
    }
    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(original.length));
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.replace(document.uri, fullRange, formatted);
    await vscode.workspace.applyEdit(workspaceEdit);
}
