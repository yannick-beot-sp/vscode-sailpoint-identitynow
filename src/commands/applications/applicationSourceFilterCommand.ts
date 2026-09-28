import * as vscode from "vscode";
import { ApplicationsTreeItem } from "../../models/ISCTreeItem.js";
import { WizardContext } from "../../wizard/wizardContext.js";
import { runWizard } from "../../wizard/wizard.js";
import { TenantService } from "../../services/TenantService.js";
import { QuickPickSourceStep } from "../../wizard/quickPickSourceStep.js";
import { ISCClient } from "../../services/ISCClient.js";
import * as commands from "../constants.js";

/**
 * Choose a source
 */
export class ApplicationSourceFilterCommand {

    constructor() { }

    public async execute(node: ApplicationsTreeItem): Promise<void> {
        const wizardContext: WizardContext = { };
        const client = new ISCClient(
            node.tenantId, node.tenantName);

        const values = await runWizard({
            title: "Filter Applications by Source",
            hideStepCount: true,
            promptSteps: [
                new QuickPickSourceStep(() => { return client!; }),
            ],
        }, wizardContext);

        if (values === undefined) { return; }

        node.sourceId = values["source"].id;
        vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
    }

    public async removeFilter(node: ApplicationsTreeItem): Promise<void> {
        node.sourceId = undefined
        vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
    }
}