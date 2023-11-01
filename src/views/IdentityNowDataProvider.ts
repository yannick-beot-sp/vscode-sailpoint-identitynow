import { EventEmitter, ExtensionContext, TreeDataProvider, TreeItem, Event, TreeItemCollapsibleState } from 'vscode';
import { BaseTreeItem, TenantTreeItem } from '../models/IdentityNowTreeItem';
import { TenantService } from '../services/TenantService';

export class IdentityNowDataProvider implements TreeDataProvider<BaseTreeItem> {

    private _onDidChangeTreeData: EventEmitter<BaseTreeItem | undefined | null | void> = new EventEmitter<BaseTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData?: Event<BaseTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private readonly context: ExtensionContext,
        private readonly tenantService: TenantService) {
    }

    forceRefresh(node: BaseTreeItem): void {
        console.log('> IdentityNowDataProvider.forceRefresh');
        node.reset();
        this.refresh(node);
    }

    refresh(node?: BaseTreeItem): void {
        console.log('> IdentityNowDataProvider.refresh');
        if (node) {
            this._onDidChangeTreeData.fire(node);
        } else {
            this._onDidChangeTreeData.fire();
        }
    }

    async getChildren(item?: BaseTreeItem): Promise<BaseTreeItem[]> {
        console.log("> getChildren", item);
        if (item === undefined) {
            const tenants = await this.tenantService.getTenants();
            const results = tenants.map(tenant => new TenantTreeItem(
                tenant.name,
                tenant.id,
                tenant.tenantName,
                tenant.name)
            );
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