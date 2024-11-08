import { TenantCredentials } from "./TenantInfo";

export interface CertificationCampaignInfo {
    tenantName: string;
    workflowSendingReminderId:string
    workflowSendingReminderName:string
    credentials: TenantCredentials
}