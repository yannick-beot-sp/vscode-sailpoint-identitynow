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
            const results: BaseTreeItem[] = [];
            const tenants = this.tenantService.getTenants().sort();
            if (tenants !== undefined && tenants instanceof Array) {
                for (let tenantName of tenants) {
                    results.push(new TenantTreeItem(tenantName, this.context));
                }
            }
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