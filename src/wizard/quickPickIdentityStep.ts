
import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep";
import { WizardContext } from "./wizardContext";
import { IdentityNowClient } from "../services/IdentityNowClient";

export class QuickPickIdentityStep extends QuickPickPromptStep<WizardContext, vscode.QuickPickItem> {
    constructor(
        displayName: string,
        getIdentityNowClient: () => IdentityNowClient,
        name = "owner",
        queryName = "ownerQuery"
    ) {
        super({
            name,
            displayName,
            skipIfOne: true,
            items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                const client = getIdentityNowClient();
                const results = (await client.searchIdentities(context[queryName], 100, ["id", "name", "displayName", "email"]))
                    .map(x => {
                        const email = x.email ? `(${x.email})` : undefined;
                        const description = x.displayName ? [x.displayName, email].join(' ') : x.email;

                        return {
                            ...x,
                            label: x.name,
                            description
                        };
                    });

                return results;
            }
        });
    }
}

