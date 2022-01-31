import path = require('path');
import { Command, TreeItem, TreeItemCollapsibleState } from 'vscode';




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

export class SourceTreeItem extends TreeItem {

    constructor(
        public readonly tenantName: string,
        label: string,
        public readonly id: string,
        public readonly ccId: Number,
    ) {
        super(label, TreeItemCollapsibleState.None);
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
        super('Transforms', TreeItemCollapsibleState.None);
    }
    contextValue = 'transforms';
    iconPath = {
        light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'folder.svg'),
        dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'folder.svg')
    };
}