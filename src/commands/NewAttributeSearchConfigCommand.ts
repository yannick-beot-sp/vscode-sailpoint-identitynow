import * as vscode from 'vscode';
import { TenantService } from "../services/TenantService";
import { SearchAttributesTreeItem } from '../models/ISCTreeItem';
import { ISCClient } from '../services/ISCClient';
import { getResourceUri } from '../utils/UriUtils';
import { SearchAttributeConfigBeta } from 'sailpoint-api-client';
import { runWizard } from '../wizard/wizard';
import { InputPromptStep } from '../wizard/inputPromptStep';
import { Validator } from '../validator/validator';
import { WizardContext } from '../wizard/wizardContext';
import { QuickPickTenantStep } from '../wizard/quickPickTenantStep';
import { openPreview } from '../utils/vsCodeHelpers';
import { QuickPickSourceStep } from '../wizard/quickPickSourceStep';
import { QuickPickAccountSchemaStep } from '../wizard/quickPickAccountSchemaStep';
import * as commands from "../commands/constants";

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
        const searchAttribute: SearchAttributeConfigBeta = {
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
                name,
                true
            )

            openPreview(newUri);
            vscode.commands.executeCommand(commands.REFRESH_FORCED);
        });
    }
}
