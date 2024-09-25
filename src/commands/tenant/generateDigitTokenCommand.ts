import { TenantTreeItem } from "../../models/ISCTreeItem";
import * as vscode from 'vscode';
import { TenantService } from "../../services/TenantService";
import { WizardContext } from "../../wizard/wizardContext";
import { ISCClient } from "../../services/ISCClient";
import { runWizard } from "../../wizard/wizard";
import { QuickPickTenantStep } from "../../wizard/quickPickTenantStep";
import { InputIdentityQueryStep } from "../../wizard/inputIdentityQueryStep";
import { QuickPickIdentityStep } from "../../wizard/quickPickIdentityStep";


export class GenerateDigitTokenCommand {
    constructor(private readonly tenantService: TenantService) { }

    async execute(node: TenantTreeItem): Promise<void> {
        console.log("> GenerateDigitTokenCommand.execute", node);
        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (node !== undefined && node instanceof TenantTreeItem) {
            context["tenant"] = this.tenantService.getTenant(node.tenantId);
        }
        let client: ISCClient | undefined = undefined;

        const values = await runWizard({
            title: "Generate a digit token",
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new ISCClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                    }),
                new InputIdentityQueryStep("identityQuery", "Identity to generate a digit token for"),
                new QuickPickIdentityStep(
                    "Identity",
                    () => { return client; },
                    "identity",
                    "identityQuery"
                )
            ]
        }, context);
        
        if (values === undefined) { return; }
        const identity = values["identity"]

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Generating a digit token for ${identity.name}...`,
            cancellable: true
        }, async (task, token) => {
            const config = await client.getPasswordOrgConfig()
            if (token.isCancellationRequested) {
                return undefined
            }
            const digitToken = await client.generateDigitToken(
                identity.attributes.uid,
                config.digitTokenDurationMinutes,
                config.digitTokenLength
            )
            return { digitToken, durationMinutes: config.digitTokenDurationMinutes }

        }).then(async (response) => {
            const btnLabel = "Copy Code"
            const returned = await vscode.window.showInformationMessage(
                `The digit token for ${identity.name} is ${response.digitToken}. Token is valid for ${response.durationMinutes} minutes`,
                btnLabel)
            if (btnLabel === returned) {
                vscode.env.clipboard.writeText(response.digitToken)
            }

        })
    }
}