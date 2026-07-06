import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep";
import { WizardContext } from "./wizardContext";
import { REASSIGNABLE_OBJECT_TYPES } from "../models/ReassignOwnership";

/**
 * Step 1 of the Reassign Ownership wizard: pick which object types to consider.
 */
export class QuickPickObjectTypeStep extends QuickPickPromptStep<WizardContext, vscode.QuickPickItem> {
    constructor() {
        super({
            name: "objectTypes",
            displayName: "object types",
            options: { canPickMany: true },
            storeString: true,
            items: REASSIGNABLE_OBJECT_TYPES.map(label => ({ label, picked: true }))
        });
    }
}
