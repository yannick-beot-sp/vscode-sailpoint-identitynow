import path = require('path');
import { Command, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { getResourceUri } from '../utils/UriUtils';




/**
 * Containers for sources
 */
export class TenantTreeItem extends TreeItem {
    public readonly tenantName: string;

    constructor(
        tenantName: string
    ) {
        super(tenantName, TreeItemCollapsibleState.Collapsed);
        this.tenantName = tenantName;
    }
    contextValue = 'tenant';
    iconPath = {
        light: path.join(__filename, '..', '..', '..', 'resources', 'sailpoint.svg'),
        dark: path.join(__filename, '..', '..', '..', 'resources', 'sailpoint.svg')
    };
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
    iconPath = {
        light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'folder.svg'),
        dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'folder.svg')
    };
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
        command: "vscode-sailpoint-identitynow.open-source",
        arguments: [this]
    };
}

export class SourceTreeItem extends IdentityNowResourceTreeItem {

    constructor(
        tenantName: string,
        label: string,
        id: string,
        public readonly ccId: Number,
    ) {
        super(tenantName, label, 'sources', id, TreeItemCollapsibleState.None);

    }

    contextValue = 'source';
    iconPath = {
        light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'source.svg'),
        dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'source.svg')
    };
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
    iconPath = {
        light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'folder.svg'),
        dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'folder.svg')
    };
}

export class TransformTreeItem extends IdentityNowResourceTreeItem {

    constructor(
        tenantName: string,
        label: string,
        id: string
    ) {
        super(tenantName, label, 'transforms', id, TreeItemCollapsibleState.None);

    }

    contextValue = 'transform';
    iconPath = {
        light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'transform.svg'),
        dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'transform.svg')
    };
}

