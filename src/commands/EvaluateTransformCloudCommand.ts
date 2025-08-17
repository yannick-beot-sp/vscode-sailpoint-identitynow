import * as vscode from 'vscode';
import { TransformTreeItem } from "../models/ISCTreeItem";
import { ISCClient } from "../services/ISCClient";
import { requiredValidator } from "../validator/requiredValidator";
import { InputPromptStep } from "../wizard/inputPromptStep";
import { QuickPickIdentityStep } from "../wizard/quickPickIdentityStep";
import { runWizard } from "../wizard/wizard";
import { WizardContext } from "../wizard/wizardContext";
import * as commands from "./constants";


class CachedInputIdentityQueryStep extends InputPromptStep<WizardContext> {
    constructor() {
        super({
            name: "identityQuery",
            displayName: "identity query",
            options: {
                validateInput: requiredValidator,
                learnMoreLink: "https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#searching-identity-data",
                shouldPrompt: () => true
            }
        });
    }
}

// Always present. Use to generate the preview.
const IDENTITY_ATTRIBUTE = "uid"
const LBL_RETEST = "Test Again"

export class EvaluateTransformCloudCommand {
    // Cache used so when we reevaluate, we have the possibility to reuse the previsous identity
    private _IdentityInputCache: Map<string, string>
    constructor() {
        this._IdentityInputCache = new Map()
    }

    async execute(node: TransformTreeItem): Promise<void> {
        console.log("> EvaluateTransformCloudCommand.execute", node);
        const context: WizardContext = {
            identityQuery: this._IdentityInputCache.get(node.id)
        };

        let client = new ISCClient(
            node.tenantId, node.tenantName)


        const values = await runWizard({
            title: "Evaluate transform",
            hideStepCount: true,
            promptSteps: [

                new CachedInputIdentityQueryStep(),
                new QuickPickIdentityStep(
                    "Target Identity",
                    () => { return client; },
                    "identity",
                    "identityQuery"
                )
            ]
        }, context);


        if (values === undefined) { return; }
        const targetIdentity = values["identity"]
        this._IdentityInputCache.set(node.id, targetIdentity.name) // storing the identity for next time

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Evaluating ${node.label} for ${targetIdentity.name}...`,
            cancellable: false
        }, async () => {
            const identityId = targetIdentity.id
            const transformName = node.label

            return await client.getIdentityPreview(
                identityId,
                [{
                    identityAttributeName: IDENTITY_ATTRIBUTE,
                    transformDefinition: {
                        type: "reference",
                        attributes: {
                            id: transformName
                        }
                    }
                }]
            )

        }).then(async (result) => {
            const attr = result?.previewAttributes?.find(x => x.name === IDENTITY_ATTRIBUTE)
            if (!attr?.errorMessages) {
                return await vscode.window.showInformationMessage(`${node.label} = ${attr.value}`, LBL_RETEST);
            } else {
                return await vscode.window.showErrorMessage(
                    `Could not evaluate ${node.label}: ` + attr.errorMessages.map(x => x.text).join(", "),
                    LBL_RETEST)
            }
        }).then((label) => {
            if (LBL_RETEST === label) {
                vscode.commands.executeCommand(commands.EVALUATE_TRANSFORM_CLOUD, node);
            }
        })

    }


}