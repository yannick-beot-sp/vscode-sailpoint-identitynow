import * as vscode from "vscode";

import * as commands from "../commands/constants.js";
import { CampaignsTreeItem } from "../models/ISCTreeItem.js";
import { WizardContext } from "../wizard/wizardContext.js";
import { runWizard } from "../wizard/wizard.js";
import { InputPromptStep } from "../wizard/inputPromptStep.js";


/**
 * Filter campaign by type
 */
export class CertificationCampaignNameFilterCommand {

    public async execute(node: CampaignsTreeItem): Promise<void> {
        const wizardContext: WizardContext = {};

        const values = await runWizard({
            title: "Filter Certification by Name",
            hideStepCount: false,
            promptSteps: [
                new InputPromptStep({
                    name: "name",
                    displayName: "Application",
                    options: {
                        placeHolder: "Search Campaign",
                        default: node.filters
                    }
                }),
            ],
        }, wizardContext);
        
        if (values === undefined) { return; }

        node.filters = values["name"];
        vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
    }
}