import * as vscode from 'vscode';
import { BaseCSVExporter } from "../BaseExporter";
import { RolesTreeItem, RoleTreeItem } from '../../models/ISCTreeItem';
import { askFile } from '../../utils/vsCodeHelpers';
import { PathProposer } from '../../services/PathProposer';
import { EntitlementRef, DimensionV2025, DimensionsV2025ApiListDimensionsRequest } from 'sailpoint-api-client';
import { CSV_MULTIVALUE_SEPARATOR } from '../../constants';
import { SourceIdToNameCacheService } from '../../services/cache/SourceIdToNameCacheService';
import { GenericAsyncIterableIterator } from '../../utils/GenericAsyncIterableIterator';
import { CacheService } from '../../services/cache/CacheService';
import { EntitlementIdToSourceNameCacheService } from '../../services/cache/EntitlementIdToSourceNameCacheService';
import { roleMembershipSelectorToStringConverter } from '../../parser/roleMembershipSelectorToStringConverter';
import { UserCancelledError } from '../../errors';
import { addRoleName, DimensionWithRoleNameName, getAllDimensions } from './DimensionAsyncIterables';

export class DimensionExporterCommand {

    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node: RolesTreeItem | RoleTreeItem) {
        console.log("> DimensionExporterCommand.execute");

        const singleRole = node instanceof RoleTreeItem
        const { roleId, roleName } = singleRole ? { roleId: node.id, roleName: node.label as string } : { roleId: undefined, roleName: undefined }
        console.log({ roleId, roleName });


        const proposedPath = singleRole ? PathProposer.getDimensionReportForRoleFilename(
            node.tenantName,
            node.tenantDisplayName,
            roleName) : PathProposer.getDimensionReportFilename(
                node.tenantName,
                node.tenantDisplayName)

        const filePath = await askFile(
            "Enter the file to save the CSV for dimension export",
            proposedPath
        );

        if (filePath === undefined) {
            return;
        }

        const exporter = new DimensionExporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            filePath,
            singleRole,
            roleId,
            roleName
        );
        await exporter.exportFileWithProgression();
    }
}

/**
 * A Dimension as exported to CSV
 */
interface DimensionDto {
    /**
     * The human-readable display name of the Dimension
     * @type {string}
     * @memberof Dimension
     */
    'name': string;

    /**
     * A human-readable description of the Dimension
     * @type {string}
     * @memberof Dimension
     */
    'description'?: string;
    /**
     *
     * @type {Array<AccessProfileRef>}
     * @memberof Dimension
     */
    'accessProfiles'?: string;
    'entitlements'?: string;

    /**
     * String representation of the membership criteria
     */
    membershipCriteria?: string;

    roleName: string
}

const headers = [
    "roleName",
    "name",
    "description",
    "accessProfiles",
    "entitlements",
    "membershipCriteria",
];
const paths = [
    "roleName",
    "name",
    "description",
    "accessProfiles",
    "entitlements",
    "membershipCriteria",
];
const unwindablePaths: string[] = [];


class DimensionExporter extends BaseCSVExporter<DimensionV2025> {
    private readonly sourceIdToNameCacheService: SourceIdToNameCacheService
    private readonly entitlementIdToSourceNameCacheService: EntitlementIdToSourceNameCacheService

    constructor(
        tenantId: string,
        tenantName: string,
        tenantDisplayName: string,
        path: string,
        private readonly singleRole: boolean,
        private readonly roleId: string,
        private readonly roleName: string
    ) {
        super("Dimensions",
            tenantId,
            tenantName,
            tenantDisplayName,
            '', // Base exported forces sourceId, but we do not need to use it in here, so leaving it blank.
            path);

        this.sourceIdToNameCacheService = new SourceIdToNameCacheService(this.client)
        this.entitlementIdToSourceNameCacheService = new EntitlementIdToSourceNameCacheService(this.client)
    }

    protected async exportFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> DimensionExporter.exportFile");


        if (this.singleRole) {
            const iterator = new GenericAsyncIterableIterator<DimensionV2025, DimensionsV2025ApiListDimensionsRequest>(
                this.client,
                this.client.getPaginatedDimensions, { roleId: this.roleId });
            await this.exportData(addRoleName(iterator, this.roleName), task, token)
        } else {
            const iterator = getAllDimensions(this.client)
            await this.exportData(iterator, task, token)
        }



        console.log("Source Cache stats", this.sourceIdToNameCacheService.getStats());
        this.sourceIdToNameCacheService.flushAll();
        console.log("Entitlement Cache stats", this.entitlementIdToSourceNameCacheService.getStats());
        this.entitlementIdToSourceNameCacheService.flushAll();
    }


    private async exportData(iterator: AsyncIterable<DimensionWithRoleNameName[]>, task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> DimensionExporter.exportData");

        await this.writeData(headers, paths, unwindablePaths, iterator, task, token,
            async (item: DimensionWithRoleNameName): Promise<DimensionDto> => {
                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
                }
                let membershipCriteria: string | undefined = undefined;
                if (item.membership !== undefined && item.membership !== null && item.membership?.criteria?.children?.length > 0) {
                    try {
                        // For some reason, membership criteria are included in a AND operation
                        membershipCriteria = await roleMembershipSelectorToStringConverter(
                            item.membership.criteria.children[0], this.sourceIdToNameCacheService);


                    } catch (error) {
                        console.warn(`Error converting membership criteria for Dimension "${item.name}:"`, error);
                    }
                }

                let entitlements: string | undefined = undefined;
                try {
                    entitlements = (item.entitlements ? (await entitlementToStringConverter(item.entitlements, this.entitlementIdToSourceNameCacheService)) : null);
                } catch (error) {
                    console.warn(`Error converting entitlements for Dimension "${item.name}:"`, error);
                }

                const itemDto: DimensionDto = {
                    name: item.name,
                    // Escape carriage returns in description.
                    description: item.description?.replaceAll('\r', "\\r").replaceAll('\n', "\\n"),
                    accessProfiles: item.accessProfiles?.map(x => x.name).join(CSV_MULTIVALUE_SEPARATOR),
                    entitlements,
                    membershipCriteria,
                    roleName: item.roleName
                };

                return itemDto;
            }, false);

    }
}

async function entitlementToStringConverter(
    entitlementRefs: Array<EntitlementRef> | null | undefined,
    entitlementToString: CacheService<string>): Promise<string | undefined> {

    if (entitlementRefs === undefined
        || entitlementRefs === null
        || !Array.isArray(entitlementRefs)
        || entitlementRefs.length === 0) {
        return undefined
    }
    return (await Promise.all(entitlementRefs
        .map(ref => entitlementToString.get(ref.id))))
        .join(CSV_MULTIVALUE_SEPARATOR)
}