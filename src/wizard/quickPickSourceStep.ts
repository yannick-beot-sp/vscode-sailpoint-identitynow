
import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep";
import { WizardContext } from "./wizardContext";
import { IdentityNowClient } from "../services/IdentityNowClient";

export class QuickPickSourceStep extends QuickPickPromptStep<WizardContext, vscode.QuickPickItem> {
    constructor(
        getIdentityNowClient: () => IdentityNowClient,
    ) {
        super({
            name: "source",
            options: {
                matchOnDescription: true,
                matchOnDetail: true
            },
            skipIfOne: true,
            items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                const client = getIdentityNowClient();
                const results = (await client.getSources())
                    .map(x => ({
                        ...x,
                        label: x.name,
                        detail: x.description,
                        description: x.connectorName
                    }));
                return results;
            }
        })
    }
}

