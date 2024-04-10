
import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep";
import { WizardContext } from "./wizardContext";
import { ISCClient } from "../services/ISCClient";
import { isEmpty } from '../utils/stringUtils';

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
                const results = (await client.searchEntitlements(context[entitlementQueryKey], 100, ["id", "name", "description", "source.name"]))
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

