import { EventEmitter, ExtensionContext, TreeDataProvider, TreeItem, Event, TreeItemCollapsibleState, ThemeIcon } from 'vscode';
import { BaseTreeItem, TenantTreeItem } from '../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { TenantService } from '../services/TenantService';
import { getIdByUri, getPathByUri, getResourceUri } from '../utils/UriUtils';

export class IdentityNowDataProvider implements TreeDataProvider<BaseTreeItem> {

    private _onDidChangeTreeData: EventEmitter<BaseTreeItem | undefined | null | void> = new EventEmitter<BaseTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData?: Event<BaseTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private readonly context: ExtensionContext,
        private readonly tenantService: TenantService) {
    }

    refresh(): void {
        console.log('> IdentityNowDataProvider.refresh');
        this._onDidChangeTreeData.fire();
    }

    async getChildren(item?: BaseTreeItem): Promise<BaseTreeItem[]> {
        console.log("> getChildren", item);
        if (item === undefined) {
            const tenants = await this.tenantService.getTenants();
            const results = tenants.map(tenant => new TenantTreeItem(
                tenant.name,
                tenant.id,
                tenant.tenantName)
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
        return item;
    }
}