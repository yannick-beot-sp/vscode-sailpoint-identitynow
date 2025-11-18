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

        const operations = [{
            "op": "add",
            "path": "/cluster",
            "value": oldSource.cluster
        }]

        await client.patchResource(
            join('v3', "sources", newSource.id),
            JSON.stringify(operations)
        )

        await vscode.commands.executeCommand(commands.REFRESH_FORCED);
    }

}