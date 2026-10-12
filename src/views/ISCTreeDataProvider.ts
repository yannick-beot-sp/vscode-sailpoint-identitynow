import { EventEmitter, ExtensionContext, TreeDataProvider, TreeItem, Event, TreeItemCollapsibleState, TreeDragAndDropController, DataTransfer, DataTransferItem, CancellationToken, TreeView, commands as vscodeCommands, ProviderResult } from 'vscode';
import { BaseTreeItem, FolderTreeItem, IdentitiesTreeItem, TenantFolderTreeItem, TenantTreeItem } from '../models/ISCTreeItem.js';
import { TenantService } from '../services/TenantService.js';
import { convertToBaseTreeItem, getCachedTenantTreeItem, getOrCreateFolderTreeItem, resolveIdentitiesTreeItem } from './utils.js';
import * as commands from '../commands/constants.js';
import { delay } from '../utils.js';


const DROP_MIME_TYPE = 'application/vnd.code.tree.vscode-sailpoint-identitynow.view';



export class ISCTreeDataProvider implements TreeDataProvider<BaseTreeItem>, TreeDragAndDropController<BaseTreeItem> {

    private _onDidChangeTreeData: EventEmitter<BaseTreeItem | undefined | null | void> = new EventEmitter<BaseTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData?: Event<BaseTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    private treeView?: TreeView<BaseTreeItem>;
    /**
     * Parents of nodes that live under a tenant (sources, identities, ...).
     * Tenants and tenant folders resolve their parent from TenantService instead,
     * because those instances are reused when they move between folders.
     */
    private readonly childParents = new WeakMap<BaseTreeItem, BaseTreeItem>();

    constructor(private readonly context: ExtensionContext,
        private readonly tenantService: TenantService) {
    }

    bindTreeView(treeView: TreeView<BaseTreeItem>): void {
        this.treeView = treeView;
    }

    getParent(element: BaseTreeItem): ProviderResult<BaseTreeItem> {
        if (element instanceof TenantTreeItem || element instanceof TenantFolderTreeItem) {
            return this.getFolderParent(element.id);
        }
        return this.childParents.get(element)
            ?? (element instanceof FolderTreeItem ? element.parentNode : undefined);
    }

    private getFolderParent(nodeId: string | undefined): TenantFolderTreeItem | undefined {
        if (!nodeId) {
            return undefined;
        }
        const parentId = this.tenantService.getParentId(nodeId);
        if (!parentId) {
            return undefined;
        }
        const parent = this.tenantService.getFolder(parentId);
        return parent ? getOrCreateFolderTreeItem(parent, this.tenantService) : undefined;
    }

    async resolveIdentitiesTreeItem(tenantId: string): Promise<IdentitiesTreeItem | undefined> {
        return resolveIdentitiesTreeItem(tenantId);
    }

    async revealIdentities(identitiesNode: IdentitiesTreeItem): Promise<void> {
        if (!this.treeView) {
            return;
        }

        const canonical = await resolveIdentitiesTreeItem(identitiesNode.tenantId) ?? identitiesNode;
        canonical.filterType = identitiesNode.filterType;
        canonical.filters = identitiesNode.filters;
        canonical.collapsibleState = TreeItemCollapsibleState.Expanded;

        const tenant = getCachedTenantTreeItem(identitiesNode.tenantId);
        if (tenant) {
            tenant.collapsibleState = TreeItemCollapsibleState.Expanded;
        }

        await vscodeCommands.executeCommand(`${commands.TREE_VIEW}.focus`);

        if (tenant) {
            for (let attempt = 0; attempt < 5; attempt++) {
                try {
                    await this.treeView.reveal(tenant, { expand: true, select: false, focus: false });
                    break;
                } catch (error) {
                    if (attempt === 4) {
                        console.log("Could not reveal tenant tree node:", error);
                    } else {
                        await delay(200);
                    }
                }
            }
        }

        try {
            await canonical.getChildren();
        } catch (error) {
            console.log("Could not preload identities children:", error);
        }

        this.refresh(tenant);
        this.refresh(canonical);

        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                await this.treeView.reveal(canonical, { expand: true, select: false, focus: false });
                return;
            } catch (error) {
                if (attempt === 4) {
                    console.log("Could not reveal identities tree node:", error);
                } else {
                    await delay(250);
                }
            }
        }
    }

    async reveal(node: BaseTreeItem): Promise<void> {
        if (node instanceof IdentitiesTreeItem) {
            await this.revealIdentities(node);
            return;
        }

        if (!this.treeView) {
            return;
        }

        node.collapsibleState = TreeItemCollapsibleState.Expanded;
        await this.treeView.reveal(node, { expand: true, select: false, focus: false });
    }
    /////////////////////////////////////
    //#region Drag and drop controller
    /////////////////////////////////////
    dropMimeTypes: readonly string[] = [DROP_MIME_TYPE];
    dragMimeTypes: readonly string[] = ["text/uri-list"];

    handleDrag(source: readonly BaseTreeItem[], dataTransfer: DataTransfer, token: CancellationToken): Thenable<void> | void {
        const dragged = source
            .filter((item): item is TenantTreeItem | TenantFolderTreeItem =>
                (item instanceof TenantTreeItem || item instanceof TenantFolderTreeItem) && !!item.id)
            .map(item => ({ id: item.id as string }));
        // The tree item graph is cyclic (a tenant keeps its children, and those
        // children point back through parentNode). VS Code JSON-serializes the
        // drag payload, so only plain ids can be transferred.
        if (dragged.length > 0) {
            dataTransfer.set(DROP_MIME_TYPE, new DataTransferItem(dragged));
        }
    }

    handleDrop(target: BaseTreeItem | undefined, dataTransfer: DataTransfer, token: CancellationToken): Thenable<void> | void {
        const targetFolderId = this.resolveDropFolderId(target);
        if (targetFolderId === null) {
            return;
        }

        const transferItem = dataTransfer.get(DROP_MIME_TYPE)
        if (!transferItem) {
            return
        }

        const treeItems: Array<{ id?: string }> = transferItem.value
        for (const item of treeItems ?? []) {
            if (item?.id) {
                this.tenantService.move(item.id, targetFolderId)
            }
        }
        this.refresh()

    }

    /**
     * undefined moves the node to the root. null rejects the drop.
     * A drop on a tenant that already sits in a folder lands in that folder,
     * so an expanded folder still accepts further tenants.
     */
    private resolveDropFolderId(target: BaseTreeItem | undefined): string | undefined | null {
        if (target === undefined) {
            return undefined;
        }
        if (target instanceof TenantFolderTreeItem) {
            return target.id ?? null;
        }
        if (target instanceof TenantTreeItem) {
            return this.tenantService.getParentId(target.id ?? "") ?? null;
        }
        return null;
    }

    /////////////////////////////////////
    //#endregion Drag and drop controller
    /////////////////////////////////////

    forceRefresh(node: BaseTreeItem): void {
        console.log('> ISCDataProvider.forceRefresh');
        node?.reset();
        this.refresh(node);
    }

    refresh(node?: BaseTreeItem): void {
        console.log('> ISCDataProvider.refresh');
        if (node) {
            this._onDidChangeTreeData.fire(node);
        } else {
            this._onDidChangeTreeData.fire();
        }
    }

    async getChildren(item?: BaseTreeItem): Promise<BaseTreeItem[]> {
        console.log("> getChildren", item);
        let results: BaseTreeItem[];
        if (item === undefined) {
            const roots = this.tenantService.getRoots();
            results = roots.map(x => convertToBaseTreeItem(x, this.tenantService))
        } else if (item.collapsibleState === TreeItemCollapsibleState.None) {
            results = [];
        } else {
            results = await item.getChildren();
        }
        if (item) {
            for (const child of results) {
                if (!(child instanceof TenantTreeItem || child instanceof TenantFolderTreeItem)) {
                    this.childParents.set(child, item);
                }
            }
        }
        console.log("< getChildren", results);
        return results;
    }

    getTreeItem(item: BaseTreeItem): TreeItem {
        console.log("> getTreeItem", item);
        item.updateIcon(this.context);
        console.log("after update", item);

        if (item.contextValue !== item.computedContextValue) {
            const newItem = {
                ...item,
                contextValue: item.computedContextValue
            };
            return newItem;
        } else {

            return item;
        }
    }
}