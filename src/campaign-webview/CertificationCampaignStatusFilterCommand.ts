import * as vscode from "vscode";

import * as commands from "../commands/constants";
import { CampaignsTreeItem } from "../models/ISCTreeItem";
import { WizardContext } from "../wizard/wizardContext";
import { runWizard } from "../wizard/wizard";
import { ExtendedQuickPickItem } from "../models/ExtendedQuickPickItem";
import { CampaignStatusEnum } from "sailpoint-api-client";
import { convertPascalCase2SpaceBased } from "../utils/stringUtils";
import { compareByLabel } from "../utils";
import { QuickPickPromptStep } from "../wizard/quickPickPromptStep";


function prepareStatusPickItems(statuses: string[]): ExtendedQuickPickItem[] {
    return Object.keys(CampaignStatusEnum).map(key => ({
        label: convertPascalCase2SpaceBased(key),
        value: CampaignStatusEnum[key],
        picked: statuses.includes(CampaignStatusEnum[key])

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