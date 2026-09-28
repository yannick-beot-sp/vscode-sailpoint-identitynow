import { TenantCredentials } from "./TenantInfo.js";

export interface CertificationCampaignInfo {
    tenantName: string;
    workflowSendingReminderId:string
    workflowSendingReminderName:string
    credentials: TenantCredentials
}