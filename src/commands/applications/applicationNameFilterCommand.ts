import * as vscode from "vscode";
import { ApplicationsTreeItem } from "../../models/ISCTreeItem";
import { WizardContext } from "../../wizard/wizardContext";
import { runWizard } from "../../wizard/wizard";
import { InputPromptStep } from "../../wizard/inputPromptStep";
import * as commands from "../constants";

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

        console.log({ values });
        if (values === undefined) { return; }

        node.filters = values["name"];
        vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
    }
}