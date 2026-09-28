
import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep.js";
import { WizardContext } from "./wizardContext.js";
import { ISCClient } from "../services/ISCClient.js";
import { Source } from 'sailpoint-api-client/dist/sources/api.js';

export class QuickPickSourceStep extends QuickPickPromptStep<WizardContext, vscode.QuickPickItem> {
    constructor(
        getISCClient: () => ISCClient,
        filterFn?: (item: Source) => boolean
    ) {
        super({
            name: "source",
            options: {
                matchOnDescription: true,
                matchOnDetail: true
            },
            skipIfOne: true,
            items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                const client = getISCClient();
                let results = (await client.getSources())
                    .map(x => ({
                        ...x,
                        label: x.name,
                        detail: x.description,
                        description: x.connectorName
                    }));
                if (filterFn) {
                    results = results.filter(filterFn)
                }
                return results;
            }
        })
    }
}

