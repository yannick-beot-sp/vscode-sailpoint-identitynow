import * as vscode from 'vscode';
import { FolderTreeItem, IdentityNowResourceTreeItem, IdentityProfileTreeItem, RuleTreeItem, SourceTreeItem, TenantTreeItem, TransformTreeItem } from '../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { ObjectTypeItem } from '../models/ConfigQuickPickItem';
import { delay, toDateSuffix } from '../utils';
import * as fs from 'fs';
import path = require('path');
import { TenantService } from '../services/TenantService';
import { chooseTenant, confirmFileOverwrite } from '../utils/vsCodeHelpers';
import { OBJECT_TYPE_ITEMS } from '../models/ObjectTypeQuickPickItem';


const exportTypeItems = [
    {
        "label": "Single file",
        "description": "Download a single JSON file containing all exported objects"
    },
    {
        "label": "Multiple files",
        "description": "Save objects as separate JSON file on the filesystem"
    }
];

/**
 * Entrypoint for full export configuration from the tree view. Tenant is known.
 * @param node 
 */
export async function fullExportConfigFromTreeView(node?: TenantTreeItem): Promise<void> {

    // assessing that item is a IdentityNowResourceTreeItem
    if (node === undefined || !(node instanceof TenantTreeItem)) {
        console.log("WARNING: fullExportConfigFromTreeView: invalid item", node);
        throw new Error("fullExportConfigFromTreeView: invalid item");
    }

    fullExportConfig(node.tenantId, node.tenantName);
}


/**
 * Entrypoint for full export configuration from the command palette. Tenant is unknown.
 */
export class ExportNodeConfig {
    constructor(
        private readonly tenantService: TenantService
    ) { }


    getObjectType(node: IdentityNowResourceTreeItem): string {
        switch (node.constructor.name) {
            case SourceTreeItem.name:
                return "SOURCE";
            case TransformTreeItem.name:
                return "TRANSFORM";
            case IdentityProfileTreeItem.name:
                return "IDENTITY_PROFILE";
            case RuleTreeItem.name:
                return "RULE";
            default:
                throw new Error("Invalid node type:" + node.label);

        }
    }

    getProposedFilename(tenantName: string, objectType: string, label: string): string {
        let exportFile = '';
        if (vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length > 0) {
            const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\/g, "/");
            const exportFolder = path.join(workspaceFolder, 'exportedObjects');
            const dateSuffix = toDateSuffix();
            const filename = `identitynowconfig-${tenantName}-${objectType}-${label}-${dateSuffix}.json`;
            exportFile = path.join(exportFolder, filename);
        }
        console.log("< ExportNodeConfig.getProposedFilename: " + exportFile);
        return exportFile;
    }

    async execute(node?: IdentityNowResourceTreeItem) {

        console.log("> ExportNodeConfig.execute");
        // assessing that item is a IdentityNowResourceTreeItem
        if (node === undefined || !(node instanceof IdentityNowResourceTreeItem)) {
            console.log("WARNING: ExportNodeConfig: invalid item", node);
            throw new Error("ExportNodeConfig: invalid item");
        }


        const tenantName = node.uri?.authority || "";
        console.log("ExportNodeConfig: tenantName = ", tenantName);
        const tenantInfo = await this.tenantService.getTenantByTenantName(tenantName);
        console.log("ExportNodeConfig: tenant = ", tenantInfo);
        const tenantId = tenantInfo?.id || "";

        const objectType = this.getObjectType(node);
        var label = '';
        if (typeof node.label === "string") {
            label = node.label;
        } else {
            label = node.label?.label || "";
        }

        let exportFile: string | undefined = this.getProposedFilename(tenantName, objectType, label);
        exportFile = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            value: exportFile,
            prompt: `Enter the file to save ${label} to`
        });

        if (exportFile === undefined) {
            console.log("< exportConfig: no file");
            return;
        }
        const overwrite = await confirmFileOverwrite(exportFile);
        if (!overwrite) {
            return;
        }

        const objectTypes = [objectType];
        const options: any = {};
        options[objectType] = {
            "includedIds": [
                node.id
            ]
        };
        await exportConfig(tenantId,
            tenantName,
            exportFile,
            true,
            objectTypes,
            options
        );
    }
}



/**
 * Entrypoint for full export configuration from the command palette. Tenant is unknown.
 */
export class ExportConfigPalette {
    constructor(
        private readonly tenantService: TenantService
    ) { }

    async execute() {
        console.log("> exportConfigPalette.execute");
        const tenantInfo = await chooseTenant(this.tenantService, 'From which tenant do you want to export the config?');
        console.log("exportConfigPalette: tenant = ", tenantInfo);
        if (!tenantInfo) {
            return;
        }
        fullExportConfig(tenantInfo.id, tenantInfo.tenantName);
    }
}

async function fullExportConfig(tenantId: string, tenantName: string): Promise<void> {

    const exportTypeItem = await vscode.window.showQuickPick<vscode.QuickPickItem>(exportTypeItems, {
        ignoreFocusOut: false,
        title: "How to export objects",
        canPickMany: false,

    });
    console.log("exportConfig: exportTypeItem=", exportTypeItem);
    if (exportTypeItem === undefined) {
        console.log("< exportConfig: no exportTypeItem");
        return;
    }
    const exportSingle = exportTypeItem?.label === "Single file";

    let exportFolder: string | undefined = undefined;
    let exportFile: string | undefined = undefined;

    let workspaceFolder = '';
    if (vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length > 0) {
        workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\/g, "/");
        exportFolder = path.join(workspaceFolder, 'exportedObjects');
        exportFile = path.join(workspaceFolder, 'identitynowconfig-' + tenantName + '-' + toDateSuffix() + '.json');
    }
    if (exportSingle) {
        exportFile = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            value: exportFile,
            prompt: `Enter the file to save the exported objects to`
        });

        if (exportFile === undefined) {
            console.log("< exportConfig: no file");
            return;
        }
        const overwrite = await confirmFileOverwrite(exportFile);
        if (!overwrite) {
            return;
        }
    } else {
        exportFolder = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            value: exportFolder,
            prompt: `Enter folder to save the exported objects`
        });
        if (exportFolder === undefined) {
            console.log("< exportConfig: no folder");
            return;
        }
        if (!fs.existsSync(exportFolder)) {
            fs.mkdirSync(exportFolder, { recursive: true });
        }
        else {
            const answer = await vscode.window.showQuickPick(["No", "Yes"], { placeHolder: `The folder already exists, do you want to overwrite files?` });
            if (answer === undefined || answer === "No") {
                console.log("< exportConfig: do not overwrite");
                return;
            }
        }
    }

    const sortedObjectTypeItems = OBJECT_TYPE_ITEMS.sort(((a, b) => (a.label > b.label) ? 1 : -1));

    const objectTypeItemsToExport = await vscode.window.showQuickPick<ObjectTypeItem>(sortedObjectTypeItems, {
        ignoreFocusOut: false,
        title: "Object type to export",
        canPickMany: true
    });

    if (objectTypeItemsToExport === undefined || !Array.isArray(objectTypeItemsToExport) || objectTypeItemsToExport.length < 1) {
        console.log("< exportConfig: no objectType");
        return;
    }

    const objectTypeArray = objectTypeItemsToExport.map(i => i.objectType);

    await exportConfig(tenantId,
        tenantName,
        (exportSingle ? exportFile : exportFolder) || "",
        exportSingle,
        objectTypeArray
    );

}

/**
 * 
 * @param tenantId Id of tenant
 * @param tenantName name of the tenant (for display purpose)
 * @param target either the target file path or folder for the export
 * @param exportSingle true if exported to a single file
 * @param objectTypes types of object
 * @param options options to include or exclude objects
 */
async function exportConfig(tenantId: string,
    tenantName: string,
    target: string,
    exportSingle: boolean,
    objectTypes: string[],
    options = {}) {
    const client = new IdentityNowClient(tenantId, tenantName);
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Exporting configuration from ${tenantName}...`,
        cancellable: false
    }, async (task, token) => {

        const jobId = await client.startExportJob(objectTypes, options);

        let jobStatus: any;
        do {
            await delay(1000);
            jobStatus = await client.getExportJobStatus(jobId);
            console.log({ jobStatus });
        } while (jobStatus.status === "NOT_STARTED" || jobStatus.status === "IN_PROGRESS");

        if (jobStatus.status !== "COMPLETE") {
            throw new Error("Could not export config: " + jobStatus.message);
        }

        const data = await client.getExportJobResult(jobId);
        if (exportSingle) {
            console.log('Writing to ', target);
            fs.writeFileSync(target, JSON.stringify(data, null, 2), { encoding: "utf8" });
        } else {
            for (let obj of data.objects) {
                const targetFolder = path.join(target, obj.self.type);
                const targetFilename = obj.self.name + ".json";
                const targetFilepath = path.join(targetFolder, targetFilename);
                if (!fs.existsSync(targetFolder)) {
                    fs.mkdirSync(targetFolder);
                }
                console.log('Writing to ', targetFilepath);
                fs.writeFileSync(targetFilepath as string, JSON.stringify(obj.object, null, 2), { encoding: "utf8" });
            }
        }
    });
    await vscode.window.showInformationMessage(`Successfully exported configuration from ${tenantName}`);
}