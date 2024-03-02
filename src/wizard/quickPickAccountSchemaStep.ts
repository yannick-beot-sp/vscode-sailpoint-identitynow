
import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep";
import { WizardContext } from "./wizardContext";
import { IdentityNowClient } from "../services/IdentityNowClient";

export class QuickPickAccountSchemaStep extends QuickPickPromptStep<WizardContext, vscode.QuickPickItem> {
    constructor(
        getIdentityNowClient: () => IdentityNowClient,
    ) {
        super({
            name: "attribute",
            options: {
                matchOnDescription: true,
                matchOnDetail: true
            },
            skipIfOne: true,
            items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                const client = getIdentityNowClient();
                const source = context["source"];
                const results = (await client.getSchemas(source.id))
                    .find(x => x.name === "account")?.attributes?.map(x => ({
                        ...x,
                        label: x.name,
                        description: x.description
                    }));
                return results;
            }
        })
    }
}

