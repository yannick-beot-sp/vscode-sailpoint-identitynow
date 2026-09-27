import * as vscode from "vscode";
import { NotificationTemplatesTreeItem } from "../../models/ISCTreeItem";
import { runWizard } from "../../wizard/wizard";
import { InputPromptStep } from "../../wizard/inputPromptStep";
import { QuickPickPromptStep } from "../../wizard/quickPickPromptStep";
import { ExtendedQuickPickItem } from "../../models/ExtendedQuickPickItem";
import { NOTIFICATION_TEMPLATE_MEDIUMS, notificationTemplateMediumLabel } from "../../utils/notificationTemplateList";
import * as commands from "../constants";

/**
 * Filters the cached template list by name, key, description or locale.
 * The criteria stay on the client: both collections are already loaded.
 */
export class NotificationTemplateFilterCommand {

	public async execute(node?: NotificationTemplatesTreeItem): Promise<void> {
		console.log("> NotificationTemplateFilterCommand.execute", node);
		if (!node) {
			return;
		}

		// Do not put `query` on the wizard context up front. A step is skipped
		// when its id is already present, which closed the command with no prompt.
		const values = await runWizard({
			title: "Filter notification templates",
			hideStepCount: true,
			promptSteps: [
				new InputPromptStep({
					name: "query",
					displayName: "filter",
					options: {
						prompt: "Filter notification templates",
						placeHolder: "Name, key or locale. Leave empty to clear.",
						default: node.filters,
					},
				}),
			],
		}, {});

		if (values === undefined) {
			return;
		}

		node.filters = (values["query"] as string | undefined)?.trim() ?? "";
		await vscode.commands.executeCommand(commands.REFRESH, node);
	}
}

/**
 * Filters the cached template list by medium (Email, Slack, Teams).
 */
export class NotificationTemplateMediumFilterCommand {

	public async execute(node?: NotificationTemplatesTreeItem): Promise<void> {
		console.log("> NotificationTemplateMediumFilterCommand.execute", node);
		if (!node) {
			return;
		}

		const selected = new Set(node.mediums);
		const pickAll = selected.size === 0;
		const items: ExtendedQuickPickItem[] = NOTIFICATION_TEMPLATE_MEDIUMS.map(medium => ({
			label: notificationTemplateMediumLabel(medium),
			value: medium,
			picked: pickAll || selected.has(medium),
		}));

		const values = await runWizard({
			title: "Filter notification templates by medium",
			hideStepCount: true,
			promptSteps: [
				new QuickPickPromptStep({
					name: "mediums",
					displayName: "medium",
					options: {
						canPickMany: true,
						placeHolder: "Email, Slack, Teams",
					},
					items,
					project: (item: ExtendedQuickPickItem) => item.value,
				}),
			],
		}, {});

		if (values === undefined) {
			return;
		}

		const mediums = (values["mediums"] as string[] | undefined) ?? [];
		node.mediums = mediums.length === 0 || mediums.length >= NOTIFICATION_TEMPLATE_MEDIUMS.length
			? []
			: mediums;
		await vscode.commands.executeCommand(commands.REFRESH, node);
	}
}
