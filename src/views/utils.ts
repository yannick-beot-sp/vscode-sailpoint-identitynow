import { BaseTreeItem, IdentitiesTreeItem, TenantFolderTreeItem, TenantTreeItem } from "../models/ISCTreeItem";
import { TenantInfo } from "../models/TenantInfo";
import { FolderTreeNode, isTenantInfo } from "../models/TreeNode";
import { TenantService } from "../services/TenantService";

const tenantTreeItems = new Map<string, TenantTreeItem>();

export function convertToBaseTreeItem(x: TenantInfo | FolderTreeNode, tenantService: TenantService): BaseTreeItem {
    if (isTenantInfo(x)) {
        let item = tenantTreeItems.get(x.id);
        if (!item) {
            item = new TenantTreeItem(
                x.name,
                x.id,
                x.tenantName,
                x.name,
                tenantService);
            tenantTreeItems.set(x.id, item);
        }
        return item;
    } else {
        return new TenantFolderTreeItem(
            x.id,
            x.name,
            tenantService
        )
    }
}

export function getCachedTenantTreeItem(tenantId: string): TenantTreeItem | undefined {
    return tenantTreeItems.get(tenantId);
}

export async function resolveIdentitiesTreeItem(tenantId: string): Promise<IdentitiesTreeItem | undefined> {
    const tenant = tenantTreeItems.get(tenantId);
    if (!tenant) {
        return undefined;
    }

    const children = await tenant.getChildren();
    return children.find((child): child is IdentitiesTreeItem => child instanceof IdentitiesTreeItem);
}
