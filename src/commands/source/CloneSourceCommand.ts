import * as vscode from 'vscode';
import { TenantService } from '../../services/TenantService';
import { SourceTreeItem } from '../../models/ISCTreeItem';
import { WizardContext } from '../../wizard/wizardContext';
import { ISCClient } from '../../services/ISCClient';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep';
import { QuickPickSourceStep } from '../../wizard/quickPickSourceStep';
import { runWizard } from '../../wizard/wizard';
import { Validator } from '../../validator/validator';
import { InputPromptStep } from '../../wizard/inputPromptStep';
import { ExportPayloadBetaIncludeTypesBeta } from 'sailpoint-api-client';
import crypto = require('crypto');
import { SPConfigImporter } from '../spconfig-import/SPConfigImporter';
import * as commands from '../constants';
import { join } from 'path';
import { SimpleSPConfigExporter } from '../spconfig-export/SimpleSPConfigExporter';

const sourceNameValidator = new Validator({
    required: true,
    maxLength: 128,
    regexp: '^[A-Za-z0-9 _:;,={}@()#-|^%$!?.*]+$'
});




export class CloneSourceCommand {

    constructor(private readonly tenantService: TenantService) { }

    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: SourceTreeItem) {

        console.log("> CloneSourceCommand.execute");
        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (node !== undefined && node instanceof SourceTreeItem) {
            context["tenant"] = this.tenantService.getTenant(node.tenantId);
            context["source"] = {
                id: node.id!,
                name: node.label!
            }
        }

        let client: ISCClient | undefined = undefined;

        const values = await runWizard({
            title: "Clone Source",
            hideStepCount: true,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new ISCClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                    },
                    "clone source"),

                new QuickPickSourceStep(() => { return client!; }),
                new InputPromptStep({
                    name: "newSourceName",
                    displayName: "new source",
                    options: {
                        validateInput: (s: string) => { return sourceNameValidator.validate(s); }
                    }
                }),
            ]
        }, context);

        if (values === undefined) { return; }

        const oldSource = await client.getSourceById(values["source"].id)

        const options: any = {};
        options[ExportPayloadBetaIncludeTypesBeta.Source] = {
            "includedIds": [
                values["source"].id
            ]
        };
        const exporter = new SimpleSPConfigExporter(
            client,
            values["tenant"].name,
            options,
            [ExportPayloadBetaIncludeTypesBeta.Source]
        );

        const data = await exporter.exportConfigWithProgression();
        const newid = crypto.randomUUID().replaceAll("-", "")

        data.options.objectOptions[ExportPayloadBetaIncludeTypesBeta.Source].includedIds = [newid];

        const newSourceName = values["newSourceName"];
        data.objects[0].self = {
            "id": newid,
            "type": "SOURCE",
            "name": newSourceName
        }
        data.objects[0].object.id = newid
        data.objects[0].object.name = newSourceName
        data.objects[0].object.connectorAttributes.cloudDisplayName = newSourceName

        const importer = new SPConfigImporter(
            values["tenant"].id,
            values["tenant"].tenantName,
            values["tenant"].name,
            {},
            JSON.stringify(data));
        await importer.importConfig()
        const newSource = await client.getSourceByName(newSourceName)

        const operations =
            [
                {
                    "op": "add",
                    "path": "/cluster",
                    "value": oldSource.cluster
                }
            ]
        //@ts-ignore
        oldSource.connectorAttributes?.encrypted?.split(",").forEach(attrName => {
            if (oldSource.connectorAttributes[attrName]) {
                operations.push({
                    "op": "add",
                    "path": `/connectorAttributes/${attrName}`,
                    "value": oldSource.connectorAttributes[attrName]
                })
            }
        })

        /**
         * Recursively traverses an object or array to find primitive values (the attributes)
         * and constructs the JSON Pointer path for each.
         * @param currentObject The object or array being processed.
         * @param currentPath The accumulated JSON Pointer path segment (e.g., "/connectorAttributes/key").
         */
        function findPassword(currentObject: any, currentPath: string): void {
            if (typeof currentObject !== 'object' || currentObject === null || currentObject === undefined) {
                return;
            }

            // Handle Arrays and Objects
            for (const key in currentObject) {
                const value = currentObject[key];
                const newPath = `${currentPath}/${key}`
                if ("password" === key) {
                    // Primitive leaf node: This is the attribute we want to patch
                    operations.push({
                        op: 'add',
                        path: newPath,
                        value: value
                    });
                } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                    // Recurse: Go deeper into nested objects or arrays
                    findPassword(value, newPath);
                } else {

                }
            }
        }

        // Start traversal from the connectorAttributes object
        // "password" property is always encrypted if present, even if not specified in "encrypted"
        findPassword(oldSource.connectorAttributes, '/connectorAttributes');

        await client.patchResource(
            join('v3', "sources", newSource.id),
            JSON.stringify(operations)
        )

        await vscode.commands.executeCommand(commands.REFRESH_FORCED);
    }

}