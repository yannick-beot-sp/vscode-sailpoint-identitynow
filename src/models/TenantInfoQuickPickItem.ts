import { QuickPickItem } from "vscode";
import { TenantInfo } from "./TenantInfo";

export interface TenantInfoQuickPickItem extends QuickPickItem, TenantInfo {
 
}
