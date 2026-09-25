import { EventEmitter, ExtensionContext, TreeDataProvider, TreeItem, Event, TreeItemCollapsibleState, TreeDragAndDropController, DataTransfer, DataTransferItem, CancellationToken, TreeView, commands as vscodeCommands, ProviderResult } from 'vscode';
import { BaseTreeItem, FolderTreeItem, IdentitiesTreeItem, TenantFolderTreeItem, TenantTreeItem } from '../models/ISCTreeItem';
import { TenantService } from '../services/TenantService';
import { convertToBaseTreeItem, getCachedTenantTreeItem, resolveIdentitiesTreeItem } from './utils';
import * as commands from '../commands/constants';
import { delay } from '../utils';


const DROP_MIME_TYPE = 'application/vnd.code.tree.vscode-sailpoint-identitynow.view';



export class ISCTreeDataProvider implements TreeDataProvider<BaseTreeItem>, TreeDragAndDropController<BaseTreeItem> {

    private _onDidChangeTreeData: EventEmitter<BaseTreeItem | undefined | null | void> = new EventEmitter<BaseTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData?: Event<BaseTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    private treeView?: TreeView<BaseTreeItem>;

    constructor(private readonly context: ExtensionContext,
        private readonly tenantService: TenantService) {
    }

    bindTreeView(treeView: TreeView<BaseTreeItem>): void {
        this.treeView = treeView;
    }

    getParent(element: BaseTreeItem): ProviderResult<BaseTreeItem> {
        if (element instanceof FolderTreeItem && element.parentNode) {
            return element.parentNode;
        }
        return undefined;
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
        source = source.filter(x => x instanceof TenantTreeItem || x instanceof TenantFolderTreeItem)
        if (source && source.length > 0) {
            dataTransfer.set(DROP_MIME_TYPE, new DataTransferItem(source));
        }
    }

    handleDrop(target: BaseTreeItem, dataTransfer: DataTransfer, token: CancellationToken): Thenable<void> | void {

        if (!(target === undefined || target instanceof TenantFolderTreeItem)) {
            return
        }

        const transferItem = dataTransfer.get(DROP_MIME_TYPE)
        if (!transferItem) {
            return
        }

        const treeItems: BaseTreeItem[] = transferItem.value
        for (const item of treeItems) {
            if (item instanceof TenantTreeItem || item instanceof TenantFolderTreeItem) {
                this.tenantService.move(item.id, target?.id)
            }
        }
        this.refresh()

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
        if (item === undefined) {
            const roots = this.tenantService.getRoots();
            const results = roots.map(x => convertToBaseTreeItem(x, this.tenantService))
            console.log("< getChildren", results);
            return results;
        } else if (item.collapsibleState === TreeItemCollapsibleState.None) {
            console.log("< getChildren []");
            return [];
        } else {
            const results = await item.getChildren();
            console.log("< getChildren", results);
            return results;
        }
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