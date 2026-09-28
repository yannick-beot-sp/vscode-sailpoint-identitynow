import * as vscode from 'vscode';
import { TenantService } from "../services/TenantService.js";
import { SearchAttributesTreeItem } from '../models/ISCTreeItem.js';
import { ISCClient } from '../services/ISCClient.js';
import { getResourceUri } from '../utils/UriUtils.js';
import { SearchAttributeConfig } from 'sailpoint-api-client/dist/search_attribute_configuration/api.js';
import { runWizard } from '../wizard/wizard.js';
import { InputPromptStep } from '../wizard/inputPromptStep.js';
import { Validator } from '../validator/validator.js';
import { WizardContext } from '../wizard/wizardContext.js';
import { QuickPickTenantStep } from '../wizard/quickPickTenantStep.js';
import { openPreview } from '../utils/vsCodeHelpers.js';
import { QuickPickSourceStep } from '../wizard/quickPickSourceStep.js';
import { QuickPickAccountSchemaStep } from '../wizard/quickPickAccountSchemaStep.js';
import * as commands from "../commands/constants.js";

const searchAttributeNameValidator = new Validator({
    required: true,
    maxLength: 128,
    regexp: '^[A-Za-z0-9 _:;,={}@()#-|^%$!?.*]+$'
});

/**
 * Command used to create a Search Attribute
 */
export class NewAttributeSearchConfigCommand {

    constructor(private readonly tenantService: TenantService) { }

    async execute(node?: SearchAttributesTreeItem): Promise<void> {

        console.log("> NewAttributeSearchConfigCommand.newRole", node);
        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (node !== undefined && node instanceof SearchAttributesTreeItem) {
            context["tenant"] = this.tenantService.getTenant(node.tenantId);
        }

        let client: ISCClient | undefined = undefined;
        const values = await runWizard({
            title: "Creation of a search attribute",
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new ISCClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                    },
                    "create a search attribute"),
                new InputPromptStep({
                    name: "searchAttribute",
                    displayName: "search attribute",
                    options: {
                        validateInput: (s: string) => { return searchAttributeNameValidator.validate(s); }
                    }
                }),
                new QuickPickSourceStep(() => { return client!; }),
                new QuickPickAccountSchemaStep(() => { return client!; }),
            ]
        }, context);
        
        if (values === undefined) { return; }

        const name = values["searchAttribute"].trim()
        const searchAttribute: SearchAttributeConfig = {
            name: name,
            displayName: name,
            applicationAttributes: {}
        }
        searchAttribute.applicationAttributes[values["source"].id] = values["attribute"].name

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating Attribute Search...',
            cancellable: false
        }, async (task, token) => {

            await client.createSearchAttribute(searchAttribute)
            const newUri = getResourceUri(
                values["tenant"].tenantName,
                "accounts/search-attribute-config",
                name,
                name
            )

            openPreview(newUri);
            vscode.commands.executeCommand(commands.REFRESH_FORCED);
        });
    }
}
