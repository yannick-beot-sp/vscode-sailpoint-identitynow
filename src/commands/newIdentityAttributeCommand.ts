import * as vscode from 'vscode';
import { RESOURCE_TYPES } from '../constants';
import { IdentityAttributesTreeItem } from "../models/ISCTreeItem";
import { buildResourceUri } from '../utils/UriUtils';
import { openPreview } from '../utils/vsCodeHelpers';
import * as commands from "../commands/constants";
import { WizardContext } from '../wizard/wizardContext';
import { TenantService } from '../services/TenantService';
import { runWizard } from '../wizard/wizard';
import { QuickPickTenantStep } from '../wizard/quickPickTenantStep';
import { Validator } from '../validator/validator';
import { InputPromptStep } from '../wizard/inputPromptStep';
import { toCamelCase } from '../utils/stringUtils';
import { ISCClient } from '../services/ISCClient';


const identityAttributeNameValidator = new Validator({
    required: true,
    maxLength: 128,
    regexp: '^[A-Za-z0-9 ]{1,128}$'
});

/**
 * Command used to open a source or a transform
 */
export class NewIdentityAttributeCommand {

    constructor(private readonly tenantService: TenantService) { }

    async execute(node: IdentityAttributesTreeItem): Promise<void> {

        console.log("> NewTransformCommand.execute", node);
        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (node !== undefined && node instanceof IdentityAttributesTreeItem) {
            context["tenant"] = this.tenantService.getTenant(node.tenantId);
        }
        const values = await runWizard({
            title: "Creation of an identity attribute",
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async () => { },
                    "create an identity attribute"),
                new InputPromptStep({
                    name: "identityAttributeDisplayName",
                    displayName: "Identity attribute's business-friendly",
                    options: {
                        validateInput: (s: string) => { return identityAttributeNameValidator.validate(s); }
                    }
                }),

            ]
        }, context);
        console.log({ values });
        if (values === undefined) { return; }

        const identityAttributeDisplayName = values["identityAttributeDisplayName"]
        const identityAttributeTechnicalName = toCamelCase(identityAttributeDisplayName)
        const tenantName = values["tenant"].tenantName as string
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating Identity Attribute...',
            cancellable: false
        }, async () => {

            const client = new ISCClient(
                values["tenant"].id, values["tenant"].tenantName)

            await client.createIdentityAttribute({
                "sources": [
                    {
                        "type": "rule",
                        "properties": {
                            "ruleType": "IdentityAttribute",
                            "ruleName": "Cloud Promote Identity Attribute"
                        }
                    }
                ],
                "name": identityAttributeTechnicalName,
                "displayName": identityAttributeDisplayName,
                "standard": false,
                "type": "string",
                "multi": false,
                "searchable": false,
                "system": false
            })

            const newUri = buildResourceUri({
                tenantName,
                resourceType: RESOURCE_TYPES.identityAttribute,
                id: identityAttributeTechnicalName,
                name: identityAttributeDisplayName
            })

            vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
            openPreview(newUri)
        });
    }
}
