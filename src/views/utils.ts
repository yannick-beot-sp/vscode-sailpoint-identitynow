import { BaseTreeItem, IdentitiesTreeItem, TenantFolderTreeItem, TenantTreeItem } from "../models/ISCTreeItem.js";
import { TenantInfo } from "../models/TenantInfo.js";
import { FolderTreeNode, isTenantInfo } from "../models/TreeNode.js";
import { TenantService } from "../services/TenantService.js";

const tenantTreeItems = new Map<string, TenantTreeItem>();
const folderTreeItems = new Map<string, TenantFolderTreeItem>();

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
        } else {
            item.applyDisplayName(x.name);
        }
        return item;
    } else {
        return getOrCreateFolderTreeItem(x, tenantService);
    }
}

/**
 * VS Code matches tree parents by object identity. The same folder must be
 * returned by getChildren and by getParent.
 */
export function getOrCreateFolderTreeItem(folder: FolderTreeNode, tenantService: TenantService): TenantFolderTreeItem {
    let item = folderTreeItems.get(folder.id);
    if (!item) {
        item = new TenantFolderTreeItem(
            folder.id,
            folder.name,
            tenantService);
        folderTreeItems.set(folder.id, item);
    } else {
        item.applyName(folder.name);
    }
    return item;
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
