
import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep";
import { WizardContext } from "./wizardContext";
import { ISCClient } from "../services/ISCClient";
import { isEmpty } from '../utils/stringUtils';

export class QuickPickAccessProfileStep extends QuickPickPromptStep<WizardContext, vscode.QuickPickItem> {
    private readonly accessProfileQueryKey: string

    constructor({
        getISCClient,
        canPickMany = true,
        accessProfileQueryKey = "accessProfileQuery"
    }: {
        getISCClient: () => ISCClient,
        canPickMany?: boolean,
        accessProfileQueryKey?: string
    }) {
        super({
            name: "accessProfiles",
            displayName: "access profiles",
            options: {
                canPickMany,
                matchOnDescription: true,
                matchOnDetail: true
            },
            skipIfOne: true,
            items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                const client = getISCClient()
                const results = (await client.searchAccessProfiles(context[accessProfileQueryKey], 100, ["id", "name", "description", "source.name"]))
                    .map(x => ({
                        id: x.id,
                        label: x.name,
                        name: x.name,
                        description: x.source.name,
                        detail: x.description
                    }));

                return results;
            }
        })

        this.accessProfileQueryKey = accessProfileQueryKey
    }
    public shouldPrompt(context: WizardContext): boolean {
        if (isEmpty(context[this.accessProfileQueryKey])) {
            return false
        }
        return super.shouldPrompt(context)
    }
}

