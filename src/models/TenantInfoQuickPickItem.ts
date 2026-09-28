import { QuickPickItem } from "vscode";
import { TenantInfo } from "./TenantInfo.js";

export interface TenantInfoQuickPickItem extends QuickPickItem, TenantInfo {
 
}
