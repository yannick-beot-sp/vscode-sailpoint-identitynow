/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { CampaignTreeItem } from "../models/ISCTreeItem";
import { PathProposer } from '../services/PathProposer';
import { askFile } from '../utils/vsCodeHelpers';
import { AccessReviewItem, ISCClient } from '../services/ISCClient';
import * as fs from 'fs'; // install required package
import { parse } from 'json2csv'; // npm install 

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
        const getCertificationsItems = await this.getCampaignAccessReviewItemData(client, campaignId)
        this.exportToCSV(getCertificationsItems, filePath)
    }

    async getCampaignAccessReviewItemData(client: ISCClient, campaignId: string) {
        try {

            // Call API to get certification IDs and reviewer names for the campaign
            const certificationsData = await client.getCampaignCertifications(campaignId);

            let allCertificationsData: any[] = [];
            for (const certification of certificationsData) {
                const certificationId = certification.id as string
                const reviewerName = certification.reviewer?.name || 'N/A'
                const reviewerEmail = certification.reviewer.email || 'N/A'
                const campaignName = certification.campaign?.name as string

                // Call API to get access review items for the certification
                const accessReviewData = await client.getCertificationReviewItems(certificationId)

                // Process access review items data
                const certificationData = this.processAccessReviewItemData(accessReviewData, reviewerName, reviewerEmail, campaignName);
                allCertificationsData = [...allCertificationsData, ...certificationData];
            }

            return allCertificationsData;
        } catch (error) {
            console.error('Error:', error);
        }
    }

    processAccessReviewItemData(data: AccessReviewItem[], reviewerName: string, reviewerEmail: string, campaignName: string): any[] {
        const csvData = data.flatMap(item => {
            const accessSummary = item.accessSummary;
            const identitySummary = item.identitySummary;
            let rows = [];

            if (accessSummary && accessSummary.access) {
                const accessType = accessSummary.access.type;

                // Base row with common properties
                const baseRow: any = {
                    "Campaign Name": campaignName,
                    "Reviewer Name": reviewerName,
                    "Reviewer Email": reviewerEmail,
                    "Identity Name": identitySummary?.name || '',
                    "Review Completed": identitySummary?.completed || '',
                    "Review Item ID": item.id || '',
                    "Item Review Completed": item.completed || '',
                    "New Access": item.newAccess || '',
                    "Reviewer Decision": item.decision || '',
                    "Reviewer Comments": item.comments || '',
                    "Access Type": accessType || '',
                    "Role Name": accessSummary?.role?.name || '',
                    "Role Description": accessSummary?.role?.description || '',
                    "Access Profile Name": accessSummary?.accessProfile?.name || '',
                    "Access Profile Description": accessSummary?.accessProfile?.description || '',
                    "Access Profile Privileged": accessSummary?.accessProfile?.privileged || '',
                    "Entitlement Name": accessSummary?.entitlement?.name || '',
                    "Entitlement Description": accessSummary?.entitlement?.description || '',
                    "Entitlement Privileged": accessSummary?.entitlement?.privileged || '',
                    "Entitlement Attribute Value": accessSummary?.entitlement?.attributeValue || '',
                    "Entitlement Source Schema Object Type": accessSummary?.entitlement?.sourceSchemaObjectType || '',
                    "Entitlement Source Name": accessSummary?.entitlement?.sourceName || '',
                    "Entitlement Account Native ID": accessSummary?.entitlement?.account?.nativeIdentity || '',
                    "Entitlement Account Name": accessSummary?.entitlement?.account?.name || ''
                };

                if (accessType === 'ROLE') {
                    const role = accessSummary.role;
                    if (role) {
                        const roleName = role.name || '';
                        const roleDescription = role.description || '';

                        // Row for ROLE type
                        const roleRow: any = { ...baseRow };
                        roleRow['Role Name'] = roleName;
                        roleRow['Role Description'] = roleDescription;
                        rows.push(roleRow);

                        // Process access profiles
                        const accessProfiles = role.accessProfiles || [];
                        accessProfiles.forEach((accessProfile: any) => {
                            const profileRow: any = { ...roleRow };
                            profileRow['Access Profile Name'] = accessProfile.name || '';
                            profileRow['Access Profile Description'] = accessProfile.description || '';
                            profileRow['Access Profile Privileged'] = accessProfile.privileged || '';

                            // Process entitlements within access profile
                            const entitlements = accessProfile.entitlements || [];
                            entitlements.forEach((entitlement: any) => {
                                const entitlementRow: any = { ...profileRow };
                                entitlementRow['Entitlement Name'] = entitlement.name || '';
                                entitlementRow['Entitlement Description'] = entitlement.description || '';
                                entitlementRow['Entitlement Privileged'] = entitlement.privileged || '';
                                entitlementRow['Entitlement Attribute Value'] = entitlement.attributeValue || '';
                                entitlementRow['Entitlement Source Schema Object Type'] = entitlement.sourceSchemaObjectType || '';
                                entitlementRow['Entitlement Source Name'] = entitlement.sourceName || '';
                                entitlementRow['Entitlement Account Native ID'] = entitlement.account?.nativeIdentity || '';
                                entitlementRow['Entitlement Account Name'] = entitlement.account?.name || ''
                                rows.push(entitlementRow);
                            });

                            rows.push(profileRow);
                        });

                        // Process role entitlements
                        const roleEntitlements = role.entitlements || [];
                        roleEntitlements.forEach((entitlement: any) => {
                            const entitlementRow: any = { ...roleRow };
                            entitlementRow['Entitlement Name'] = entitlement.name || '';
                            entitlementRow['Entitlement Description'] = entitlement.description || '';
                            entitlementRow['Entitlement Privileged'] = entitlement.privileged || '';
                            entitlementRow['Entitlement Attribute Value'] = entitlement.attributeValue || '';
                            entitlementRow['Entitlement Source Schema Object Type'] = entitlement.sourceSchemaObjectType || '';
                            entitlementRow['Entitlement Source Name'] = entitlement.sourceName || '';
                            entitlementRow['Entitlement Account Native ID'] = entitlement.account?.nativeIdentity || '';
                            entitlementRow['Entitlement Account Name'] = entitlement.account?.name || ''
                            rows.push(entitlementRow);
                        });
                    }
                } else if (accessType === 'ACCESS_PROFILE') {
                    const accessProfile = accessSummary.accessProfile;
                    if (accessProfile) {
                        // Row for ACCESS_PROFILE type
                        const profileRow: any = { ...baseRow };
                        profileRow['Access Profile Name'] = accessProfile.name || '';
                        profileRow['Access Profile Description'] = accessProfile.description || '';
                        profileRow['Access Profile Privileged'] = accessProfile.privileged || '';

                        // Process entitlements within access profile
                        const entitlements = accessProfile.entitlements || [];
                        entitlements.forEach((entitlement: any) => {
                            const entitlementRow: any = { ...profileRow };
                            entitlementRow['Entitlement Name'] = entitlement.name || '';
                            entitlementRow['Entitlement Description'] = entitlement.description || '';
                            entitlementRow['Entitlement Privileged'] = entitlement.privileged || '';
                            entitlementRow['Entitlement Attribute Value'] = entitlement.attributeValue || '';
                            entitlementRow['Entitlement Source Schema Object Type'] = entitlement.sourceSchemaObjectType || '';
                            entitlementRow['Entitlement Source Name'] = entitlement.sourceName || '';
                            entitlementRow['Entitlement Account Native ID'] = entitlement.account?.nativeIdentity || '';
                            entitlementRow['Entitlement Account Name'] = entitlement.account?.name || ''
                            rows.push(entitlementRow);
                        });

                        rows.push(profileRow);
                    }
                } else if (accessType === 'ENTITLEMENT') {
                    const entitlement = accessSummary.entitlement;
                    if (entitlement && entitlement.name) { // Check if entitlement name exists
                        // Row for ENTITLEMENT type
                        const entitlementRow: any = { ...baseRow };
                        entitlementRow['Entitlement Name'] = entitlement.name || '';
                        entitlementRow['Entitlement Description'] = entitlement.description || '';
                        entitlementRow['Entitlement Privileged'] = entitlement.privileged || '';
                        entitlementRow['Entitlement Attribute Value'] = entitlement.attributeValue || '';
                        entitlementRow['Entitlement Source Schema Object Type'] = entitlement.sourceSchemaObjectType || '';
                        entitlementRow['Entitlement Source Name'] = entitlement.sourceName || '';
                        entitlementRow['Entitlement Account Native ID'] = entitlement.account?.nativeIdentity || ''
                        entitlementRow['Entitlement Account Name'] = entitlement.account?.name || ''
                        rows.push(entitlementRow);
                    }
                }
            }

            return rows;
        }).filter(row => row['Entitlement Name']); // Filter out rows where 'Entitlement Name' is empty

        return csvData;
    }

    public exportToCSV = (data: any[], filePath: string) => {
        try {
            const csv = parse(data); // Convert JSON array to CSV format
            fs.writeFileSync(`${filePath}.csv`, csv, 'utf8'); // Write CSV to file
            console.log(`The report for '${filePath}' has been created successfully.`);
        } catch (error) {
            console.error('Error exporting data to CSV:', error);
        }
    }
}