import { ExtensionContext, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { getResourceUri } from '../utils/UriUtils';
import * as commands from '../commands/constants';




/**
 * Containers for sources
 */
export class TenantTreeItem extends TreeItem {

    constructor(
        public readonly tenantName: string,
        context: ExtensionContext
    ) {
        super(tenantName, TreeItemCollapsibleState.Collapsed);
        this.iconPath = {
            light: context.asAbsolutePath('resources/sailpoint.svg'),
            dark:  context.asAbsolutePath('resources/dark/sailpoint.svg')
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
        collapsible: TreeItemCollapsibleState
    ) {
        super(label, collapsible);
        this.uri = getResourceUri(tenantName, resourceType, id, label);
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
        super(tenantName, label, 'sources', id, TreeItemCollapsibleState.None);
        this.iconPath = {
            light: context.asAbsolutePath('resources/light/source.svg'),
            dark:  context.asAbsolutePath('resources/dark/source.svg')
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
            light:  Uri.joinPath(context.extensionUri, 'resources', 'light', 'transform.svg'),
            dark:  Uri.joinPath(context.extensionUri, 'resources', 'dark', 'transform.svg')
        };
    }

    contextValue = 'transform';
}

