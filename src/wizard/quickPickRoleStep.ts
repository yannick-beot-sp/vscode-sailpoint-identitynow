import * as vscode from 'vscode';
import { QuickPickPromptStep } from "./quickPickPromptStep.js";
import { WizardContext } from "./wizardContext.js";
import { ISCClient } from "../services/ISCClient.js";
import { isEmpty } from '../utils/stringUtils.js';

export class QuickPickRoleStep extends QuickPickPromptStep<WizardContext, vscode.QuickPickItem> {
    constructor(
        getISCClient: () => ISCClient,
        private readonly roleQueryKey = "roleQuery",
    ) {
        super({
            name: "roles",
            options: {
                canPickMany: true,
                matchOnDescription: true,
                matchOnDetail: true
            },
            skipIfOne: true,
            items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                const client = getISCClient()
                const results = (await client.searchAllRoles(context[roleQueryKey], 100, ["id", "name", "description"]))
                    .map(x => ({
                        id: x.id,
                        label: x.name,
                        name: x.name,
                        detail: x.description
                    }));

                return results;
            }
        })
    }
    public shouldPrompt(context: WizardContext): boolean {
        if (isEmpty(context[this.roleQueryKey])) {
            return false
        }
        return super.shouldPrompt(context)
    }
}
