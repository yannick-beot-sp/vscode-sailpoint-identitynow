import { resolve } from 'path';
import { ExtensionContext, TreeDataProvider, TreeItem } from 'vscode';
import { SourcesTreeItem, SourceTreeItem, TenantTreeItem, TransformsTreeItem } from '../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { TenantService } from '../services/TenantService';

export class IdentityNowDataProvider implements TreeDataProvider<TreeItem> {

    constructor(private readonly context: ExtensionContext,
        private readonly tenantService: TenantService) {
    }

    async getChildren(item?: TreeItem): Promise<TreeItem[]> {
        console.log("> getChildren", item);
        const results: TreeItem[] = [];
        if (item === undefined) {
            const tenants = this.tenantService.getTenants();
            for (let index = 0; index < tenants.length; index++) {
                const tenantName = tenants[index];
                results.push(new TenantTreeItem(tenantName));
            }

        } else if (item instanceof TenantTreeItem) {
            results.push(new SourcesTreeItem(item.tenantName));
            results.push(new TransformsTreeItem(item.tenantName));
        } else if (item instanceof SourcesTreeItem) {
            const client = new IdentityNowClient(item.tenantName);
            const sources = await client.getSources();
            if (sources !== undefined && sources instanceof Array) {
                for (let index = 0; index < sources.length; index++) {
                    const element = sources[index];
                    results.push(new SourceTreeItem(item.tenantName, element.name, element.id );
                }
            }
        } else if (item instanceof TransformsTreeItem)

            // return new Promise(resolve => results);
            console.log("< getChildren", results);
        return results;
    }

    getTreeItem(item: TreeItem): TreeItem {
        return item;
    }
}