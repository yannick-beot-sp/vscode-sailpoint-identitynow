import * as vscode from "vscode";
import { IdentityAccessTreeItem } from "../../models/ISCTreeItem";
import { IdentityAccessPanel } from "./IdentityAccessPanel";

export class ViewIdentityAccessCommand {
	constructor(private readonly extensionUri: vscode.Uri) { }

	async execute(accessTreeItem?: IdentityAccessTreeItem): Promise<void> {
		console.log("> ViewIdentityAccessCommand.execute");

		if (accessTreeItem === undefined) {
			vscode.window.showWarningMessage("Select the Access node of an identity in the tree to view its access.");
			return;
		}

		IdentityAccessPanel.createOrShow(this.extensionUri, accessTreeItem);
	}
}
