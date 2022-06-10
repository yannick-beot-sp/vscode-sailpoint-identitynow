import * as vscode from "vscode";
import { TenantService } from "../services/TenantService";


export async function chooseTenant(tenantService: TenantService, title:string): Promise<string|undefined> {
	console.log("> chooseTenant");
	const tenants = tenantService.getTenants().sort();
	let tenantName: string | undefined = '';
	if (tenants.length < 1) {
		return;
	} else if (tenants.length === 1) {
		tenantName = tenants[0];
	} else {
		tenantName = await vscode.window.showQuickPick(tenants, { placeHolder: title });
		if (tenantName === undefined) {
			console.log("chooseTenant: no tenant");
			return undefined;
		}
	}
	console.log("<chooseTenant: tenant = ", tenantName);
	return tenantName;
}

export function getSelectionContent(editor: vscode.TextEditor): string|undefined {
	var selections = editor.selections;

	if (!selections
		|| !selections.length
		|| (selections.length === 1
			&& selections[0].isSingleLine
			&& selections[0].start.character === selections[0].end.character)
	) {
		return undefined;
	}

	return editor.document.getText(selections[0]);
}
