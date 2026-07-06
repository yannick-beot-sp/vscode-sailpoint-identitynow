import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep";
import { WizardContext } from "./wizardContext";

export const REASSIGN_MODE_ALL = "all";
export const REASSIGN_MODE_CHOOSE = "choose";

interface ReassignModeQuickPickItem extends vscode.QuickPickItem {
    value: string;
}

/**
 * Step 2 of the Reassign Ownership wizard: reassign everything vs hand-pick objects.
 */
export class QuickPickReassignModeStep extends QuickPickPromptStep<WizardContext, ReassignModeQuickPickItem> {
    constructor() {
        super({
            name: "reassignMode",
            displayName: "reassignment mode",
            options: { canPickMany: false },
            project: (item: ReassignModeQuickPickItem) => item.value,
            items: [
                {
                    label: "Reassign everything",
                    detail: "Reassign all objects owned by this identity for the selected types",
                    value: REASSIGN_MODE_ALL
                },
                {
                    label: "Choose what to reassign",
                    detail: "Pick individual objects per type",
                    value: REASSIGN_MODE_CHOOSE
                }
            ]
        });
    }
}
