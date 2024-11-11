export interface Totals {
    totalAccessReviews: number;
    totalAccessReviewsCompleted: number;
    totalIdentities: number;
    totalIdentitiesCompleted: number;
    totalAccessItems: number;
    totalAccessItemsCompleted: number;
}

export interface TotalAccessItems {
    entitlementDecisionsMade: number;
    entitlementsApproved: number;
    entitlementsRevoked: number;
    entitlementDecisionsTotal: number;
    accessProfileDecisionsTotal: number;
    accessProfileDecisionsMade: number;
    accessProfilesApproved: number;
    accessProfilesRevoked: number;
    roleDecisionsMade: number;
    roleDecisionsTotal: number;
    rolesApproved: number;
    rolesRevoked: number;
    accountDecisionsTotal: number;
    accountDecisionsMade: number;
    accountsApproved: number;
    accountsRevoked: number;
}

export interface Reviewer {
    id: string;
    name: string;
    phase: string;
    email: string;
}

export interface KPIs {
    totals: Totals;
    totalAccessItems: TotalAccessItems;
    reviewers: Reviewer[];
}


export interface Client {

    getKPIs(): Promise<KPIs>

}