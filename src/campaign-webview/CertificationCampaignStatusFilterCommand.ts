import * as vscode from "vscode";

import * as commands from "../commands/constants.js";
import { CampaignsTreeItem } from "../models/ISCTreeItem.js";
import { WizardContext } from "../wizard/wizardContext.js";
import { runWizard } from "../wizard/wizard.js";
import { ExtendedQuickPickItem } from "../models/ExtendedQuickPickItem.js";
import { Campaign2StatusEnum } from "sailpoint-api-client/dist/certification_campaigns/api.js";
import { capitalizeFirstLetter } from "../utils/stringUtils.js";
import { compareByLabel } from "../utils.js";
import { QuickPickPromptStep } from "../wizard/quickPickPromptStep.js";


function prepareStatusPickItems(statuses: string[]): ExtendedQuickPickItem[] {
    return Object.values(Campaign2StatusEnum).map(key => ({
        label: capitalizeFirstLetter(key),
        value: key,
        picked: statuses.includes(key)

    }))
        .sort(compareByLabel)
}

/**
 * Search apps by name
 */
export class CertificationCampaignStatusFilterCommand {

    public async execute(node: CampaignsTreeItem): Promise<void> {
        const wizardContext: WizardContext = {};


        const values = await runWizard({
            title: "Filter Applications by Source",
            hideStepCount: true,
            promptSteps: [
                new QuickPickPromptStep({
                    name: "status",
                    options: {
                        matchOnDetail: true,
                        canPickMany: true
                    },
                    items: (context: WizardContext): ExtendedQuickPickItem[] => prepareStatusPickItems(node.status),
                    project: (item: ExtendedQuickPickItem) => item.value
                })
            ],
        }, wizardContext);

        if (values === undefined) { return; }
        
        if (values["status"].length === 0) {
            vscode.window.showErrorMessage("You must select at least a status")
            return;
        }

        node.status = values["status"];
        vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
    }
}