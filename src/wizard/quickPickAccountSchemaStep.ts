
import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep.js";
import { WizardContext } from "./wizardContext.js";
import { ISCClient } from "../services/ISCClient.js";

export class QuickPickAccountSchemaStep extends QuickPickPromptStep<WizardContext, vscode.QuickPickItem> {
    constructor(
        getISCClient: () => ISCClient,
    ) {
        super({
            name: "attribute",
            options: {
                matchOnDescription: true,
                matchOnDetail: true
            },
            skipIfOne: true,
            items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                const client = getISCClient();
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

