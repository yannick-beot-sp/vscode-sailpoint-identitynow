import * as vscode from 'vscode';
import { TenantTreeItem } from '../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { ObjectTypeItem } from '../models/ConfigQuickPickItem';
import { delay, toDateSuffix } from '../utils';
import * as fs from 'fs';
import path = require('path');
import { TenantService } from '../services/TenantService';
import { chooseTenant, confirmFileOverwrite } from '../utils/vsCodeHelpers';

const objectTypeItems = [
    {
        "objectType": "SOURCE",
        "label": "Sources",
        picked: true
    },
    {
        "objectType": "TRIGGER_SUBSCRIPTION",
        "label": "Trigger subscriptions",
        picked: true
    },
    {
        "objectType": "IDENTITY_PROFILE",
        "label": "Identity profiles",
        picked: true
    },
    {
        "objectType": "TRANSFORM",
        "label": "Transforms",
        picked: true
    },
    {
        "objectType": "RULE",
        "label": "Rules",
        picked: true
    }
];

/**
 * Entry point to import file from the tree view. Tenant is already known but need to know the file.
 * @param node 
 */
export async function importConfigTreeView(node?: TenantTreeItem): Promise<void> {

    // assessing that item is a IdentityNowResourceTreeItem
    if (node === undefined || !(node instanceof TenantTreeItem)) {
        console.log("WARNING: importConfig: invalid item", node);
        throw new Error("importConfig: invalid item");
    }

    importConfig(node.tenantId, node.tenantName);
}

/**
 * Entry point to import file from the command palette. Tenant is unknown
 * @param node 
 */
export class ImportConfigPalette {
    constructor(
        private readonly tenantService: TenantService
    ) { }

    async execute() {
        console.log("> importConfigPalette.execute");
        const tenantInfo = await chooseTenant(this.tenantService, 'To which tenant do you want to import the config?');
        console.log("importConfigPalette: tenant = ", tenantInfo);
        if (!tenantInfo) {
            return;
        }
        importConfig(tenantInfo.id, tenantInfo.tenantName);
    }
}

async function importConfig(tenantId: string, tenantName: string): Promise<void> {


    await vscode.window.showInformationMessage(`Successfully exported configuration from ${tenantName}`);
}