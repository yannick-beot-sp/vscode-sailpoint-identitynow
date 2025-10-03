
import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep";
import { WizardContext } from "./wizardContext";
import { ISCClient } from "../services/ISCClient";
import { Transform } from 'sailpoint-api-client';

export class QuickPickTransformStep extends QuickPickPromptStep<WizardContext, vscode.QuickPickItem> {
    constructor(
        getISCClient: () => ISCClient,
        filterFn?: (item: Transform) => boolean
    ) {
        super({
            name: "transform",
            
            skipIfOne: true,
            items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                const client = getISCClient();
                let results = (await client.getTransforms())
                    .map(x => ({
                        ...x,
                        label: x.name,
                    }));
                if (filterFn) {
                    results = results.filter(filterFn)
                }
                return results;
            }
        })
    }
}

