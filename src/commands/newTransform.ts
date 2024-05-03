import * as vscode from 'vscode';
import { NEW_ID } from '../constants';
import { TransformsTreeItem } from "../models/ISCTreeItem";
import { TransformQuickPickItem } from '../models/TransformQuickPickItem';
import { isEmpty } from '../utils/stringUtils';
import { getResourceUri } from '../utils/UriUtils';
import { createNewFile } from '../utils/vsCodeHelpers';
import { compareByLabel } from '../utils';
import { WizardContext } from '../wizard/wizardContext';
import { TenantService } from '../services/TenantService';
import { ISCClient } from '../services/ISCClient';
import { runWizard } from '../wizard/wizard';
import { QuickPickTenantStep } from '../wizard/quickPickTenantStep';
import { Validator } from '../validator/validator';
import { InputPromptStep } from '../wizard/inputPromptStep';
import { QuickPickPromptStep } from '../wizard/quickPickPromptStep';
import { TenantInfo } from '../models/TenantInfo';
const transforms = require('../../snippets/transforms.json');


const transformNameValidator = new Validator({
    required: true,
    maxLength: 50,
    regexp: '^[A-Za-z0-9 _:;,={}@()#-|^%$!?.*]{1,50}$'
});

/**
 * Command used to open a source or a transform
 */
export class NewTransformCommand {

    constructor(private readonly tenantService: TenantService) { }

    async askTransformType(): Promise<TransformQuickPickItem | undefined> {

        const transformPickList = Object.keys(transforms)
            .map((k: any) => ({
                "label": k,
                "detail": transforms[k].description,
                "template": transforms[k].newtemplate
            }))
            .sort(compareByLabel);

        const transform = await vscode.window.showQuickPick(transformPickList, {
            ignoreFocusOut: false,
            title: "Transform to use",
            canPickMany: false
        });
        return transform;
    }

    async execute(node: TransformsTreeItem): Promise<void> {

        console.log("> NewTransformCommand.execute", node);
        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (node !== undefined && node instanceof TransformsTreeItem) {
            context["tenant"] = this.tenantService.getTenant(node.tenantId);
        }
        const values = await runWizard({
            title: "Creation of a role",
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
        console.log({ values });
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
