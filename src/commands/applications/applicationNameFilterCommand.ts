import * as vscode from "vscode";
import { ApplicationsTreeItem } from "../../models/ISCTreeItem.js";
import { WizardContext } from "../../wizard/wizardContext.js";
import { runWizard } from "../../wizard/wizard.js";
import { InputPromptStep } from "../../wizard/inputPromptStep.js";
import * as commands from "../constants.js";

/**
 * Search apps by name
 */
export class ApplicationNameFilterCommand {

    public async execute(node: ApplicationsTreeItem): Promise<void> {
        const wizardContext: WizardContext = {};

        const values = await runWizard({
            title: "Filter Applications by Name",
            hideStepCount: false,
            promptSteps: [
                new InputPromptStep({
                    name: "name",
                    displayName: "Application",
                    options: {
                        placeHolder: "Search Apps",
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