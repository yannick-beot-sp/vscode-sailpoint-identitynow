import * as vscode from "vscode";
import { IdentityTreeItem } from "../../models/ISCTreeItem.js";
import { IdentityEventsPanel } from "./IdentityEventsPanel.js";

export class ViewIdentityEventsCommand {
    constructor(private readonly extensionUri: vscode.Uri) { }

    async execute(identityTreeItem?: IdentityTreeItem): Promise<void> {
        console.log("> ViewIdentityEventsCommand.execute");

        if (identityTreeItem === undefined) {
            return;
        }

        IdentityEventsPanel.createOrShow(this.extensionUri, identityTreeItem);
    }
}
