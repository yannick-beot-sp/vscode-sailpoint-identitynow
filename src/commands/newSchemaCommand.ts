import * as path from "node:path";
import * as vscode from 'vscode';
import { SchemasTreeItem } from "../models/ISCTreeItem.js";
import { getIdByUri } from '../utils/UriUtils.js';
import { openPreview } from '../utils/vsCodeHelpers.js';
import { ISCClient } from '../services/ISCClient.js';
import * as commands from './constants.js';
import { validateTenantReadonly } from './validateTenantReadonly.js';
import { TenantService } from '../services/TenantService.js';
import { Validator } from '../validator/validator.js';
import { WizardContext } from '../wizard/wizardContext.js';
import { runWizard } from '../wizard/wizard.js';
import { InputPromptStep } from '../wizard/inputPromptStep.js';

const schemaNameValidator = new Validator({
    required: true,
    regexp: '^[A-Za-z0-9]+$'
});

/**
 * Command used to create a new provisionnig policy
 */
export class NewSchemaCommand {

    constructor(private readonly tenantService: TenantService) { }

    public async execute(item: SchemasTreeItem): Promise<void> {

        console.log("> newSchema", item);
        if (!(await validateTenantReadonly(this.tenantService, item.tenantId, `create a new schema`))) {
            return
        }
        const context: WizardContext = {};

        const values = await runWizard({
            title: "Creation of a schema",
            hideStepCount: true,
            promptSteps: [
                new InputPromptStep({
                    name: "schema",
                    options: {
                        validateInput: (s: string) => { return schemaNameValidator.validate(s); }
                    }
                }),
            ]
        }, context)
        
        if (values === undefined) { return; }
        
        const schemaName = values["schema"]
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async () => {
            const data = {
                "name": schemaName,
                "nativeObjectType": "",
                "identityAttribute": "",
                "displayAttribute": "",
                "hierarchyAttribute": null,
                "includePermissions": false,
                "features": [],
                "configuration": {},
                "attributes": []
            }

            const client = new ISCClient(item.tenantId, item.tenantName);
            const schema = await client.createSchema(
                getIdByUri(item.parentUri),
                data)

            const newUri = item.parentUri!.with({
                path: path.posix.join(
                    path.posix.dirname(item.parentUri!.path),
                    'schemas',
                    schema.id!,
                    schemaName
                )
            });

            console.log('newSchema: newUri =', newUri);
            openPreview(newUri)
            vscode.commands.executeCommand(commands.REFRESH_FORCED);
        });
    }
}

