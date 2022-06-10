import { ExtensionContext, ThemeIcon, TreeItem, TreeItemCollapsibleState, TreeItemLabel, Uri } from 'vscode';
import { getIdByUri, getPathByUri, getResourceUri } from '../utils/UriUtils';
import * as commands from '../commands/constants';
import path = require('path');
import { IdentityNowClient } from '../services/IdentityNowClient';

/**
 * Base class to expose getChildren and updateIcon methods
 */
export abstract class BaseTreeItem extends TreeItem {

    constructor(label: string | TreeItemLabel, collapsibleState?: TreeItemCollapsibleState) {
        super(label, collapsibleState);
    }

    abstract getChildren(): Promise<BaseTreeItem[]>;

    updateIcon(context: ExtensionContext) {
        // Do nothing by default
    }
}

/**
 * Containers for tenants
 */
export class TenantTreeItem extends BaseTreeItem {
    constructor(
        public readonly tenantName: string,
        context: ExtensionContext
    ) {
        super(tenantName, TreeItemCollapsibleState.Collapsed);

    }
    iconPath = new ThemeIcon('organization');
    contextValue = 'tenant';

    getChildren(): Promise<BaseTreeItem[]> {
        const results: BaseTreeItem[] = [];
        results.push(new SourcesTreeItem(this.tenantName));
        results.push(new TransformsTreeItem(this.tenantName));
        results.push(new WorkflowsTreeItem(this.tenantName));
        return new Promise(resolve => resolve(results));
    }
}


/**
 * Abstract class to implement a "folder" below the tenant node
 */
export abstract class FolderTreeItem extends BaseTreeItem {
    constructor(
        label: string,
        public readonly contextValue: string,
        public readonly parentUri?: Uri
    ) {
        super(label, TreeItemCollapsibleState.Collapsed);
    }

    updateIcon(): void {
        if (this.collapsibleState === TreeItemCollapsibleState.Expanded) {
            this.iconPath = new ThemeIcon('folder-opened');
        } else {
            this.iconPath = new ThemeIcon('folder');
        }
    }
}


/**
 * Containers for sources
 */
export class SourcesTreeItem extends FolderTreeItem {
    constructor(
        public readonly tenantName: string
    ) {
        super('Sources', 'sources');
    }

    async getChildren(): Promise<BaseTreeItem[]> {
        const results: BaseTreeItem[] = [];
        const client = new IdentityNowClient(this.tenantName);
        const sources = await client.getSources();
        if (sources !== undefined && sources instanceof Array) {
            for (let source of sources) {
                results.push(new SourceTreeItem(this.tenantName, source.name, source.id, source.connectorAttributes.cloudExternalId));
            }
        }
        return results;
    }
}

export class IdentityNowResourceTreeItem extends BaseTreeItem {

    public readonly uri: Uri;
    constructor(
        public readonly tenantName: string,
        label: string,
        resourceType: string,
        public readonly id: string,
        collapsible: TreeItemCollapsibleState,
        public readonly subResourceType: string = "",
        public readonly subId: string = "",
        public readonly beta = false,
    ) {
        // By default, a IdentityNowResourceTreeItem will be a leaf, meaning that there will not be any childs
        super(label, collapsible);
        this.uri = getResourceUri(tenantName, resourceType, id, label, beta);
        if (subResourceType && subId) {
            this.uri = this.uri.with({
                path: path.posix.join(getPathByUri(this.uri) || "", subResourceType, subId, label)
            });
            this.id = subId;
        }
    }

    command = {
        title: "open",
        command: commands.OPEN_RESOURCE,
        arguments: [this]
    };

    getChildren(): Promise<BaseTreeItem[]> {
        throw new Error('Method not implemented.');
    }
}

export class SourceTreeItem extends IdentityNowResourceTreeItem {
    constructor(
        tenantName: string,
        label: string,
        id: string,
        public readonly ccId: Number
    ) {
        super(tenantName, label, 'sources', id, TreeItemCollapsibleState.Collapsed);
    }

    contextValue = 'source';

    getChildren(): Promise<BaseTreeItem[]> {
        const results: BaseTreeItem[] = [];
        results.push(new SchemasTreeItem(this.tenantName, this.uri));
        results.push(new ProvisioningPoliciesTreeItem(this.tenantName, this.uri));
        return new Promise(resolve => resolve(results));
    }

    updateIcon(context: ExtensionContext): void {
        this.iconPath = {
            light: context.asAbsolutePath('resources/light/source.svg'),
            dark: context.asAbsolutePath('resources/dark/source.svg')
        };
    }


}


/**
 * Containers for transforms
 */
export class TransformsTreeItem extends FolderTreeItem {

    constructor(
        public readonly tenantName: string
    ) {
        super('Transforms', 'transforms');
    }

    async getChildren(): Promise<BaseTreeItem[]> {
        const results: BaseTreeItem[] = [];
        const client = new IdentityNowClient(this.tenantName);
        const transforms = await client.getTransforms();
        if (transforms !== undefined && transforms instanceof Array) {
            transforms.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
            for (let index = 0; index < transforms.length; index++) {
                const element = transforms[index];
                results.push(new TransformTreeItem(this.tenantName, element.name, element.id));
            }
        }
        return results;
    }

}

export class TransformTreeItem extends IdentityNowResourceTreeItem {

    contextValue = 'transform';

    constructor(
        tenantName: string,
        label: string,
        id: string
    ) {
        super(tenantName, label, 'transforms', id, TreeItemCollapsibleState.None);
    }

    updateIcon(context: ExtensionContext): void {
        this.iconPath = {
            light: context.asAbsolutePath('resources/light/transform.svg'),
            dark: context.asAbsolutePath('resources/dark/transform.svg')
        };
    }
}

/**
 * Containers for schemas
 */
export class SchemasTreeItem extends FolderTreeItem {
    constructor(
        public readonly tenantName: string,
        parentUri: Uri
    ) {
        super('Schemas', 'schemas', parentUri);
    }

    async getChildren(): Promise<BaseTreeItem[]> {
        let results: BaseTreeItem[] = [];

        const client = new IdentityNowClient(this.tenantName);
        const schemaPath = getPathByUri(this.parentUri) + '/schemas';
        const schemas = await client.getResource(schemaPath);
        if (schemas !== undefined && schemas instanceof Array) {
            schemas.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1)
                .map(element =>
                    new SchemaTreeItem(
                        this.tenantName,
                        element.name,
                        getIdByUri(this.parentUri) || "",
                        element.id)
                );
        }
        return results;
    }
}

export class SchemaTreeItem extends IdentityNowResourceTreeItem {

    constructor(
        tenantName: string,
        label: string,
        id: string,
        subId: string
    ) {
        super(tenantName, label, 'sources', id, TreeItemCollapsibleState.None, 'schemas', subId);
    }

    iconPath = new ThemeIcon('symbol-class');

    contextValue = 'schema';
}

/**
 * Containers for Provisioning policies
 */
export class ProvisioningPoliciesTreeItem extends FolderTreeItem {

    constructor(
        public readonly tenantName: string,
        parentUri: Uri
    ) {
        super('Provisioning Policies', 'provisioning-policies', parentUri);
    }

    async getChildren(): Promise<BaseTreeItem[]> {
        let results: BaseTreeItem[] = [];
        const client = new IdentityNowClient(this.tenantName);
        const provisioningPoliciesPath = getPathByUri(this.parentUri) + '/provisioning-policies';
        const provisioningPolicies = await client.getResource(provisioningPoliciesPath);
        if (provisioningPolicies !== undefined && provisioningPolicies instanceof Array) {
            results = provisioningPolicies
                .sort(
                    (a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1)
                .map(provisioningPolicy =>
                    new ProvisioningPolicyTreeItem(
                        this.tenantName,
                        provisioningPolicy.name,
                        getIdByUri(this.parentUri) || "",
                        provisioningPolicy.usageType)
                );
        }
        return results;
    }
}

export class ProvisioningPolicyTreeItem extends IdentityNowResourceTreeItem {

    contextValue = 'provisioning-policy';

    constructor(
        tenantName: string,
        label: string,
        id: string,
        subId: string,
    ) {
        // For ProvisioningPolicyTreeItem, subId is equal to CREATE, so not unique.
        super(tenantName, label, 'sources',
            (id + '/provisioning-policies/' + subId),
            TreeItemCollapsibleState.None);
    }


    updateIcon(context: ExtensionContext): void {
        this.iconPath = {
            light: context.asAbsolutePath('resources/light/provisioning-policy.svg'),
            dark: context.asAbsolutePath('resources/dark/provisioning-policy.svg')
        };
    }

}

/**
 * Containers for workflows
 */
export class WorkflowsTreeItem extends FolderTreeItem {

    constructor(
        public readonly tenantName: string,
    ) {
        super('Workflows', 'workflows');
    }

    async getChildren(): Promise<BaseTreeItem[]> {
        const client = new IdentityNowClient(this.tenantName);
        const workflows = await client.getWorflows();
        const workflowTreeItems = workflows.map(w =>
            new WorkflowTreeItem(this.tenantName, w.name, w.id, w.enabled));
        return workflowTreeItems;
    }
}

export class WorkflowTreeItem extends IdentityNowResourceTreeItem {
    constructor(
        tenantName: string,
        label: string,
        id: string,
        public enabled: boolean,
    ) {
        super(tenantName, label, 'workflows', id, TreeItemCollapsibleState.None, undefined, undefined, true);
        this.contextValue = enabled ? 'enabledWorkflow' : 'disabledWorkflow';
    }

    updateIcon(context: ExtensionContext): void {
        if (this.enabled) {
            this.iconPath = {
                light: context.asAbsolutePath('resources/light/workflow-enabled.svg'),
                dark: context.asAbsolutePath('resources/dark/workflow-enabled.svg')
            };
        } else {
            this.iconPath = {
                light: context.asAbsolutePath('resources/light/workflow-disabled.svg'),
                dark: context.asAbsolutePath('resources/dark/workflow-disabled.svg')
            };
        }
    }
}
