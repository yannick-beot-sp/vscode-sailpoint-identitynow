import * as vscode from 'vscode';
import { TransformTreeItem } from "../models/ISCTreeItem";
import { ISCClient } from "../services/ISCClient";
import { requiredValidator } from "../validator/requiredValidator";
import { InputPromptStep } from "../wizard/inputPromptStep";
import { QuickPickIdentityStep } from "../wizard/quickPickIdentityStep";
import { runWizard } from "../wizard/wizard";
import { WizardContext } from "../wizard/wizardContext";
import * as commands from "./constants";
import { TenantService } from '../services/TenantService';
import { getIdByUri, getNameByUri } from '../utils/UriUtils';


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
    constructor(private readonly tenantService: TenantService) {
        this._IdentityInputCache = new Map()
    }

    async executeFromTreeView(node: TransformTreeItem): Promise<void> {
        console.log("> EvaluateTransformCloudCommand.executeFromTreeView", node);


        await this.execute({
            tenantId: node.tenantId,
            tenantName: node.tenantName,
            transformId: node.id,
            transformName: node.label as string
        })

    }

    async executeFromEditor(): Promise<void> {
        console.log("> EvaluateTransformCloudCommand.executeFromEditor");


        const editor = vscode.window.activeTextEditor;
        if (editor) {

            const tenantName = editor.document.uri.authority ?? "";
            const tenantInfo = await this.tenantService.getTenantByTenantName(tenantName);
            const tenantId = tenantInfo?.id ?? "";
            const transformId = getIdByUri(editor?.document.uri)
            const transformName = getNameByUri(editor?.document.uri)
            await this.execute({
                tenantId,
                tenantName,
                transformId,
                transformName
            })
        }
    }

    private async execute(options: { tenantId: string; tenantName: string; transformId: string, transformName: string }): Promise<void> {

        const { tenantId, tenantName, transformId, transformName } = options

        const context: WizardContext = {
            identityQuery: this._IdentityInputCache.get(transformId)
        };

        let client = new ISCClient(tenantId, tenantName)

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
        // storing the identity for next time
        this._IdentityInputCache.set(transformId, targetIdentity.name) 

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Evaluating ${transformName} for ${targetIdentity.name}...`,
            cancellable: false
        }, async () => {
            const identityId = targetIdentity.id

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
                return await vscode.window.showInformationMessage(`${transformName} = ${attr.value}`, LBL_RETEST);
            } else {
                return await vscode.window.showErrorMessage(
                    `Could not evaluate ${transformName}: ` + attr.errorMessages.map(x => x.text).join(", "),
                    LBL_RETEST)
            }
        }).then((label) => {
            if (LBL_RETEST === label) {
                vscode.commands.executeCommand(commands.EVALUATE_TRANSFORM_CLOUD, new TransformTreeItem(
                    tenantId, tenantName, "", transformName, transformId
                ));
            }
        })

    }




}