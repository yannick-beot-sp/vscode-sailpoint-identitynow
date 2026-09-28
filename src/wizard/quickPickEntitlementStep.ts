
import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep.js";
import { WizardContext } from "./wizardContext.js";
import { ISCClient } from "../services/ISCClient.js";
import { isEmpty } from '../utils/stringUtils.js';

export class QuickPickEntitlementStep extends QuickPickPromptStep<WizardContext, vscode.QuickPickItem> {
    constructor(
        getISCClient: () => ISCClient,
        private readonly entitlementQueryKey = "entitlementQuery",
    ) {
        super({
            name: "entitlements",
            options: {
                canPickMany: true,
                matchOnDescription: true,
                matchOnDetail: true
            },
            skipIfOne: true,
            items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                const client = getISCClient()
                const results = (await client.searchAllEntitlements(context[entitlementQueryKey], 100, ["id", "name", "description", "source.name"]))
                    .map(x => ({
                        id: x.id,
                        label: x.name,
                        name: x.name,
                        description: x.source.name,
                        detail: x.displayName
                    }));

                return results;
            }
        })
    }
    public shouldPrompt(context: WizardContext): boolean {
        if (isEmpty(context[this.entitlementQueryKey])) {
            return false
        }
        return super.shouldPrompt(context)
    }
}

