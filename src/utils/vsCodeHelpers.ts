import * as vscode from "vscode";
import { TenantService } from "../services/TenantService";
import * as fs from 'fs';
import { TenantInfo } from "../models/TenantInfo";
import { TenantInfoQuickPickItem } from "../models/TenantInfoQuickPickItem";

export async function chooseTenant(tenantService: TenantService, title: string): Promise<TenantInfo | undefined> {
	console.log("> chooseTenant");
	const tenants = await tenantService.getTenants();
	let tenantInfo: TenantInfo | undefined;
	if (tenants.length < 1) {
		// Do nothting. tenantInfo = undefined
	} else if (tenants.length === 1) {
		tenantInfo = tenants[0];
	} else {
		// Compute properties for QuickPickItem
		const tenantQuickPickItems = tenants
			.map(obj => ({ ...obj, label: obj?.name, detail: obj?.tenantName }));
		const tenantQuickPickItem = await vscode.window.showQuickPick(tenantQuickPickItems as TenantInfoQuickPickItem[], {
			ignoreFocusOut: false,
			title: title,
			canPickMany: false
		});
		if (tenantQuickPickItem !== undefined) {
			// Remove uncessary QuickPickItem properties
			// @ts-ignore
			delete tenantQuickPickItem.label;
			// @ts-ignore
			delete tenantQuickPickItem.detail;
			tenantInfo = tenantQuickPickItem;
		}
	}
	console.log("<chooseTenant: tenant = ", tenantInfo);
	return tenantInfo;
}

export function getSelectionContent(editor: vscode.TextEditor): string | undefined {
	var selections = editor.selections;

	if (!selections
		|| !selections.length
		|| (selections.length === 1
			&& selections[0].isSingleLine
			&& selections[0].start.character === selections[0].end.character)
	) {
		return editor.document.getText(getFullDocumentRange(editor));
	}

	return editor.document.getText(selections[0]);
}


export function getFullDocumentRange(editor: vscode.TextEditor): vscode.Selection {
	if (editor.document.lineCount > 0) {
		let lineCount = editor.document.lineCount;
		return new vscode.Selection(0, 0, lineCount - 1, editor.document.lineAt(lineCount - 1).text.length);
	}

	return new vscode.Selection(0, 0, 0, 0);
}

/**
 * If the file already exists, request confirmation to overwrite the content of the file. It actually deletes it.
 * @returns true if user is OK for overwriting
 */
export async function confirmFileOverwrite(exportFile: string): Promise<boolean> {
	if (fs.existsSync(exportFile)) {
		const answer = await vscode.window.showQuickPick(["No", "Yes"], { placeHolder: 'The file already exists, do you want to overwrite it?' });
		if (answer === undefined || answer === "No") {
			console.log("< confirmFileOverwrite: do not overwrite file");
			return false;
		}
		fs.unlinkSync(exportFile);
	}
	console.log("< confirmFileOverwrite: overwrite file");
	return true;
}