import * as vscode from 'vscode';
import { TenantTreeItem } from '../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { ObjectTypeItem } from '../models/ConfigQuickPickItem';
import { delay, toDateSuffix } from '../utils';
import * as fs from 'fs';
import path = require('path');



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

export async function exportConfig(node?: TenantTreeItem): Promise<void> {


    // assessing that item is a IdentityNowResourceTreeItem
    if (node === undefined || !(node instanceof TenantTreeItem)) {
        console.log("WARNING: deleteResource: invalid item", node);
        throw new Error("deleteResource: invalid item");
    }

    const exportTypeItem = await vscode.window.showQuickPick<vscode.QuickPickItem>(exportTypeItems, {
        ignoreFocusOut: false,
        title: "How to export objects",
        canPickMany: false,

    });
    if (exportTypeItem === undefined) {
        console.log("< exportConfig: no exportTypeItem");
    }
    const exportSingle = exportTypeItem?.label === "Single file";

    let exportFolder: string | undefined = undefined;
    let exportFile: string | undefined = undefined;

    let workspaceFolder = '';
    if (vscode.workspace.workspaceFolders !== undefined) {
        workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\/g, "/");
        exportFolder = workspaceFolder + '/exportedObjects';
        exportFile = workspaceFolder + '/identitynowconfig-' + toDateSuffix() + '.json';
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

        if (fs.existsSync(exportFile)) {
            const answer = await vscode.window.showQuickPick(["No", "Yes"], { placeHolder: `The file already exists, do you want to overwrite it?` });
            if (answer === "No") {
                console.log("< exportConfig: do not overwrite file");
                return;
            }
            fs.unlinkSync(exportFile);
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
            if (answer === "No") {
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

    const client = new IdentityNowClient(node.tenantName);
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Exporting configuration from ${node.tenantName}...`,
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
    await vscode.window.showInformationMessage(`Successfully exported configuration from ${node.tenantName}`);
}