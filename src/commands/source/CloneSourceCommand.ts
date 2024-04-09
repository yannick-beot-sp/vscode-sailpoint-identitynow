import * as vscode from 'vscode';
import { TenantService } from '../../services/TenantService';
import { SourceTreeItem, SourcesTreeItem } from '../../models/ISCTreeItem';
import { WizardContext } from '../../wizard/wizardContext';
import { ISCClient } from '../../services/ISCClient';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep';
import { QuickPickSourceStep } from '../../wizard/quickPickSourceStep';
import { runWizard } from '../../wizard/wizard';
import { Validator } from '../../validator/validator';
import { InputPromptStep } from '../../wizard/inputPromptStep';
import { ExportPayloadBetaIncludeTypesEnum, ObjectExportImportOptionsBeta, SpConfigExportResultsBeta } from 'sailpoint-api-client';
import { delay } from '../../utils';
import crypto = require('crypto');
import { SPConfigImporter } from '../spconfig-import/SPConfigImporter';
import * as commands from '../constants';
import { join } from 'path';

const sourceNameValidator = new Validator({
    required: true,
    maxLength: 128,
    regexp: '^[A-Za-z0-9 _:;,={}@()#-|^%$!?.*]+$'
});

/**
 * Simplified version of SPConfigExporter
 */
export class SimpleSPConfigExporter {
    constructor(
        private client: ISCClient,
        private readonly tenantDisplayName: string,
        private readonly options: {
            [key: string]: ObjectExportImportOptionsBeta;
        },
        private objectTypes: ExportPayloadBetaIncludeTypesEnum[] = []
    ) {
    }

    /**
     * Will display a progress bar for the export
     */
    public async exportConfigWithProgression(): Promise<SpConfigExportResultsBeta | null> {


        const data = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Exporting configuration from ${this.tenantDisplayName}...`,
            cancellable: false
        }, async (task, token) => {
            return await this.exportConfig(task, token);
        });
        return data;
    }

    private async exportConfig(task: any, token: vscode.CancellationToken): Promise<SpConfigExportResultsBeta | null> {

        const jobId = await this.client.startExportJob(
            this.objectTypes,
            this.options);

        let jobStatus: any;
        do {
            if (token.isCancellationRequested) {
                return null;
            }
            await delay(1000);
            jobStatus = await this.client.getExportJobStatus(jobId);
            console.log({ jobStatus });
        } while (jobStatus.status === "NOT_STARTED" || jobStatus.status === "IN_PROGRESS");

        if (jobStatus.status !== "COMPLETE") {
            throw new Error("Could not export config: " + jobStatus.message);
        }
        if (token.isCancellationRequested) {
            return null;
        }
        const data = await this.client.getExportJobResult(jobId);
        return data;
    }
}



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
            context["tenant"] = await this.tenantService.getTenant(node.tenantId);
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
                    }),
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
        console.log({ values });
        if (values === undefined) { return; }

        const oldSource = await client.getSourceById(values["source"].id)

        const options: any = {};
        options[ExportPayloadBetaIncludeTypesEnum.Source] = {
            "includedIds": [
                values["source"].id
            ]
        };
        const exporter = new SimpleSPConfigExporter(
            client,
            values["tenant"].name,
            options,
            [ExportPayloadBetaIncludeTypesEnum.Source]
        );

        const data = await exporter.exportConfigWithProgression();
        const newid = crypto.randomUUID().replaceAll("-", "")

        data.options.objectOptions[ExportPayloadBetaIncludeTypesEnum.Source].includedIds = [newid];

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
        const operation =
            [
                {
                    "op": "add",
                    "path": "/cluster",
                    "value": oldSource.cluster
                }
            ]
        client.patchResource(
            join('v3', "sources", newSource.id),
            JSON.stringify(operation)
        )

        await vscode.commands.executeCommand(commands.REFRESH_FORCED);
    }

}