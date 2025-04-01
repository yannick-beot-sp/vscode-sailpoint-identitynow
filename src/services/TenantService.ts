import { Memento, SecretStorage } from "vscode";
import { TenantCredentials, TenantInfo, TenantToken } from "../models/TenantInfo";
import { compareByName } from "../utils";
import { isEmpty } from '../utils/stringUtils';
import { Subject } from "./Subject";
import { Observer } from "./Observer";
import { EventEmitter } from 'events';
import { FolderTreeNode, isFolderTreeNode, isTenantInfo } from "../models/TreeNode";
const SECRET_PAT_PREFIX = "IDENTITYNOW_SECRET_PAT_";
const SECRET_AT_PREFIX = "IDENTITYNOW_SECRET_AT_";
const TENANT_PREFIX = "IDENTITYNOW_TENANT_";
const ALL_TENANTS_KEY = "IDENTITYNOW_TENANTS";
// New key for storing tenants and folders
const TREE_KEY = "IDENTITYNOW_TREE";

export enum TenantServiceEventType {
    removeTenant = "REMOVE_TENANT"
}


/**
 * Generic function to traverse a tree of FolderTreeNode and TenantInfo and find items 
 * matching a predicate
 */
function findInTree<T extends (FolderTreeNode | TenantInfo)>(
    items: Array<FolderTreeNode | TenantInfo>,
    predicate: (item: FolderTreeNode | TenantInfo) => boolean,
    findAll: boolean = false
): T[] {
    const results: T[] = [];

    // Recursive function to traverse the tree
    function traverse(item: FolderTreeNode | TenantInfo) {
        // Check if this item matches the predicate
        if (predicate(item)) {
            results.push(item as T);
            // If we only want the first match, we can stop here
            if (!findAll) {
                return true; // Signal that we found a match
            }
        }

        // If it's a folder node, traverse its children
        if (isFolderTreeNode(item) && item.children) {
            for (const child of item.children) {
                const found = traverse(child);
                if (found && !findAll) {
                    return true; // Propagate the "found" signal up the recursion
                }
            }
        }

        return false; // Signal that no match was found in this branch
    }

    // Start the traversal with each top-level item
    for (const item of items) {
        const found = traverse(item);
        if (found && !findAll) {
            break; // Stop processing more items if we found what we wanted
        }
    }

    return results;
}


export class TenantService implements Subject<TenantServiceEventType, any> {

    private readonly eventEmitter = new EventEmitter();
    constructor(private storage: Memento, private readonly secretStorage: SecretStorage,) { }


    public registerObserver(t: TenantServiceEventType, o: Observer<TenantServiceEventType, any>): void {
        this.eventEmitter.on(t, o.update)
    }
    public removeObserver(t: TenantServiceEventType, o: Observer<TenantServiceEventType, any>): void {
        this.eventEmitter.removeListener(t, o.update);
    }
    public notifyObservers(t: TenantServiceEventType, message: any): void | Promise<void> {
        this.eventEmitter.emit(t, message)
    }

    private getTenantOld(key: string): TenantInfo | undefined {
        const tenantInfo = this.storage.get<TenantInfo>(TENANT_PREFIX + key);
        // As not all tenantInfo will have name and a tenantName, changing the tenantInfo
        if (tenantInfo && !tenantInfo?.tenantName) {
            tenantInfo.tenantName = tenantInfo.name;
        }

        // As not all tenantInfo will have an id, changing the id/key in the storages
        if (tenantInfo && !tenantInfo.id) {
            tenantInfo.id = tenantInfo.tenantName;
            this.updateOrCreateNode(tenantInfo);
        }

        if (tenantInfo && tenantInfo.readOnly === undefined) {
            tenantInfo.readOnly = false
        }

        tenantInfo.type = "TENANT"

        return tenantInfo;
    }


    private migrateData(): TenantInfo[] {
        let tenants = this.storage.get<string[]>(ALL_TENANTS_KEY);
        if (tenants === undefined) {
            return [];
        }

        let tenantInfoItems = tenants.map(key => this.getTenantOld(key))

        this.storage.update(TREE_KEY, tenantInfoItems)
        return tenantInfoItems
    }

    public getRoots(): Array<TenantInfo | FolderTreeNode> {
        let roots = this.storage.get<Array<TenantInfo | FolderTreeNode>>(TREE_KEY);
        if (roots === undefined) {
            roots = this.migrateData()
        }

        roots = roots
            .filter(Boolean) // this line will remove any "undefined"
            .sort(compareByName)

        return roots
    }

    public createOrUpdateInFolder(item: TenantInfo | FolderTreeNode, parentId?: string) {
        if (parentId) {
            const parent = this.getFolder(parentId)
            if (parent === undefined) {
                return
            }
            if (parent.children) {
                parent.children.push(item)
            } else {
                parent.children = [item]
            }
            this.updateOrCreateNode(parent)
        } else {
            const roots = this.getRoots()
            roots.push(item)
            this.storage.update(TREE_KEY, roots)
        }
    }

    public getTenants(): TenantInfo[] {
        let roots = this.getRoots()
        let tenants = findInTree<TenantInfo>(
            roots,
            item => isTenantInfo(item),
            true
        );

        tenants = tenants
            .filter(Boolean) // this line will remove any "undefined"
            .sort(compareByName)
        return tenants;
    }

    public getNode(key: string): FolderTreeNode | TenantInfo | undefined {
        let roots = this.getRoots()

        const results = findInTree<FolderTreeNode>(
            roots,
            item => item.id === key,
            false // Stop at first match
        );
        const folder = results.length > 0 ? results[0] : undefined;
        return folder;
    }

    public getFolder(key: string): FolderTreeNode | undefined {
        let roots = this.getRoots()

        const results = findInTree<FolderTreeNode>(
            roots,
            item => isFolderTreeNode(item) && item.id === key,
            false // Stop at first match
        );
        const folder = results.length > 0 ? results[0] : undefined;
        return folder;
    }

    public getTenant(key: string): TenantInfo | undefined {
        let roots = this.getRoots()

        const results = findInTree<TenantInfo>(
            roots,
            item => isTenantInfo(item) && item.id === key,
            false // Stop at first match
        );
        const tenantInfo = results.length > 0 ? results[0] : undefined;

        // As not all tenantInfo will have name and a tenantName, changing the tenantInfo
        if (tenantInfo && !tenantInfo?.tenantName) {
            tenantInfo.tenantName = tenantInfo.name;
        }

        // As not all tenantInfo will have an id, changing the id/key in the storages
        if (tenantInfo && !tenantInfo.id) {
            tenantInfo.id = tenantInfo.tenantName;
            this.updateOrCreateNode(tenantInfo);
        }

        if (tenantInfo && tenantInfo.readOnly === undefined) {
            tenantInfo.readOnly = false
        }

        return tenantInfo;
    }

    public async getTenantByTenantName(tenantName: string): Promise<TenantInfo | undefined> {

        let roots = this.getRoots()

        const tenants = findInTree<TenantInfo>(
            roots,
            item => isTenantInfo(item) && item.tenantName === tenantName,
            true
        );

        if (tenants.length === 0) {
            return undefined;
        } else if (tenants.length === 1) {
            return tenants[0];
        }
        throw new Error("More than 1 tenant found for " + tenantName);
    }

    public updateOrCreateNode(value: TenantInfo | FolderTreeNode) {
        let items = this.getRoots()
        const id = value.id


        // Recursive function to process folder nodes
        function processFolder(folder: FolderTreeNode): boolean {
            if (!folder.children) return false;

            // Check children of this folder
            for (let i = 0; i < folder.children.length; i++) {
                const child = folder.children[i];

                // Check if this child is the tenant we want to update
                if (child.id === id) {
                    // Update the tenant
                    folder.children[i] = value;
                    return true;
                }

                // If this child is a folder, recursively process it
                if (isFolderTreeNode(child)) {
                    const found = processFolder(child);
                    if (found) return true;
                }
            }

            return false;
        }

        let found = false

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Check if this is the tenant we want to update
            if (item.id === id) {
                // Update the tenant
                items[i] = value;
                found = true
                break
            }

            // If it's a folder, process its children
            if (isFolderTreeNode(item)) {
                found = processFolder(item);
                if (found) break;
            }
        }

        if (!found) {
            // Not updated. Creating a new one
            items.push(value)
        }

        this.storage.update(TREE_KEY, items);
    }

    public async removeNode(id: string, removeCredentials = true) {
        let roots = this.getRoots()


        // Recursive function to process folder nodes
        function processFolder(folder: FolderTreeNode): boolean {
            // Check if any direct children are the tenant to remove
            const childIndex = folder.children.findIndex(child => child.id === id);

            if (childIndex !== -1) {
                // Found the tenant in this folder's children, remove it
                folder.children.splice(childIndex, 1);
                return true;
            }
            if (!folder.children) return false;
            // Recursively process child folders
            for (let i = 0; i < folder.children.length; i++) {
                const child = folder.children[i];
                if (isFolderTreeNode(child)) {
                    const removed = processFolder(child);
                    if (removed) return true;
                }
            }

            return false;
        }

        const topLevelIndex = roots.findIndex(item => item.id === id);

        if (topLevelIndex !== -1) {
            // The tenant is at the top level, remove it
            roots.splice(topLevelIndex, 1);

        } else {
            // Process all top-level folders
            for (const item of roots) {
                if (isFolderTreeNode(item)) {
                    const removed = processFolder(item);
                    if (removed) break;
                }
            }
        }
        this.storage.update(TREE_KEY, roots);

        if (removeCredentials) {
            await this.removeTenantCredentials(id);
            await this.removeTenantAccessToken(id);
        }
    }

    public getChildren(id:string) {
        const node = this.getNode(id)
        if (isFolderTreeNode(node)) {
            return node.children
        }
        return undefined
    }

    public move(nodeIdToMove: string, targetFolderId?: string) {
        const items = this.getRoots()
        let nodeToMove: FolderTreeNode | TenantInfo | undefined;
        let nodeRemoved = false;

        // Step 1: Find and remove the node

        // Check if the node is at the top level
        const topLevelIndex = items.findIndex(item => item.id === nodeIdToMove);

        if (topLevelIndex !== -1) {
            // The node is at the top level, remove it
            nodeToMove = items[topLevelIndex];
            items.splice(topLevelIndex, 1);
            nodeRemoved = true;
        }

        // If not found at top level, search recursively
        function findAndRemoveNode(folder: FolderTreeNode): boolean {
            if (!folder.children) return false;

            // Check if any direct children are the node to move
            const childIndex = folder.children.findIndex(child => child.id === nodeIdToMove);

            if (childIndex !== -1) {
                // Found the node in this folder's children, remove it
                nodeToMove = folder.children[childIndex];
                folder.children.splice(childIndex, 1);
                return true;
            }

            // Recursively process child folders
            for (let i = 0; i < folder.children.length; i++) {
                const child = folder.children[i];
                if (isFolderTreeNode(child)) {
                    const removed = findAndRemoveNode(child);
                    if (removed) return true;
                }
            }

            return false;
        }

        // Only search for the node if we haven't found it yet
        if (!nodeRemoved) {
            for (const item of items) {
                if (isFolderTreeNode(item)) {
                    nodeRemoved = findAndRemoveNode(item);
                    if (nodeRemoved) break;
                }
            }
        }

        // If we didn't find the node, exit
        if (!nodeToMove) {
            return;
        }

        // Step 2: Add the node to the target location

        // If no target folder is specified, add to root level
        if (!targetFolderId) {
            items.push(nodeToMove);
            this.storage.update(TREE_KEY, items);
            return;
        }

        // Find the target folder and add the node to its children
        function addNodeToFolder(folder: FolderTreeNode): boolean {
            if (folder.id === targetFolderId) {
                // This is our target folder
                if (!folder.children) {
                    folder.children = [];
                }
                folder.children.push(nodeToMove!);
                return true;
            }

            // Not the target folder, check its children
            if (folder.children) {
                for (const child of folder.children) {
                    if (isFolderTreeNode(child)) {
                        const added = addNodeToFolder(child);
                        if (added) return true;
                    }
                }
            }

            return false;
        }

        // Try to find the target folder
        let folderFound = false;
        for (const item of items) {
            if (isFolderTreeNode(item)) {
                folderFound = addNodeToFolder(item);
                if (folderFound) break;
            }
        }

        // If target folder wasn't found, add to root level
        if (!folderFound) {
            items.push(nodeToMove);
        }
        this.storage.update(TREE_KEY, items);
    }

    public async removeFolderRecursively(id: string) {
        const folder = this.getFolder(id)

        // Recursive function to process folder nodes
        async function processFolder(folder: FolderTreeNode): Promise<void> {
            if (!folder.children) return;

            // Recursively process child folders
            for (let i = 0; i < folder.children.length; i++) {
                const child = folder.children[i];
                if (isFolderTreeNode(child)) {
                    processFolder(child);
                } else if (isTenantInfo(child)) {
                    // remove credentials if any
                    await this.removeTenantCredentials(child.id);
                    await this.removeTenantAccessToken(child.id);
                }
            }
        }
        await processFolder(folder)
        this.removeNode(folder.id, false)

    }


    public async getTenantCredentials(tenantId: string): Promise<TenantCredentials | undefined> {

        const credentialsStr = await this.secretStorage.get(this.getPatKey(tenantId));
        if (credentialsStr === undefined) {
            return undefined;
        }
        const credentials = JSON.parse(credentialsStr) as TenantCredentials;
        return credentials;
    }

    public async setTenantCredentials(tenantId: string, credentials: TenantCredentials) {
        // Don't set `currentToken` here, since we want to fire the proper events in the `checkForUpdates` call
        await this.secretStorage.store(this.getPatKey(tenantId), JSON.stringify(credentials));
    }

    public async removeTenantCredentials(tenantId: string) {
        console.log("> removeTenantCredentials for " + tenantId);
        const key = this.getPatKey(tenantId);
        await this.removeSecretKeyIfExists(key);
    }

    public async getTenantAccessToken(tenantId: string): Promise<TenantToken | undefined> {
        const tokenStr = await this.secretStorage.get(this.getAccessTokenKey(tenantId)) || "";
        let token: TenantToken | undefined = undefined;
        if (!isEmpty(tokenStr)) {
            try {
                const tokenJson: any = JSON.parse(tokenStr);
                token = new TenantToken(
                    tokenJson.accessToken,
                    tokenJson.expires,
                    {
                        clientId: tokenJson.client.clientId,
                        clientSecret: tokenJson.client.clientSecret
                    });
            } catch (err) {
                console.log("WARNING: could not parse Token: ", err);
            }
        } else {
            console.log("WARNING: no token for tenant", tenantId);
        }
        return token;
    }

    public async setTenantAccessToken(tenantId: string, token: TenantToken) {
        await this.secretStorage.store(
            this.getAccessTokenKey(tenantId),
            JSON.stringify(token));
    }

    public async removeTenantAccessToken(tenantId: string) {
        const key = this.getAccessTokenKey(tenantId);
        await this.removeSecretKeyIfExists(key);
    }


    /**
     * Returns the key for the ClientID/ClientSecret (PAT) in the secret storage
     * @param tenantId 
     * @returns The key
     */
    private getPatKey(tenantId: string): string {
        return SECRET_PAT_PREFIX
            + tenantId;
    }

    /**
     * Returns the key for the access token in the secret storage
     * @param tenantId 
     * @returns 
     */
    private getAccessTokenKey(tenantId: string): string {
        return SECRET_AT_PREFIX
            + tenantId;
    }

    /**
     * Check the existence before removing the key
     * @param key 
     */
    private async removeSecretKeyIfExists(key: string) {
        const secret = await this.secretStorage.get(key);
        if (secret !== undefined) {
            await this.secretStorage.delete(key);
        }
    }
}

