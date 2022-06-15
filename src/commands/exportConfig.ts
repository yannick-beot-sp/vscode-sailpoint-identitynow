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

export async function exportConfigView(node?: TenantTreeItem): Promise<void> {

    // assessing that item is a IdentityNowResourceTreeItem
    if (node === undefined || !(node instanceof TenantTreeItem)) {
        console.log("WARNING: exportConfig: invalid item", node);
        throw new Error("exportConfig: invalid item");
    }

    exportConfig(node.tenantName);
}

export class ExportConfigPalette {
    constructor(
        private readonly tenantService: TenantService
    ) { }

    async execute() {
        console.log("> exportConfigPalette.execute");
        const tenantName = await chooseTenant(this.tenantService, 'From which tenant do you want to export the config?');
        console.log("exportConfigPalette: tenant = ", tenantName);
        if (!tenantName) {
            return;
        }
        exportConfig(tenantName as string);
    }
}

async function exportConfig(tenantName: string): Promise<void> {

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
    if (vscode.workspace.workspaceFolders !== undefined) {
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

    const sortedObjectTypeItems = objectTypeItems.sort(((a, b) => (a.label > b.label) ? 1 : -1));

    const objectTypeItemsToExport = await vscode.window.showQuickPick<ObjectTypeItem>(sortedObjectTypeItems, {
        ignoreFocusOut: false,
        title: "Object type to export",
        canPickMany: true
    });

    if (objectTypeItemsToExport === undefined || !Array.isArray(objectTypeItemsToExport) || objectTypeItemsToExport.length < 1) {
        console.log("< exportConfig: no objectType");
        return;
    }

    const client = new IdentityNowClient(tenantName);
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Exporting configuration from ${tenantName}...`,
        cancellable: false
    }, async (task, token) => {

        const objectTypeArray = objectTypeItemsToExport.map(i => i.objectType);
        const jobId = await client.startExportJob(objectTypeArray);
        let jobStatus = await client.getExportJobStatus(jobId);
        console.log({ jobStatus });
        while (jobStatus.status === "NOT_STARTED" || jobStatus.status === "IN_PROGRESS") {
            await delay(1000);
            jobStatus = await client.getExportJobStatus(jobId);
            console.log({ jobStatus });
        }

        if (jobStatus.status !== "COMPLETE") {
            throw new Error("Could not export config: " + jobStatus.message);
        }

        const data = await client.getExportJobResult(jobId);
        if (exportSingle) {
            console.log('Writing to ', exportFile);
            fs.writeFileSync(exportFile as string, JSON.stringify(data, null, 2), { encoding: "utf8" });
        } else {
            for (let obj of data.objects) {
                const targetFolder = path.join(exportFolder as string, obj.self.type);
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