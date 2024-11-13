import type { FetchOptions, PaginatedData } from "../lib/datatable/Model";

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
    completed?: boolean;
    created?: string;
    decisionsMade?: number;
    decisionsTotal?: number;
    due?: string;
    email: string;
    errorMessage?: string;
    hasErrors?: boolean;
    id: string;
    identitiesCompleted?: number;
    identitiesRemaining?: number;
    identitiesTotal?: number;
    modified?: string;
    name: string;
    phase: string;
    signed?: string ;
}

export interface KPIs {
    totals: Totals;
    totalAccessItems: TotalAccessItems;
}

export interface Client {
    getKPIs(): Promise<KPIs>
    getReviewers(fetchOptions: FetchOptions): Promise<PaginatedData<Reviewer>>
    escalateReviewers(r: Reviewer[]): Promise<void>
    sendReminders(r: Reviewer[]): Promise<void>
}