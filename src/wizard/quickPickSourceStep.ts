
import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep";
import { WizardContext } from "./wizardContext";
import { ISCClient } from "../services/ISCClient";
import { Source } from 'sailpoint-api-client';

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

