import * as vscode from "vscode";
import { IdentityTreeItem } from "../../models/ISCTreeItem.js";
import { IdentityAccessItem } from "../../models/IdentityAccessItem.js";
import { ISCClient } from "../../services/ISCClient.js";
import {
	openAccessRequestStatusPanel,
	openAccessRequestSubmitErrorPanel,
} from "./AccessRequestStatusPanel.js";

/**
 * Interactive "Request Access" flow shared by the "Manage Access" view and the
 * identity tree command: asks for an access item, resolves it, submits the
 * request and opens the status panel.
 *
 * @returns true when a request was submitted successfully
 */
export async function requestIdentityAccess(
	extensionUri: vscode.Uri,
	identityTreeItem: IdentityTreeItem
): Promise<boolean> {
	const identityId = identityTreeItem.id!;
	const identityName = identityTreeItem.label as string;

	const accessItemTerm = await vscode.window.showInputBox({
		title: "Request Access",
		prompt: `Enter the name or ID of the role, access profile, or entitlement to grant to ${identityName}`,
		placeHolder: "Access item name or ID",
		validateInput: (value) => value.trim() ? undefined : "Access item name or ID is required",
	});

	if (!accessItemTerm?.trim()) {
		return false;
	}

	const trimmedTerm = accessItemTerm.trim();
	const client = new ISCClient(identityTreeItem.tenantId, identityTreeItem.tenantName);
	const tenantContext = {
		tenantId: identityTreeItem.tenantId,
		tenantName: identityTreeItem.tenantName,
		identityName,
	};

	let matches: IdentityAccessItem[];
	try {
		matches = await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: `Looking up access item ${trimmedTerm}...`,
				cancellable: false,
			},
			async () => client.searchRequestableAccessItems(trimmedTerm)
		);
	} catch (error: unknown) {
		openAccessRequestSubmitErrorPanel(
			extensionUri,
			{ ...tenantContext, accessItemName: trimmedTerm, accessItemType: "UNKNOWN" },
			error
		);
		return false;
	}

	if (matches.length === 0) {
		openAccessRequestSubmitErrorPanel(
			extensionUri,
			{ ...tenantContext, accessItemName: trimmedTerm, accessItemType: "UNKNOWN" },
			new Error(`No requestable role, access profile, or entitlement found for "${trimmedTerm}".`)
		);
		return false;
	}

	const resolvedItem = await pickAccessItem(matches, identityName);
	if (!resolvedItem) {
		return false;
	}

	const itemName = resolvedItem.displayName ?? resolvedItem.name ?? resolvedItem.id;
	const statusContext = {
		...tenantContext,
		accessItemName: itemName,
		accessItemType: resolvedItem.type,
	};

	try {
		const response = await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: `Submitting access request for ${itemName}...`,
				cancellable: false,
			},
			async () => client.grantIdentityAccess(identityId, resolvedItem)
		);

		openAccessRequestStatusPanel(extensionUri, {
			...statusContext,
			accessRequestIds: client.extractAccessRequestIds(response),
		});
		return true;
	} catch (error: unknown) {
		openAccessRequestSubmitErrorPanel(extensionUri, statusContext, error);
		return false;
	}
}

async function pickAccessItem(matches: IdentityAccessItem[], identityName: string): Promise<IdentityAccessItem | undefined> {
	if (matches.length === 1) {
		return matches[0];
	}

	const picked = await vscode.window.showQuickPick(
		matches.map(item => ({
			label: item.displayName ?? item.name ?? item.id,
			description: formatAccessItemType(item.type),
			detail: item.sourceName,
			item,
		})),
		{
			title: "Request Access",
			placeHolder: `Select the access item to grant to ${identityName}`,
		}
	);
	return picked?.item;
}

function formatAccessItemType(type: IdentityAccessItem["type"]): string {
	switch (type) {
		case "ROLE":
			return "Role";
		case "ACCESS_PROFILE":
			return "Access Profile";
		case "ENTITLEMENT":
			return "Entitlement";
	}
}
