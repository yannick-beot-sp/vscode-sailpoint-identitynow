import * as vscode from 'vscode';
import { SourceTreeItem } from '../../models/ISCTreeItem';
import { PathProposer } from '../../services/PathProposer';
import { askFile } from '../../utils/vsCodeHelpers';
import { BaseCSVExporter } from '../BaseExporter';
import EntitlementPaginator from './EntitlementPaginator';
import { Entitlement } from 'sailpoint-api-client';
import { CSV_MULTIVALUE_SEPARATOR } from '../../constants';
import { IdentityIdToNameCacheService } from '../../services/cache/IdentityIdToNameCacheService';
import { GovernanceGroupIdToNameCacheService } from '../../services/cache/GovernanceGroupIdToNameCacheService';


export class EntitlementExporterCommand {


    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: SourceTreeItem) {
        console.log("> EntitlementExporter.execute");

        if (node === undefined) {
            console.error("WARNING: EntitlementExporter: invalid item", node);
            throw new Error("EntitlementExporter: invalid item");
        }

        const proposedPath = PathProposer.getEntitlementReportFilename(
            node.tenantName,
            node.tenantDisplayName,
            node.label as string
        );
        const filePath = await askFile(
            "Enter the file to save the account report to",
            proposedPath
        );
        if (filePath === undefined) {
            return;
        }

        const exporter = new EntitlementExporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            node.id as string,
            filePath
        );
        await exporter.exportFileWithProgression();
    }
}

class EntitlementExporter extends BaseCSVExporter<Entitlement> {

    constructor(
        tenantId: string,
        tenantName: string,
        tenantDisplayName: string,
        sourceId: string,
        path: string

    ) {
        super("entitlements",
            tenantId,
            tenantName,
            tenantDisplayName,
            sourceId,
            path);
    }

    protected async exportFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> BaseEntitlementExporter.exportFile");
        const headers = [
            "attributeName",
            "attributeValue",
            "displayName",
            "description",
            "schema",
            "privileged",
            "requestable",
            "owner",
            "additionalOwners",
            "additionalOwnerGovernanceGroup"
        ];
        const paths = [
            "attribute",
            "value",
            "name",
            "description",
            "sourceSchemaObjectType",
            "privileged",
            "requestable",
            "owner.name",
            "additionalOwners",
            "additionalOwnerGovernanceGroup"
        ];
        const unwindablePaths: string[] = [];

        const iterator = new EntitlementPaginator(this.client, this.sourceId);
        const identityCacheIdToName = new IdentityIdToNameCacheService(this.client);
        const governanceGroupCacheIdToName = new GovernanceGroupIdToNameCacheService(this.client);

        await this.writeData(headers, paths, unwindablePaths, iterator, task, token,
            async (item: Entitlement): Promise<any> => {
                const additionalOwners = (item as any).additionalOwners as Array<{ type?: string; id?: string; name?: string }> | undefined;

                let additionalOwnersValue: string | null = null;
                let additionalOwnerGovernanceGroup: string | null = null;

                if (additionalOwners && additionalOwners.length > 0) {
                    const governanceGroupOwner = additionalOwners.find((owner) => owner.type === "GOVERNANCE_GROUP");
                    if (governanceGroupOwner?.id) {
                        additionalOwnerGovernanceGroup = governanceGroupOwner.name
                            ?? await governanceGroupCacheIdToName.get(governanceGroupOwner.id);
                    } else {
                        const identityNames = await Promise.all(additionalOwners.map(async (owner) => {
                            if (owner.name) {
                                return owner.name;
                            }
                            if (owner.id) {
                                return identityCacheIdToName.get(owner.id);
                            }
                            return null;
                        }));
                        additionalOwnersValue = identityNames.filter((name): name is string => !!name)
                            .join(CSV_MULTIVALUE_SEPARATOR);
                    }
                }

                return {
                    attribute: (item as any).attribute,
                    value: (item as any).value,
                    name: (item as any).name,
                    description: (item as any).description,
                    sourceSchemaObjectType: (item as any).sourceSchemaObjectType,
                    privileged: (item as any).privileged,
                    requestable: (item as any).requestable,
                    owner: {
                        name: (item as any).owner?.name ?? null
                    },
                    additionalOwners: additionalOwnersValue,
                    additionalOwnerGovernanceGroup: additionalOwnerGovernanceGroup
                };
            });
    }

}




