
import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep";
import { WizardContext } from "./wizardContext";
import { ISCClient } from "../services/ISCClient";

export class QuickPickIdentityStep extends QuickPickPromptStep<WizardContext, vscode.QuickPickItem> {
    constructor(
        displayName: string,
        getISCClient: () => ISCClient,
        name = "owner",
        queryName = "ownerQuery"
    ) {
        super({
            name,
            displayName,
            skipIfOne: true,
            items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                const client = getISCClient();
                const results = (await client.searchIdentities(context[queryName], 100, ["id", "name", "displayName", "email", "attributes.uid"]))
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

