import { ExtensionContext, ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { getPathByUri, getResourceUri } from '../utils/UriUtils';
import * as commands from '../commands/constants';
import path = require('path');

/**
 * Containers for tenants
 */
export class TenantTreeItem extends TreeItem {

    constructor(
        public readonly tenantName: string,
        context: ExtensionContext
    ) {
        super(tenantName, TreeItemCollapsibleState.Collapsed);
        this.iconPath = {
            light: context.asAbsolutePath('resources/sailpoint.svg'),
            dark: context.asAbsolutePath('resources/dark/sailpoint.svg')
        };
    }
    contextValue = 'tenant';

}

/**
 * Containers for sources
 */
export class SourcesTreeItem extends TreeItem {

    constructor(
        public readonly tenantName: string
    ) {
        super('Sources', TreeItemCollapsibleState.Collapsed);
    }

    contextValue = 'sources';
}

export class IdentityNowResourceTreeItem extends TreeItem {
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
}

export class SourceTreeItem extends IdentityNowResourceTreeItem {
    constructor(
        tenantName: string,
        label: string,
        id: string,
        public readonly ccId: Number,
        context: ExtensionContext
    ) {
        super(tenantName, label, 'sources', id, TreeItemCollapsibleState.Collapsed);
        this.iconPath = {
            light: context.asAbsolutePath('resources/light/source.svg'),
            dark: context.asAbsolutePath('resources/dark/source.svg')
        };
    }

    contextValue = 'source';
}


/**
 * Containers for transforms
 */
export class TransformsTreeItem extends TreeItem {

    constructor(
        public readonly tenantName: string
    ) {
        super('Transforms', TreeItemCollapsibleState.Collapsed);
    }

    contextValue = 'transforms';

}

export class TransformTreeItem extends IdentityNowResourceTreeItem {

    constructor(
        tenantName: string,
        label: string,
        id: string,
        context: ExtensionContext
    ) {
        super(tenantName, label, 'transforms', id, TreeItemCollapsibleState.None);
        this.iconPath = {
            light: Uri.joinPath(context.extensionUri, 'resources', 'light', 'transform.svg'),
            dark: Uri.joinPath(context.extensionUri, 'resources', 'dark', 'transform.svg')
        };
    }

    contextValue = 'transform';
}

/**
 * Containers for schemas
 */
export class SchemasTreeItem extends TreeItem {

    constructor(
        public readonly tenantName: string,
        public readonly parentUri: Uri
    ) {
        super('Schemas', TreeItemCollapsibleState.Collapsed);
    }

    contextValue = 'schemas';
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
export class ProvisioningPoliciesTreeItem extends TreeItem {

    constructor(
        public readonly tenantName: string,
        public readonly parentUri: Uri
    ) {
        super('Provisioning Policies', TreeItemCollapsibleState.Collapsed);
    }

    contextValue = 'provisioning-policies';
}

export class ProvisioningPolicyTreeItem extends IdentityNowResourceTreeItem {

    constructor(
        tenantName: string,
        label: string,
        id: string,
        subId: string,
        context: ExtensionContext
    ) {
        // For ProvisioningPolicyTreeItem, subId is equal to CREATE, so not unique.
        super(tenantName, label, 'sources', (id + '/provisioning-policies/' + subId), TreeItemCollapsibleState.None);
        this.iconPath = {
            light: Uri.joinPath(context.extensionUri, 'resources', 'light', 'provisioning-policy.svg'),
            dark: Uri.joinPath(context.extensionUri, 'resources', 'dark', 'provisioning-policy.svg')
        };
    }

    contextValue = 'provisioning-policy';
}

/**
 * Containers for workflows
 */
export class WorkflowsTreeItem extends TreeItem {

    constructor(
        public readonly tenantName: string,
    ) {
        super('Workflows', TreeItemCollapsibleState.Collapsed);
    }

    contextValue = 'workflows';
}

export class WorkflowTreeItem extends IdentityNowResourceTreeItem {
    constructor(
        tenantName: string,
        label: string,
        id: string,
        context: ExtensionContext
    ) {
        super(tenantName, label, 'workflows', id, TreeItemCollapsibleState.None, undefined, undefined, true);
        this.iconPath = {
            light: context.asAbsolutePath('resources/light/workflow.svg'),
            dark: context.asAbsolutePath('resources/dark/workflow.svg')
        };
    }

    contextValue = 'workflow';
}
