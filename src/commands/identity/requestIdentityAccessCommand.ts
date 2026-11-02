import * as vscode from "vscode";
import { IdentityTreeItem } from "../../models/ISCTreeItem.js";
import { IdentityAccessPanel } from "./IdentityAccessPanel.js";
import { requestIdentityAccess } from "./requestIdentityAccess.js";

export class RequestIdentityAccessCommand {
	constructor(private readonly extensionUri: vscode.Uri) { }

	async execute(identityTreeItem?: IdentityTreeItem): Promise<void> {
		console.log("> RequestIdentityAccessCommand.execute");

		if (identityTreeItem === undefined) {
			return;
		}

		const submitted = await requestIdentityAccess(this.extensionUri, identityTreeItem);
		if (submitted) {
			// Refresh the "Manage Access" view if it is already open for this identity
			IdentityAccessPanel.refreshIfOpen(identityTreeItem);
		}
	}
}
