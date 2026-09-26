import * as vscode from "vscode";
import { IdentityTreeItem } from "../../models/ISCTreeItem";
import { IdentityAccessPanel } from "./IdentityAccessPanel";

export class ViewIdentityAccessCommand {
	constructor(private readonly extensionUri: vscode.Uri) { }

	async execute(identityTreeItem?: IdentityTreeItem): Promise<void> {
		console.log("> ViewIdentityAccessCommand.execute");

		if (identityTreeItem === undefined) {
			return;
		}

		IdentityAccessPanel.createOrShow(this.extensionUri, identityTreeItem);
	}
}
