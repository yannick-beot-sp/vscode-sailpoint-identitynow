import { EventEmitter, ExtensionContext, TreeDataProvider, TreeItem, Event, TreeItemCollapsibleState, ThemeIcon } from 'vscode';
import { ProvisioningPoliciesTreeItem, ProvisioningPolicyTreeItem, SchemasTreeItem, SchemaTreeItem, SourcesTreeItem, SourceTreeItem, TenantTreeItem, TransformsTreeItem, TransformTreeItem, WorkflowsTreeItem, WorkflowTreeItem } from '../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { TenantService } from '../services/TenantService';
import { getIdByUri, getPathByUri, getResourceUri } from '../utils/UriUtils';

export class IdentityNowDataProvider implements TreeDataProvider<TreeItem> {

    private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | null | void> = new EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData?: Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private readonly context: ExtensionContext,
        private readonly tenantService: TenantService) {
    }

    refresh(): void {
        console.log('> IdentityNowDataProvider.refresh');
        this._onDidChangeTreeData.fire();
    }

    async getChildren(item?: TreeItem): Promise<TreeItem[]> {
        console.log("> getChildren", item);
        const results: TreeItem[] = [];
        if (item === undefined) {
            const tenants = this.tenantService.getTenants().sort();
            if (tenants !== undefined && tenants instanceof Array) {
                for (let tenantName of tenants) {
                    results.push(new TenantTreeItem(tenantName, this.context));
                }
            }
        } else if (item instanceof TenantTreeItem) {
            results.push(new SourcesTreeItem(item.tenantName));
            results.push(new TransformsTreeItem(item.tenantName));
            results.push(new WorkflowsTreeItem(item.tenantName));
        } else if (item instanceof SourcesTreeItem) {
            const client = new IdentityNowClient(item.tenantName);
            const sources = await client.getSources();
            if (sources !== undefined && sources instanceof Array) {
                for (let source of sources) {
                    results.push(new SourceTreeItem(item.tenantName, source.name, source.id, source.connectorAttributes.cloudExternalId, this.context));
                }
            }
        } else if (item instanceof TransformsTreeItem) {
            const client = new IdentityNowClient(item.tenantName);
            const transforms = await client.getTransforms();
            if (transforms !== undefined && transforms instanceof Array) {
                transforms.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
                for (let index = 0; index < transforms.length; index++) {
                    const element = transforms[index];
                    results.push(new TransformTreeItem(item.tenantName, element.name, element.id, this.context));
                }
            }
        } else if (item instanceof SourceTreeItem) {
            results.push(new SchemasTreeItem(item.tenantName, item.uri));
            results.push(new ProvisioningPoliciesTreeItem(item.tenantName, item.uri));
        } else if (item instanceof SchemasTreeItem) {
            const client = new IdentityNowClient(item.tenantName);
            const schemaPath = getPathByUri(item.parentUri) + '/schemas';
            const schemas = await client.getResource(schemaPath);
            if (schemas !== undefined && schemas instanceof Array) {
                schemas.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
                for (let index = 0; index < schemas.length; index++) {
                    const element = schemas[index];
                    results.push(
                        new SchemaTreeItem(
                            item.tenantName,
                            element.name,
                            getIdByUri(item.parentUri) || "",
                            element.id)
                    );
                }
            }
        } else if (item instanceof ProvisioningPoliciesTreeItem) {
            const client = new IdentityNowClient(item.tenantName);
            const provisioningPoliciesPath = getPathByUri(item.parentUri) + '/provisioning-policies';
            const provisioningPolicies = await client.getResource(provisioningPoliciesPath);
            if (provisioningPolicies !== undefined && provisioningPolicies instanceof Array) {
                provisioningPolicies.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
                for (let index = 0; index < provisioningPolicies.length; index++) {
                    const element = provisioningPolicies[index];
                    results.push(
                        new ProvisioningPolicyTreeItem(
                            item.tenantName,
                            element.name,
                            getIdByUri(item.parentUri) || "",
                            element.usageType,
                            this.context)
                    );
                }
            }
        } else if (item instanceof WorkflowsTreeItem) {
            const client = new IdentityNowClient(item.tenantName);
            const workflows = await client.getResource('/beta/workflows');
            // Not possible to sort endpoint side
            if (workflows !== undefined && workflows instanceof Array) {
                workflows.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
                for (let workflow of workflows) {
                    results.push(new WorkflowTreeItem(item.tenantName, workflow.name, workflow.id, this.context));
                }
            }
        }
        console.log("< getChildren", results);
        return results;
    }

    getTreeItem(item: TreeItem): TreeItem {
        if (item.contextValue === "sources"
            || item.contextValue === "transforms"
            || item.contextValue === "schemas"
            || item.contextValue === "provisioning-policies"
            || item.contextValue === "workflows") {
            // Manage folder icon for sources & transforms
            if (item.collapsibleState === TreeItemCollapsibleState.Expanded) {
                item.iconPath = new ThemeIcon('folder-opened');
            } else {
                item.iconPath = new ThemeIcon('folder');
            }
        }
        // Otherwise, already TreeItem, so simply return the item as is
        return item;
    }
}