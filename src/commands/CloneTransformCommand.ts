import * as vscode from 'vscode';

import { ExportPayloadIncludeTypesEnum as ExportPayloadIncludeTypes } from 'sailpoint-api-client/dist/sp_config/api.js';
import { TransformTreeItem } from '../models/ISCTreeItem.js';
import { ISCClient } from '../services/ISCClient.js';
import { TenantService } from '../services/TenantService.js';
import { InputPromptStep } from '../wizard/inputPromptStep.js';
import { QuickPickTenantStep } from '../wizard/quickPickTenantStep.js';
import { runWizard } from '../wizard/wizard.js';
import { WizardContext } from '../wizard/wizardContext.js';
import { SPConfigImporter } from './spconfig-import/SPConfigImporter.js';
import { transformNameValidator } from './newTransformCommand.js';
import * as crypto from "node:crypto";
import { SimpleSPConfigExporter } from './spconfig-export/SimpleSPConfigExporter.js';
import * as commands from './constants.js';
import { QuickPickTransformStep } from '../wizard/quickPickTransformStep.js';

export class CloneTransformCommand {

    constructor(private readonly tenantService: TenantService) { }

    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: TransformTreeItem) {

        console.log("> CloneTransformCommand.execute");
        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (node !== undefined && node instanceof TransformTreeItem) {
            context["tenant"] = this.tenantService.getTenant(node.tenantId);
            context["transform"] = {
                id: node.id!,
                name: node.label!
            }
        }

        let client: ISCClient | undefined = undefined;

        const values = await runWizard({
            title: "Clone Transform",
            hideStepCount: true,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new ISCClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                    }),

                new QuickPickTransformStep(() => { return client!; }),

                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => { },
                    "clone transform",
                    "targetTenant"),

                new InputPromptStep({
                    name: "newTransformName",
                    displayName: "new transform",
                    options: {
                        validateInput: transformNameValidator,
                        default: node?.label as string | undefined
                    }
                }),
            ]
        }, context);

        if (values === undefined) { return; }

        const options: any = {};
        options[ExportPayloadIncludeTypes.Transform] = {
            "includedIds": [
                values["transform"].id
            ]
        };
        const exporter = new SimpleSPConfigExporter(
            client!,
            values["tenant"].name,
            options,
            [ExportPayloadIncludeTypes.Transform]
        );

        const data = await exporter.exportConfigWithProgression();
        const newid = crypto.randomUUID().replaceAll("-", "")

        data.options.objectOptions[ExportPayloadIncludeTypes.Transform].includedIds = [newid];

        const newTransformName = values["newTransformName"];
        data.objects[0].self = {
            "id": newid,
            "type": ExportPayloadIncludeTypes.Transform,
            "name": newTransformName
        }
        data.objects[0].object.id = newid
        data.objects[0].object.name = newTransformName

        const importer = new SPConfigImporter(
            values["targetTenant"].id,
            values["targetTenant"].tenantName,
            values["targetTenant"].name,
            {},
            JSON.stringify(data));
        await importer.importConfig()


        await vscode.commands.executeCommand(commands.REFRESH_FORCED);
    }

}