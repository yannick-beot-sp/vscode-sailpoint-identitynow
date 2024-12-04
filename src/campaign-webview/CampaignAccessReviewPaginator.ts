import { CampaignReference, AccessReviewItem, Reviewer } from "sailpoint-api-client";
import { ISCClient } from "../services/ISCClient";


export interface CampaignAccessReviewData extends AccessReviewItem {
    reviewer: Reviewer
    campaign: CampaignReference
    // accessProfiles?: ReviewableAccessProfile[]
    // entitlements?: ReviewableEntitlement[] 
}


export class CampaignAccessReviewPaginator implements AsyncIterable<CampaignAccessReviewData> {
    constructor(private client: ISCClient, private campaignId: string) {

    }
    async *[Symbol.asyncIterator](): AsyncIterator<CampaignAccessReviewData> {
        // Call API to get certification IDs and reviewer names for the campaign
        const certificationsData = await this.client.getCampaignCertifications(this.campaignId);
        for (const certification of certificationsData) {
            const certificationId = certification.id as string

            // Call API to get access review items for the certification
            const accessReviewData = await this.client.getCertificationReviewItems(certificationId)
            // @ts-ignore
            yield* accessReviewData.flatMap((x:AccessReviewItem) => {
                switch (x.accessSummary.access.type) {
                    case "ENTITLEMENT":
                        return x
                    case "ACCESS_PROFILE":
                        return x.accessSummary.accessProfile?.entitlements?.map(e => ({
                            ...x,
                            accessSummary: {
                                access: x.accessSummary.access,
                                accessProfile: x.accessSummary.accessProfile,
                                entitlement: e
                            }
                        }))
                    case "ROLE":
                        return x.accessSummary.role.accessProfiles?.flatMap(accessProfile => {
                            if (!accessProfile.entitlements?.length) {return [] as AccessReviewItem[]}
                            return accessProfile.entitlements.map(entitlement => ({
                                ...x,
                                accessSummary: {
                                    access: x.accessSummary.access,
                                    role: x.accessSummary.role,
                                    accessProfile,
                                    entitlement
                                }
                            }));
                        });
                    default:
                        throw new Error(`Unsupported access type:${x.accessSummary.access.type}`);
                }
            })
             // @ts-ignore
            .map(z => ({
                ...z,
                reviewer: certification.reviewer,
                campaign: certification.campaign
            }))
        }
    }
}