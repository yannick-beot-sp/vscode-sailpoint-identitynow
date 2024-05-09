import path = require('path');
import * as vscode from 'vscode';
import { SchemasTreeItem } from "../models/ISCTreeItem";
import { getIdByUri, getPathByUri } from '../utils/UriUtils';
import { openPreview } from '../utils/vsCodeHelpers';
import { ISCClient } from '../services/ISCClient';
import * as commands from './constants';
import { validateTenantReadonly } from './validateTenantReadonly';
import { TenantService } from '../services/TenantService';
import { Validator } from '../validator/validator';
import { WizardContext } from '../wizard/wizardContext';
import { runWizard } from '../wizard/wizard';
import { InputPromptStep } from '../wizard/inputPromptStep';

const schemaNameValidator = new Validator({
    required: true,
    regexp: '^[A-Za-z]+$'
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
        console.log({ values });
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
                    getPathByUri(item.parentUri) || "",
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

