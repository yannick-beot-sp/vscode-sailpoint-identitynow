import { CampaignTreeItem } from "../models/ISCTreeItem";
import { PathProposer } from '../services/PathProposer';
import { askFile } from '../utils/vsCodeHelpers';
import { ISCClient } from '../services/ISCClient';
import { ExporterBuilder } from '../utils/ExporterBuilder';
import { CampaignAccessReviewData, CampaignAccessReviewPaginator } from './CampaignAccessReviewPaginator';

/**
 * Command used to open the campaign panel
 */
export class ExportCampaignReportCommand {
    constructor() {
    }

    async execute(node: CampaignTreeItem): Promise<void> {
        console.log("> ExportCampaignReportCommand.execute", node);

        const proposedPath = PathProposer.getCampaignReportFilename(
            node.tenantName,
            node.tenantDisplayName,
            node.label as string
        );
        const filePath = await askFile(
            "Enter the file to save the campaign report to",
            proposedPath
        );
        if (filePath === undefined) {
            return;
        }
        const campaignId = node.id as string;
        const client = new ISCClient(node.tenantId, node.tenantName)
        // const getCertificationsItems = await this.getCampaignAccessReviewItemData(client, campaignId)
        // this.exportToCSV(getCertificationsItems, filePath)


        const exporter = new ExporterBuilder<CampaignAccessReviewData, CampaignAccessReviewData>().setFieldMappings({
            "Campaign Name": "campaign.name",
            "Reviewer Name": "reviewer.name",
            "Reviewer Email": "reviewer.email",
            "Identity Name": "identitySummary.name",
            "Review Completed": "identitySummary.completed",
            "Review Item ID": "id",
            "Item Review Completed": "completed",
            "New Access": "newAccess",
            "Reviewer Decision": "decision",
            "Reviewer Comments": "comments",
            "Access Type": "accessSummary.access.type",
            "Role Name": "accessSummary.role.name",
            "Role Description": "accessSummary.role.description",
            "Role Privileged": "accessSummary.role.privileged",
            "Access Profile Name": "accessSummary.accessProfile.name",
            "Access Profile Description": "accessSummary.accessProfile.description",
            "Access Profile Privileged": "accessSummary.accessProfile.privileged",
            "Entitlement Name": "accessSummary.entitlement.name",
            "Entitlement Description": "accessSummary.entitlement.description",
            "Entitlement Privileged": "accessSummary.entitlement.privileged",
            "Entitlement Attribute Value": "accessSummary.entitlement.attributeValue",
            "Entitlement Source Schema Object Type": "accessSummary.entitlement.sourceSchemaObjectType",
            "Entitlement Source Name": "accessSummary.entitlement.sourceName",
            "Entitlement Account Native ID": "accessSummary.entitlement.account.nativeIdentity",
            "Entitlement Account Name": "accessSummary.entitlement.account.name"
        })

            .setPaginator(new CampaignAccessReviewPaginator(client, campaignId))
            .setOutfile(filePath)
            .setProgressMessage(`Exporting campaign report for ${node.label} from ${node.tenantDisplayName}`)
            .setSuccessfulMessage(`Successfully exported campaign  report for ${node.label} from ${node.tenantDisplayName}`)
            .build()

        await exporter.export()
    }
}