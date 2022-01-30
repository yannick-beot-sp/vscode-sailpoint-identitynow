import path = require('path');
import { Command, TreeItem, TreeItemCollapsibleState } from 'vscode';




/**
 * Containers for sources
 */
export class TenantTreeItem extends TreeItem {

    constructor(
        public readonly tenantName: string
    ) {
        super(tenantName, TreeItemCollapsibleState.Collapsed);
    }
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
    iconPath = {
        light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'folder.svg'),
        dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'folder.svg')
    };
}

export class SourceTreeItem extends TreeItem {

    constructor(
        public readonly tenantName: string,
        label: string,
        public readonly id: string
    ) {
        super(label, TreeItemCollapsibleState.None);
    }
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
    iconPath = {
        light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'folder.svg'),
        dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'folder.svg')
    };
}