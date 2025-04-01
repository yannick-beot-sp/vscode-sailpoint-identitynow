import { TenantInfo } from "./TenantInfo";

// Helper function to check if an item is a TenantInfo
export function isTenantInfo(item: FolderTreeNode | TenantInfo): item is TenantInfo {
    return item !== null && item !== undefined && item.type === "TENANT";
}

// Helper function to check if an item is a FolderTreeNode
export function isFolderTreeNode(item: FolderTreeNode | TenantInfo): item is FolderTreeNode {
    return item !== null && item !== undefined && item.type === "FOLDER";
}

export interface FolderTreeNode {
    id: string
    name: string
    type: "FOLDER"
    children?: Array<FolderTreeNode | TenantInfo>
}