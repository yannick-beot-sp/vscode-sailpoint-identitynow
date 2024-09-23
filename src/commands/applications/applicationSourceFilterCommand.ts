import * as vscode from "vscode";
import { ApplicationsTreeItem } from "../../models/ISCTreeItem";
import { WizardContext } from "../../wizard/wizardContext";
import { runWizard } from "../../wizard/wizard";
import { TenantService } from "../../services/TenantService";
import { QuickPickSourceStep } from "../../wizard/quickPickSourceStep";
import { ISCClient } from "../../services/ISCClient";
import * as commands from "../constants";

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

        console.log({ values });
        if (values === undefined) { return; }

        node.sourceId = values["source"].id;
        vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
    }

    public async removeFilter(node: ApplicationsTreeItem): Promise<void> {
        node.sourceId = undefined
        vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
    }
}