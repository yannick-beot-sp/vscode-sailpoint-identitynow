import * as vscode from 'vscode';
import { SourceTreeItem } from '../../models/ISCTreeItem';
import { PathProposer } from '../../services/PathProposer';
import { askFile } from '../../utils/vsCodeHelpers';
import { BaseCSVExporter } from '../BaseExporter';
import { EntitlementV2025, EntitlementsV2025ApiListEntitlementsRequest } from 'sailpoint-api-client';
import { IdentityIdToNameCacheService } from '../../services/cache/IdentityIdToNameCacheService';
import { GovernanceGroupIdToNameCacheService } from '../../services/cache/GovernanceGroupIdToNameCacheService';
import { getAdditionalOwners } from '../../utils/additionalOwners';
import { metadataToString } from '../../utils/metadataUtils';
import { GenericAsyncIterableIterator } from '../../utils/GenericAsyncIterableIterator';


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

interface EntitlementDto {
    /**
     * The entitlement attribute name
     * @type {string}
     * @memberof Entitlement
     */
    'attributeName'?: string;
    /**
     * The value of the entitlement
     * @type {string}
     * @memberof Entitlement
     */
    'attributeValue'?: string;
    /**
     * The entitlement name
     * @type {string}
     * @memberof Entitlement
     */
    'displayName'?: string;
    /**
     * The description of the entitlement
     * @type {string}
     * @memberof Entitlement
     */
    'description'?: string | null;

    /**
     * The object type of the entitlement from the source schema
     * @type {string}
     * @memberof Entitlement
     */
    'sourceSchemaObjectType'?: string;

    /**
     * True if the entitlement is privileged
     * @type {boolean}
     * @memberof Entitlement
     */
    'privileged'?: boolean;

    /**
     * True if the entitlement is able to be directly requested
     * @type {boolean}
     * @memberof Entitlement
     */
    'requestable'?: boolean;
    
    'owner': string | null;

    'additionalOwners'?: { additionalOwners: string | null; additionalOwnerGovernanceGroup: string | null }

    /**
     * A list of metadata associated with the Role. metadata are seperated by ";". 
     * The expected format is key:value1,value2;key2:value3
     */
    metadata?: string;

}

class EntitlementExporter extends BaseCSVExporter<EntitlementV2025> {

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
            "privileged",
            "schema",
            "requestable",
            "owner",
            "metadata",
            "additionalOwners",
            "additionalOwnerGovernanceGroup"
        ];
        const paths = [
            "attributeName",
            "attributeValue",
            "displayName",
            "description",
            "privileged",
            "sourceSchemaObjectType",
            "requestable",
            "owner.name",
            "metadata",
            "additionalOwners.additionalOwners",
            "additionalOwners.additionalOwnerGovernanceGroup"
        ];
        const unwindablePaths: string[] = [];

        const iterator = new GenericAsyncIterableIterator<EntitlementV2025, EntitlementsV2025ApiListEntitlementsRequest>(
            this.client,
            this.client.getEntitlements,
            { filters: `source.id eq "${this.sourceId}"` }
        );
        const identityCacheIdToName = new IdentityIdToNameCacheService(this.client);
        const governanceGroupCacheIdToName = new GovernanceGroupIdToNameCacheService(this.client);

        await this.writeData(headers, paths, unwindablePaths, iterator, task, token,
            async (item: EntitlementV2025): Promise<EntitlementDto> => {
                const additionalOwnersInfo = await getAdditionalOwners(
                    item.additionalOwners,
                    identityCacheIdToName,
                    governanceGroupCacheIdToName
                );

                let owner: string | null = null;
                try {
                    owner = item.owner ? (await identityCacheIdToName.get(item.owner.id!)) : null
                } catch (error) {
                    console.warn(`Error converting owner identity "${item.owner?.id}" for entitlement "${item.name}" (${item.id}):`, error);
                }

                return {
                    attributeName: item.attribute,
                    attributeValue: item.value,
                    displayName: item.name,
                    description: item.description,
                    sourceSchemaObjectType: item.sourceSchemaObjectType,
                    privileged: item.privileged,
                    requestable: item.requestable,
                    owner,
                    additionalOwners: additionalOwnersInfo,
                    metadata: metadataToString(item.accessModelMetadata)
                };
            });
    }

}
