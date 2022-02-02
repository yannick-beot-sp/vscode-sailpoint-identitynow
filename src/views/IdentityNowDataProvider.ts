import { EventEmitter, ExtensionContext, TreeDataProvider, TreeItem, Event, TreeItemCollapsibleState, ThemeIcon } from 'vscode';
import { SourcesTreeItem, SourceTreeItem, TenantTreeItem, TransformsTreeItem, TransformTreeItem } from '../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { TenantService } from '../services/TenantService';

export class IdentityNowDataProvider implements TreeDataProvider<TreeItem> {

    private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | null | void> = new EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData?: Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private readonly context: ExtensionContext,
        private readonly tenantService: TenantService) {
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    async getChildren(item?: TreeItem): Promise<TreeItem[]> {
        console.log("> getChildren", item);
        const results: TreeItem[] = [];
        if (item === undefined) {
            const tenants = this.tenantService.getTenants().sort();
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
                    results.push(new SourceTreeItem(item.tenantName, element.name, element.id, element.connectorAttributes.cloudExternalId));
                }
            }
        } else if (item instanceof TransformsTreeItem) {
            const client = new IdentityNowClient(item.tenantName);
            const transforms = await client.getTransforms();
            if (transforms !== undefined && transforms instanceof Array) {
                transforms.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
                for (let index = 0; index < transforms.length; index++) {
                    const element = transforms[index];
                    results.push(new TransformTreeItem(item.tenantName, element.name, element.id));
                }
            }
        }
        console.log("< getChildren", results);
        return results;
    }

    getTreeItem(item: TreeItem): TreeItem {
        if (item.contextValue === "sources" || item.contextValue === "transforms") {
           if (item.collapsibleState === TreeItemCollapsibleState.Expanded) {
                item.iconPath =  new ThemeIcon('folder-opened');
            } else {
                item.iconPath = new ThemeIcon('folder');
            }
        }
        return item;
    }
}