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
import { ExportPayloadBetaIncludeTypesBeta, SourceCluster, PasswordPolicyHoldersDtoInnerV2025 } from 'sailpoint-api-client';
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
        let targetClient: ISCClient | undefined = undefined;

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

                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        targetClient = new ISCClient(
                            wizardContext["targetTenant"].id, wizardContext["targetTenant"].tenantName);
                    },
                    "clone source",
                    "targetTenant"),

                new InputPromptStep({
                    name: "newSourceName",
                    displayName: "new source",
                    options: {
                        validateInput: sourceNameValidator,
                        default: node?.label as string | undefined
                    }
                }),
            ]
        }, context);

        if (values === undefined) { return; }

        const sameTenant = values["tenant"].id === values["targetTenant"].id;

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
            values["targetTenant"].id,
            values["targetTenant"].tenantName,
            values["targetTenant"].name,
            {},
            JSON.stringify(data));
        await importer.importConfig()
        const newSource = await targetClient!.getSourceByName(newSourceName)

        // The cluster is a tenant-specific resource: within the same tenant, the reference can be copied
        // as-is. Across tenants, a cluster with the same name must exist in the target tenant.
        let newCluster: SourceCluster | undefined = undefined;
        if (oldSource.cluster) {
            if (sameTenant) {
                newCluster = oldSource.cluster;
            } else {
                const matchingCluster = await targetClient!.getClusterByName(oldSource.cluster.name);
                if (matchingCluster) {
                    newCluster = {
                        type: oldSource.cluster.type,
                        id: matchingCluster.id,
                        name: matchingCluster.name ?? oldSource.cluster.name
                    };
                } else {
                    vscode.window.showWarningMessage(
                        `Could not find a cluster named "${oldSource.cluster.name}" in ${values["targetTenant"].name}. `
                        + `"${newSourceName}" was created without a cluster assigned.`);
                }
            }
        }

        if (newCluster) {
            const operations = [{
                "op": "add",
                "path": "/cluster",
                "value": newCluster
            }]

            await targetClient!.patchResource(
                join('v3', "sources", newSource.id!),
                JSON.stringify(operations)
            )
        }

        await this.copyPasswordPolicies(client!, targetClient!, oldSource.id!, newSource.id!, newSourceName);
        await this.copyPasswordSyncGroups(client!, targetClient!, oldSource.id!, newSource.id!, newSourceName);
        await this.copyAncillaryConfigs(client!, targetClient!, oldSource.id!, newSource.id!, newSourceName);
        await this.copyMachineAccountSubtypes(client!, targetClient!, oldSource.id!, newSource.id!, newSourceName);
        await this.copyPrivilegeCriteria(client!, targetClient!, oldSource.id!, newSource.id!, newSourceName);
        await this.offerConnectorFileUpload(oldSource, targetClient!, newSource.id!, newSourceName);

        await vscode.commands.executeCommand(commands.REFRESH_FORCED);
    }

    /**
     * Password Policies are not part of a SOURCE SP Config export: they reference the source
     * from the "holders" side, so they have to be discovered and remapped separately.
     */
    private async copyPasswordPolicies(
        client: ISCClient,
        targetClient: ISCClient,
        oldSourceId: string,
        newSourceId: string,
        newSourceName: string
    ): Promise<void> {
        try {
            const holders = await client.getPasswordPolicyHolders(oldSourceId);
            if (holders.length === 0) { return; }

            const sourcePolicies = await client.getPasswordPolicies();
            const newHolders: PasswordPolicyHoldersDtoInnerV2025[] = [];
            for (const holder of holders) {
                let targetPolicy = await targetClient.getPasswordPolicyByName(holder.policyName!);
                if (!targetPolicy) {
                    const sourcePolicy = sourcePolicies.find(p => p.id === holder.policyId);
                    if (sourcePolicy) {
                        targetPolicy = await targetClient.createPasswordPolicy({
                            ...sourcePolicy,
                            id: undefined,
                            dateCreated: undefined,
                            lastUpdated: undefined,
                            sourceIds: []
                        });
                    }
                }
                if (targetPolicy) {
                    newHolders.push({ policyId: targetPolicy.id, policyName: targetPolicy.name, selectors: holder.selectors });
                }
            }
            if (newHolders.length > 0) {
                await targetClient.updatePasswordPolicyHolders(newSourceId, newHolders);
            }
        } catch (error: any) {
            vscode.window.showWarningMessage(`Could not copy password policies to "${newSourceName}": ${error.message}`);
        }
    }

    /**
     * Password Sync Groups reference their member sources by ID (sourceIds), so they are
     * never included in a SOURCE SP Config export either.
     */
    private async copyPasswordSyncGroups(
        client: ISCClient,
        targetClient: ISCClient,
        oldSourceId: string,
        newSourceId: string,
        newSourceName: string
    ): Promise<void> {
        try {
            const oldSyncGroups = (await client.getPasswordSyncGroups())
                .filter(g => g.sourceIds?.includes(oldSourceId));
            if (oldSyncGroups.length === 0) { return; }

            const sourcePolicies = await client.getPasswordPolicies();
            for (const group of oldSyncGroups) {
                const targetGroup = await targetClient.getPasswordSyncGroupByName(group.name!);
                if (targetGroup) {
                    const sourceIds = Array.from(new Set([...(targetGroup.sourceIds ?? []), newSourceId]));
                    await targetClient.updatePasswordSyncGroup(targetGroup.id!, { ...targetGroup, sourceIds });
                    continue;
                }

                const sourcePolicy = sourcePolicies.find(p => p.id === group.passwordPolicyId);
                if (!sourcePolicy) { continue; }
                const targetPolicy = (await targetClient.getPasswordPolicyByName(sourcePolicy.name!))
                    ?? await targetClient.createPasswordPolicy({ ...sourcePolicy, id: undefined, sourceIds: [] });

                await targetClient.createPasswordSyncGroup({
                    name: group.name,
                    passwordPolicyId: targetPolicy.id,
                    sourceIds: [newSourceId]
                });
            }
        } catch (error: any) {
            vscode.window.showWarningMessage(`Could not copy password sync groups to "${newSourceName}": ${error.message}`);
        }
    }

    /**
     * Sub-resources hanging off the source ID that are not part of a SOURCE SP Config export.
     * Each is copied independently so that a tenant missing one feature (e.g. no Machine Identity
     * Security license) does not block the rest of the clone.
     */
    private async copyAncillaryConfigs(
        client: ISCClient,
        targetClient: ISCClient,
        oldSourceId: string,
        newSourceId: string,
        newSourceName: string
    ): Promise<void> {
        const copyConfig = async <T>(
            label: string,
            getOld: () => Promise<T | undefined>,
            setNew: (value: T) => Promise<unknown>
        ): Promise<void> => {
            try {
                const value = await getOld();
                if (value) {
                    await setNew(value);
                }
            } catch (error: any) {
                vscode.window.showWarningMessage(`Could not copy ${label} to "${newSourceName}": ${error.message}`);
            }
        };

        await copyConfig(
            "native change detection config",
            () => client.getNativeChangeDetectionConfig(oldSourceId),
            (config) => targetClient.updateNativeChangeDetectionConfig(newSourceId, config)
        );
        await copyConfig(
            "attribute sync config",
            () => client.getAttributeSyncConfig(oldSourceId),
            (config) => targetClient.updateAttributeSyncConfig(newSourceId, config)
        );
        await copyConfig(
            "account delete approval config",
            () => client.getAccountDeleteApprovalConfig(oldSourceId),
            (config) => targetClient.updateAccountDeleteApprovalConfig(newSourceId, config)
        );
        await copyConfig(
            "machine account delete approval config",
            () => client.getMachineAccountDeleteApprovalConfig(oldSourceId),
            (config) => targetClient.updateMachineAccountDeleteApprovalConfig(newSourceId, config)
        );
        await copyConfig(
            "machine classification config",
            () => client.getMachineClassificationConfig(oldSourceId),
            (config) => targetClient.updateMachineClassificationConfig(newSourceId, { ...config, created: undefined, modified: undefined })
        );
    }

    private async copyMachineAccountSubtypes(
        client: ISCClient,
        targetClient: ISCClient,
        oldSourceId: string,
        newSourceId: string,
        newSourceName: string
    ): Promise<void> {
        try {
            const subtypes = (await client.listMachineAccountSubtypes(oldSourceId))
                .filter(s => !s.systemManaged);
            for (const subtype of subtypes) {
                await targetClient.createSourceSubtype({
                    sourceId: newSourceId,
                    technicalName: subtype.technicalName!,
                    displayName: subtype.displayName!,
                    description: subtype.description ?? "",
                    type: subtype.type
                });
            }
        } catch (error: any) {
            vscode.window.showWarningMessage(`Could not copy machine account subtypes to "${newSourceName}": ${error.message}`);
        }
    }

    private async copyPrivilegeCriteria(
        client: ISCClient,
        targetClient: ISCClient,
        oldSourceId: string,
        newSourceId: string,
        newSourceName: string
    ): Promise<void> {
        try {
            const criteria = (await client.getPrivilegeCriteria(oldSourceId))
                .filter(c => c.type === "CUSTOM");
            for (const c of criteria) {
                await targetClient.createPrivilegeCriteria({
                    sourceId: newSourceId,
                    type: "CUSTOM",
                    operator: c.operator,
                    groups: c.groups,
                    privilegeLevel: c.privilegeLevel
                });
            }
        } catch (error: any) {
            vscode.window.showWarningMessage(`Could not copy privilege criteria to "${newSourceName}": ${error.message}`);
        }
    }

    /**
     * The API only ever exposes the *names* of previously uploaded connector files (e.g. JDBC
     * driver jars), never their content, so an automatic tenant-to-tenant copy is not possible.
     * This offers the user a chance to re-upload their local copy of the file(s) instead.
     */
    private async offerConnectorFileUpload(
        oldSource: { connectorAttributes?: any, name?: string },
        targetClient: ISCClient,
        newSourceId: string,
        newSourceName: string
    ): Promise<void> {
        const uploadHistory = oldSource.connectorAttributes?.connectorFileUploadHistory;
        const uploadedFileNames = uploadHistory ? Object.keys(uploadHistory) : [];
        if (uploadedFileNames.length === 0) { return; }

        const choice = await vscode.window.showWarningMessage(
            `"${oldSource.name}" has uploaded connector file(s) (${uploadedFileNames.join(", ")}) that cannot be copied automatically. `
            + `Do you want to select local copies to upload to "${newSourceName}" now?`,
            "Upload files...", "Skip"
        );
        if (choice !== "Upload files...") { return; }

        const files = await vscode.window.showOpenDialog({
            canSelectMany: true,
            openLabel: `Upload to ${newSourceName}`,
            title: "Select connector file(s) to upload"
        });
        if (!files) { return; }

        for (const file of files) {
            try {
                await targetClient.uploadConnectorFile(newSourceId, file.fsPath);
            } catch (error: any) {
                vscode.window.showWarningMessage(`Could not upload "${file.fsPath}" to "${newSourceName}": ${error.message}`);
            }
        }
    }

}