import * as vscode from 'vscode';

import { ExportPayloadBetaIncludeTypesBeta } from 'sailpoint-api-client';
import { TransformTreeItem } from '../models/ISCTreeItem';
import { ISCClient } from '../services/ISCClient';
import { TenantService } from '../services/TenantService';
import { InputPromptStep } from '../wizard/inputPromptStep';
import { QuickPickTenantStep } from '../wizard/quickPickTenantStep';
import { runWizard } from '../wizard/wizard';
import { WizardContext } from '../wizard/wizardContext';
import { SPConfigImporter } from './spconfig-import/SPConfigImporter';
import { transformNameValidator } from './newTransformCommand';
import crypto = require('crypto');
import { SimpleSPConfigExporter } from './spconfig-export/SimpleSPConfigExporter';
import * as commands from './constants';
import { QuickPickTransformStep } from '../wizard/quickPickTransformStep';

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
                    },
                    "clone transform"),

                new QuickPickTransformStep(() => { return client!; }),
                new InputPromptStep({
                    name: "newTransformName",
                    displayName: "new transform",
                    options: {
                        validateInput: transformNameValidator
                    }
                }),
            ]
        }, context);

        if (values === undefined) { return; }

        const options: any = {};
        options[ExportPayloadBetaIncludeTypesBeta.Transform] = {
            "includedIds": [
                values["transform"].id
            ]
        };
        const exporter = new SimpleSPConfigExporter(
            client,
            values["tenant"].name,
            options,
            [ExportPayloadBetaIncludeTypesBeta.Transform]
        );

        const data = await exporter.exportConfigWithProgression();
        const newid = crypto.randomUUID().replaceAll("-", "")

        data.options.objectOptions[ExportPayloadBetaIncludeTypesBeta.Transform].includedIds = [newid];

        const newTransformName = values["newTransformName"];
        data.objects[0].self = {
            "id": newid,
            "type": ExportPayloadBetaIncludeTypesBeta.Transform,
            "name": newTransformName
        }
        data.objects[0].object.id = newid
        data.objects[0].object.name = newTransformName

        const importer = new SPConfigImporter(
            values["tenant"].id,
            values["tenant"].tenantName,
            values["tenant"].name,
            {},
            JSON.stringify(data));
        await importer.importConfig()


        await vscode.commands.executeCommand(commands.REFRESH_FORCED);
    }

}