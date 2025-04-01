import { BaseTreeItem, TenantFolderTreeItem, TenantTreeItem } from "../models/ISCTreeItem";
import { TenantInfo } from "../models/TenantInfo";
import { FolderTreeNode, isTenantInfo } from "../models/TreeNode";
import { TenantService } from "../services/TenantService";

export function convertToBaseTreeItem(x: TenantInfo | FolderTreeNode, tenantService: TenantService): BaseTreeItem {
    if (isTenantInfo(x)) {
        return new TenantTreeItem(
            x.name,
            x.id,
            x.tenantName,
            x.name,
            tenantService)
    } else {
        return new TenantFolderTreeItem(
            x.id,
            x.name,
            tenantService
        )
    }
}