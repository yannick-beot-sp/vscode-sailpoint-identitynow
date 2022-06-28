import { QuickPickItem } from "vscode";

export interface TenantInfoQuickPickItem extends QuickPickItem {
    id: string;
    name: string;
    tenantName: string;
}
