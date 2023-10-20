import * as vscode from "vscode";
import { TenantService } from "../services/TenantService";
import * as fs from 'fs';
import { TenantInfo } from "../models/TenantInfo";
import { TenantInfoQuickPickItem } from "../models/TenantInfoQuickPickItem";
import { compareByName } from "../utils";
import { isBlank, isEmpty } from "./stringUtils";
import { ObjectPickItem } from "../models/ObjectPickItem";
import { OBJECT_TYPE_ITEMS, ObjectTypeQuickPickItem } from "../models/ObjectTypeQuickPickItem";

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


/**
 * Return the content of the current opened file
 * @param editor 
 * @returns content of the current opened file
 */
export function getFullContent(editor: vscode.TextEditor): string {
	return editor.document.getText(getFullDocumentRange(editor));
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

export async function askDisplayName(tenantName: string): Promise<string | undefined> {
	const result = await vscode.window.showInputBox({
		value: tenantName,
		ignoreFocusOut: true,
		placeHolder: 'company',
		prompt: "Enter a display name for this tenant",
		title: 'IdentityNow',
		validateInput: text => {
			if (isEmpty(text) || isEmpty(text.trim())) {
				return "Display name must not be empty";
			}
		}
	});
	return result;
}

export async function askFile(prompt: string, proposedFile: string): Promise<string | undefined> {
	const target = await vscode.window.showInputBox({
		ignoreFocusOut: true,
		value: proposedFile,
		prompt: prompt
	});

	if (target === undefined || isBlank(target)) {
		console.log("< askFile: no file");
		return;
	}
	const overwrite = await confirmFileOverwrite(target);
	if (!overwrite) {
		console.log("< askFile: fo not overwrite");
		return;
	}
	return target;
}

/**
 * Will prompt the user to get a folder path. 
 * If the folder does not exist, it will create it.
 * If the folder already exist, it will get confirmation to overwrite it.
 * @param prompt Prompt to display
 * @param exportFolder Proposition of folder
 * @returns undefined to escape or the folder path as string
 */
export async function askFolder(prompt: string, exportFolder: string): Promise<string | undefined> {
	const target = await vscode.window.showInputBox({
		ignoreFocusOut: true,
		value: exportFolder,
		prompt: prompt
	});
	if (target === undefined || isBlank(target)) {
		console.log("< askFolder: no folder");
		return;
	}
	if (!fs.existsSync(target)) {
		fs.mkdirSync(target, { recursive: true });
	}
	else {
		const answer = await vscode.window.showQuickPick(
			["No", "Yes"],
			{ placeHolder: 'The folder already exists, do you want to overwrite files?' });
		if (answer === undefined || answer === "No") {
			console.log("< askFolder: do not overwrite");
			return;
		}
	}
	return target;
}


/**
 * Open in preview a file/uri
 */
export async function openPreview(uri: vscode.Uri, language = "json") {

	let document = await vscode.workspace.openTextDocument(uri);
	document = await vscode.languages.setTextDocumentLanguage(document, language);
	vscode.window.showTextDocument(document, { preview: false, preserveFocus: true });

}

/**
 * Open File Dialog to choose a file
 * @param fileType the name of files (e.g. 'JSON files') 
 * @param extension the extension (e.g. 'json') 
 */
export async function chooseFile(fileType: string, extension: string): Promise<undefined | vscode.Uri> {
	const fileUri = await vscode.window.showOpenDialog({
		canSelectMany: false,
		openLabel: 'Open',
		filters: {
			[fileType]: [extension],
			// eslint-disable-next-line @typescript-eslint/naming-convention
			'All files': ['*']
		}
	});

	return fileUri === undefined || fileUri.length === 0 ? undefined : fileUri[0];
}


/**
 * Asks the user to choose from a list of ObjectPickItem
 * @param items List of ObjectPickItem 
 * @returns List of ids
 */
export async function askChosenItems(title: string, placeHolder: string, items: Array<any>): Promise<Array<string> | undefined> {
	const pickItems: ObjectPickItem[] = items
		.sort(compareByName)
		.map((x: any) => ({
			label: x.name,
			description: x.description,
			id: x.id,
			picked: true
		}));

	const result = await vscode.window.showQuickPick(
		pickItems,
		{
			ignoreFocusOut: true,
			placeHolder: placeHolder,
			title: title,
			canPickMany: true
		});

	if (result && result.length > 0) {
		return result.map(x => x.id);
	}
	return undefined;
};


/**
 * Maps object types to QuickPickItems with a human-readable label and asks to choose
 * @param objectTypes List of object types to choose from
 * @returns 
 */
export async function askSelectObjectTypes(title: string, objectTypeItems: Array<ObjectTypeQuickPickItem> = OBJECT_TYPE_ITEMS): Promise<Array<ObjectTypeQuickPickItem> | undefined> {
	const sortedObjectTypeItems = objectTypeItems
		.sort(((a, b) => (a.label > b.label) ? 1 : -1));

	const selectedObjectTypeItems = await vscode.window.showQuickPick<ObjectTypeQuickPickItem>(sortedObjectTypeItems, {
		ignoreFocusOut: false,
		title: title,
		canPickMany: true
	});

	if (selectedObjectTypeItems !== undefined
		&& Array.isArray(selectedObjectTypeItems)
		&& selectedObjectTypeItems.length > 0) {

		return selectedObjectTypeItems;
	}
	console.log("< askSelectObjectTypes: no objectType");
	return undefined;
}