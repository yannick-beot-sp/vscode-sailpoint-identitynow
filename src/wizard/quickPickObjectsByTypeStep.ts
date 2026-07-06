import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep";
import { WizardContext } from "./wizardContext";
import { ISCClient } from "../services/ISCClient";
import { ReassignableObject, ReassignableObjectType, listOwnedObjects, objectsContextKey } from "../models/ReassignOwnership";

/**
 * "Choose what to reassign" mode: one instance of this step per selected object type,
 * listing the objects of that type currently owned by (or assigned to) the source identity.
 *
 * The list is fetched once in configureBeforePrompt (which always runs, even if the step
 * ends up being skipped) and cached, so shouldPrompt can skip the step entirely -- and
 * move straight to the next type -- when there is nothing to reassign for this type,
 * without fetching twice.
 */
export class QuickPickObjectsByTypeStep extends QuickPickPromptStep<WizardContext, vscode.QuickPickItem> {
    private cachedObjects: ReassignableObject[] | undefined;

    constructor(
        private readonly objectType: ReassignableObjectType,
        private readonly getISCClient: () => ISCClient
    ) {
        super({
            name: objectsContextKey(objectType),
            displayName: objectType,
            options: {
                canPickMany: true,
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: `Choose ${objectType} to reassign`
            },
            items: (): vscode.QuickPickItem[] => {
                return (this.cachedObjects ?? []).map(x => ({
                    id: x.id,
                    label: x.name,
                    description: x.description,
                    picked: true
                } as vscode.QuickPickItem));
            }
        });
        this.id = objectsContextKey(objectType);
    }

    public async configureBeforePrompt(context: WizardContext): Promise<void> {
        const client = this.getISCClient();
        this.cachedObjects = await listOwnedObjects(client, this.objectType, context["sourceIdentityId"]);
    }

    public shouldPrompt(context: WizardContext): boolean {
        if (this.cachedObjects !== undefined && this.cachedObjects.length === 0) {
            return false;
        }
        return super.shouldPrompt(context);
    }
}
