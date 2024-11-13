import { IdentityCertDecisionSummary } from "sailpoint-api-client";
import { ISCClient } from "../services/ISCClient";

export class KPIsAndReviewersQuery {

constructor(private readonly client:ISCClient) {
    
}
/**
 * async execute
 */
public async execute(campaignId:string) {
    const allreviews = await this.client.getCampaignCertifications(campaignId)
    const totals = allreviews.reduce(
        (accumulator, currentValue) => {
            return {
                totalAccessReviews: accumulator.totalAccessReviews + 1,
                totalAccessReviewsCompleted: accumulator.totalAccessReviewsCompleted + (currentValue.completed ? 1 : 0),
                totalIdentities: accumulator.totalIdentities + currentValue.identitiesTotal,
                totalIdentitiesCompleted: accumulator.totalIdentitiesCompleted + currentValue.identitiesCompleted,
                totalAccessItems: accumulator.totalAccessItems + currentValue.decisionsTotal,
                totalAccessItemsCompleted: accumulator.totalAccessItemsCompleted + currentValue.decisionsMade,
            }
        },
        {
            totalAccessReviews: 0,
            totalAccessReviewsCompleted: 0,
            totalIdentities: 0,
            totalIdentitiesCompleted: 0,
            totalAccessItems: 0,
            totalAccessItemsCompleted: 0,

        },
    );

    const summaryCertificationDecisions = await Promise.all(
        allreviews.map(async (cert): Promise<IdentityCertDecisionSummary> => {
            return await this.client.getSummaryCertificationDecisions(cert.id)
        })
    )

    const totalAccessItems = summaryCertificationDecisions.reduce(
        (accumulator, currentValue) => {
            return {
                entitlementDecisionsMade: accumulator.entitlementDecisionsMade + currentValue.entitlementDecisionsMade,
                entitlementsApproved: accumulator.entitlementsApproved + currentValue.entitlementsApproved,
                entitlementsRevoked: accumulator.entitlementsRevoked + currentValue.entitlementsRevoked,
                entitlementDecisionsTotal: accumulator.entitlementDecisionsTotal + currentValue.entitlementDecisionsTotal,
                accessProfileDecisionsTotal: accumulator.accessProfileDecisionsTotal + currentValue.accessProfileDecisionsTotal,
                accessProfileDecisionsMade: accumulator.accessProfileDecisionsMade + currentValue.accessProfileDecisionsMade,
                accessProfilesApproved: accumulator.accessProfilesApproved + currentValue.accessProfilesApproved,
                accessProfilesRevoked: accumulator.accessProfilesRevoked + currentValue.accessProfilesRevoked,
                roleDecisionsMade: accumulator.roleDecisionsMade + currentValue.roleDecisionsMade,
                roleDecisionsTotal: accumulator.roleDecisionsTotal + currentValue.roleDecisionsTotal,
                rolesApproved: accumulator.rolesApproved + currentValue.rolesApproved,
                rolesRevoked: accumulator.rolesRevoked + currentValue.rolesRevoked,
                accountDecisionsTotal: accumulator.accountDecisionsTotal + currentValue.accountDecisionsTotal,
                accountDecisionsMade: accumulator.accountDecisionsMade + currentValue.accountDecisionsMade,
                accountsApproved: accumulator.accountsApproved + currentValue.accountsApproved,
                accountsRevoked: accumulator.accountsRevoked + currentValue.accountsRevoked,
            }
        },
        {
            entitlementDecisionsMade: 0,
            entitlementsApproved: 0,
            entitlementsRevoked: 0,
            entitlementDecisionsTotal: 0,
            accessProfileDecisionsTotal: 0,
            accessProfileDecisionsMade: 0,
            accessProfilesApproved: 0,
            accessProfilesRevoked: 0,
            roleDecisionsMade: 0,
            roleDecisionsTotal: 0,
            rolesApproved: 0,
            rolesRevoked: 0,
            accountDecisionsTotal: 0,
            accountDecisionsMade: 0,
            accountsApproved: 0,
            accountsRevoked: 0,
        }
    );
    return { totals, totalAccessItems }
}

}