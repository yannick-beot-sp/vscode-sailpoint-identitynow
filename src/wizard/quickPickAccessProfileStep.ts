
import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep";
import { WizardContext } from "./wizardContext";
import { IdentityNowClient } from "../services/IdentityNowClient";
import { isEmpty } from '../utils/stringUtils';

export class QuickPickAccessProfileStep extends QuickPickPromptStep<WizardContext, vscode.QuickPickItem> {
    constructor(
        getIdentityNowClient: () => IdentityNowClient,
        private readonly accessProfileQueryKey = "accessProfileQuery",
    ) {
        super({
            name: "accessProfiles",
            displayName: "access profiles",
            options: {
                canPickMany: true,
                matchOnDescription: true,
                matchOnDetail: true
            },
            skipIfOne: true,
            items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                const client = getIdentityNowClient()
                const results = (await client.searchAccessProfiles(context[accessProfileQueryKey], 100, ["id", "name", "description", "source.name"]))
                    .map(x => ({
                        id: x.id,
                        label: x.name,
                        name: x.name,
                        description: x.source.name,
                        detail: x.description
                    }));

                return results;
            }
        })
    }
    public shouldPrompt(context: WizardContext): boolean {
        if (isEmpty(context[this.accessProfileQueryKey])) {
            return false
        }
        return super.shouldPrompt(context)
    }
}

