import * as vscode from 'vscode';
import { NEW_ID } from '../constants.js';
import { TransformsTreeItem } from "../models/ISCTreeItem.js";
import { getResourceUri } from '../utils/UriUtils.js';
import { createNewFile } from '../utils/vsCodeHelpers.js';
import { compareByLabel } from '../utils.js';
import { WizardContext } from '../wizard/wizardContext.js';
import { TenantService } from '../services/TenantService.js';
import { runWizard } from '../wizard/wizard.js';
import { QuickPickTenantStep } from '../wizard/quickPickTenantStep.js';
import { Validator } from '../validator/validator.js';
import { InputPromptStep } from '../wizard/inputPromptStep.js';
import { QuickPickPromptStep } from '../wizard/quickPickPromptStep.js';
import { TenantInfo } from '../models/TenantInfo.js';
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const transforms = require('../../snippets/transforms.json');

/**
 * Export for reuse
 */
export const transformNameValidator = new Validator({
    required: true,
    maxLength: 50,
    regexp: '^[A-Za-z0-9 _:;,={}@()#-|^%$!?.*]{1,50}$'
});

/**
 * Command used to open a source or a transform
 */
export class NewTransformCommand {

    constructor(private readonly tenantService: TenantService) { }

    async execute(node: TransformsTreeItem): Promise<void> {

        console.log("> NewTransformCommand.execute", node);
        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (node !== undefined && node instanceof TransformsTreeItem) {
            context["tenant"] = this.tenantService.getTenant(node.tenantId);
        }
        const values = await runWizard({
            title: "Creation of a transform",
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => { },
                    "create a transform"),
                new InputPromptStep({
                    name: "transform",
                    options: {
                        validateInput: (s: string) => { return transformNameValidator.validate(s); }
                    }
                }),
                new QuickPickPromptStep({
                    name: "transformType",
                    items: (context: WizardContext): vscode.QuickPickItem[] => {
                        return Object.keys(transforms)
                            .map((k: any) => ({
                                "label": k,
                                "detail": transforms[k].description,
                                "template": transforms[k].newtemplate
                            }))
                            .sort(compareByLabel);
                    }
                }),
            ]
        }, context);
        
        if (values === undefined) { return; }

        const tenantName = (values["tenant"] as TenantInfo).tenantName
        const transformName = values["transform"]
        const transformType = values["transformType"]

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async () => {
            const newUri = getResourceUri(tenantName, 'transforms', NEW_ID, transformName);

            const strContent = transformType.template.replaceAll("{TRANSFORM_NAME}", transformName);

            await createNewFile(newUri, strContent);
        });
    }
}
