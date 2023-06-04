import * as vscode from 'vscode';
import { IdentityNowResourceTreeItem, IdentityProfileTreeItem, RuleTreeItem, SourceTreeItem, TenantTreeItem, TransformTreeItem } from '../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { ObjectTypeItem } from '../models/ConfigQuickPickItem';
import { delay, toDateSuffix } from '../utils';
import * as fs from 'fs';
import * as os from 'os';
import path = require('path');
import { TenantService } from '../services/TenantService';
import { askFile, askFolder, chooseTenant } from '../utils/vsCodeHelpers';
import { OBJECT_TYPE_ITEMS } from '../models/ObjectTypeQuickPickItem';
import { ObjectPickItem } from '../models/ObjectPickItem';
import { ensureFolderExists } from '../utils/fileutils';

const SINGLE_EXPORT_TYPE = {
    "label": "Single file",
    "description": "Download a single JSON file containing all exported objects"
};
const MULTIPLE_EXPORT_TYPE =
{
    "label": "Multiple files",
    "description": "Save objects as separate JSON file on the filesystem"
};

const EXPORT_TYPES = [SINGLE_EXPORT_TYPE, MULTIPLE_EXPORT_TYPE];

/**
 * Base class for all exporter
 */
abstract class BaseExporter {
    tenantName: string | undefined;
    tenantId: string | undefined;
    objectTypes: string[] = [];
    options: any;
    exportSingle = false;
    target: string | null | undefined;
    client!: IdentityNowClient;

    constructor() { }

    protected init(): void {
        this.options = {};
        this.objectTypes = [];
        this.target = null;
    }

    /**
     * Will display a progress bar for the export
     */
    public async exportConfigWithProgression(): Promise<void> {
        if (!this.tenantId || !this.tenantName) {
            throw new Error("Invalid tenant info");
        }
        this.client = new IdentityNowClient(this.tenantId, this.tenantName);
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Exporting configuration from ${this.tenantName}...`,
            cancellable: false
        }, async (task, token) => await this.exportConfig(task, token))
            .then(async () =>
                await vscode.window.showInformationMessage(
                    `Successfully exported configuration from ${this.tenantName}`
                ));
    }

    private async exportConfig(task: any, token: vscode.CancellationToken): Promise<void> {

        if (!this.target) {
            return;
        }

        const jobId = await this.client.startExportJob(
            this.objectTypes,
            this.options);

        let jobStatus: any;
        do {
            await delay(1000);
            jobStatus = await this.client.getExportJobStatus(jobId);
            console.log({ jobStatus });
        } while (jobStatus.status === "NOT_STARTED" || jobStatus.status === "IN_PROGRESS");

        if (jobStatus.status !== "COMPLETE") {
            throw new Error("Could not export config: " + jobStatus.message);
        }

        const data = await this.client.getExportJobResult(jobId);
        if (this.exportSingle) {
            console.log('Writing to ', this.target);
            ensureFolderExists(this.target);
            fs.writeFileSync(this.target, JSON.stringify(data, null, 2), { encoding: "utf8" });
        } else {
            for (let obj of data.objects) {
                const targetFolder = path.join(this.target, obj.self.type);
                const targetFilename = obj.self.name + ".json";
                const targetFilepath = path.join(targetFolder, targetFilename);
                ensureFolderExists(targetFilepath);
                console.log('Writing to ', targetFilepath);
                fs.writeFileSync(targetFilepath, JSON.stringify(obj.object, null, 2), { encoding: "utf8" });
            }
        }
    }



    protected getProposedFolder(objectType: string | undefined = undefined): string {
        let proposedFolder = '';
        if (vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length > 0) {
            proposedFolder = vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\/g, "/");
        } else {
            proposedFolder = os.homedir();
        }

        proposedFolder = path.join(proposedFolder, 'exportedObjects');
        if (objectType) {
            proposedFolder = path.join(proposedFolder, objectType);
        }
        console.log("< getProposedFolder: " + proposedFolder);
        return proposedFolder;
    }

    protected getProposedFilename(tenantName?: string, label?: string): string {
        const dateSuffix = toDateSuffix();
        const filename = ["identitynowconfig", tenantName, label, dateSuffix]
            .filter(Boolean)
            .join("-") + ".json";
        console.log("< getProposedFilename: " + filename);
        return filename;
    }
}

const ALL: vscode.QuickPickItem = {
    label: "Export everything",
    picked: true
};

const PICK_AND_CHOOSE: vscode.QuickPickItem = {
    label: "Choose what to export"
};

/**
 * Base Class used by exporter with full wizard 
 */
abstract class WizardBaseExporter extends BaseExporter {

    /**
     * Asks the user if he/she wants to import everything or not
     * @returns ALL or PICK_AND_CHOOSE
     */
    async askExportAll(): Promise<boolean | undefined> {
        const result = await vscode.window.showQuickPick(
            [ALL, PICK_AND_CHOOSE],
            {
                ignoreFocusOut: true,
                placeHolder: "What do you want to export?",
                title: "IdentityNow",
                canPickMany: false
            });

        if (result) {
            return result === ALL;
        }
    };

    /**
     * Asks the user to choose from a list of ObjectPickItem
     * @param items List of ObjectPickItem 
     * @returns List of ids
     */
    async askChosenItems(items: Array<ObjectPickItem>): Promise<Array<string> | undefined> {
        const result = await vscode.window.showQuickPick(
            items,
            {
                ignoreFocusOut: true,
                placeHolder: "What do you want to export?",
                title: "IdentityNow",
                canPickMany: true
            });

        if (result) {
            return result.map(x => x.id);
        }
    };

    /**
     * Prompt the users for options and start the export
     * @returns 
     */
    async chooseAndExport(): Promise<void> {

        //
        // Do we export a single file or multiple files?
        //
        const exportTypeItem = await vscode.window.showQuickPick<vscode.QuickPickItem>(EXPORT_TYPES, {
            ignoreFocusOut: false,
            title: "How to export objects",
            canPickMany: false,

        });
        console.log("chooseAndExport: exportTypeItem=", exportTypeItem);
        if (exportTypeItem === undefined) {
            console.log("< chooseAndExport: no exportTypeItem");
            return;
        }
        this.exportSingle = exportTypeItem === SINGLE_EXPORT_TYPE;

        //
        // Where to?
        //
        let exportFolder: string | undefined = this.getProposedFolder();
        let exportFile: string | undefined = this.getProposedFilename(this.tenantName);

        if (this.exportSingle) {
            this.target = await askFile(
                "Enter the file to save the exported objects to",
                path.join(exportFolder, exportFile));
        } else {
            this.target = await askFolder(
                "Enter folder to save the exported objects",
                exportFolder);
        }
        if (this.target === undefined) {
            return;
        }

        //
        // Which objects do we export?
        //
        const sortedObjectTypeItems = OBJECT_TYPE_ITEMS.sort(((a, b) => (a.label > b.label) ? 1 : -1));

        const objectTypeItemsToExport = await vscode.window.showQuickPick<ObjectTypeItem>(sortedObjectTypeItems, {
            ignoreFocusOut: false,
            title: "Object type to export",
            canPickMany: true
        });

        if (objectTypeItemsToExport === undefined || !Array.isArray(objectTypeItemsToExport) || objectTypeItemsToExport.length < 1) {
            console.log("< chooseAndExport: no objectType");
            return;
        }
        this.objectTypes = objectTypeItemsToExport.map(i => i.objectType);

        //
        // Do we export all objects or just a subset?
        //
        const exportAll = await this.askExportAll();
        if (exportAll === undefined) { return; }

        //
        // Export all objects of the chosen object type
        //
        if (exportAll) {
            await this.exportConfigWithProgression();
            return;
        }
        //
        // Choose objects
        //
        // At this point, tenantId and tenantName already defined
        this.client = new IdentityNowClient(this.tenantId as string, this.tenantName as string);
        for (const objectType of this.objectTypes) {
            let items: any[] = [];
            switch (objectType) {
                case "SOURCE":
                    items = await this.client.getSources();
                    break;
                case "IDENTITY_PROFILE":
                    items = await this.client.getIdentityProfiles();
                    break;
                case "TRANSFORM":
                    items = await this.client.getTransforms();
                    break;
                case "RULE":
                    items = await this.client.getConnectorRules();
                    break;
                case "TRIGGER_SUBSCRIPTION":
                    Object.defineProperty(this.options,
                        objectType, {
                        value:
                        {
                            includedIds: [],
                            includedNames: []
                        }
                    });
                    continue;
                    break;
                default:
                    break;
            }
            if (items === undefined || !Array.isArray(items) || items.length === 0) {
                continue;
            }
            const pickItems: ObjectPickItem[] = items.map((x: any) => ({
                label: x.name,
                description: x.description,
                id: x.id,
                picked: true
            }));
            const includeIds = await this.askChosenItems(pickItems);
            if (includeIds === undefined) { return; }
            if (pickItems.length !== includeIds.length) {
                // XXX What is the expected behavior of the SP Config import if includedIds is empty?
                Object.defineProperty(this.options,
                    objectType, {
                    value:
                    {
                        includedIds: includeIds,
                        includedNames: []
                    }
                });
            }

        }

        await this.exportConfigWithProgression();
    }
}

/**
 * Entrypoint to export a Node (Source, Rule, Identity Profile or transform). Tenant is known.
 */
export class ExportNodeConfig extends BaseExporter {
    constructor(
        private readonly tenantService: TenantService
    ) {
        super();
        this.exportSingle = true;
    }


    private getObjectType(node: IdentityNowResourceTreeItem): string {
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

    async execute(node?: IdentityNowResourceTreeItem): Promise<void> {

        console.log("> ExportNodeConfig.execute");
        this.init();
        // assessing that item is a IdentityNowResourceTreeItem
        if (node === undefined || !(node instanceof IdentityNowResourceTreeItem)) {
            console.error("ExportNodeConfig: invalid item", node);
            throw new Error("ExportNodeConfig: invalid item");
        }


        this.tenantName = node.tenantName;
        console.log("ExportNodeConfig: tenantName = ", this.tenantName);
        this.tenantId = node.tenantId;

        const objectType = this.getObjectType(node);
        this.objectTypes = [objectType];
        var label = '';
        if (typeof node.label === "string") {
            label = node.label;
        } else {
            label = node.label?.label || "";
        }

        const exportFile = path.join(
            this.getProposedFolder(objectType),
            this.getProposedFilename(this.tenantName, label)
        );

        this.target = await askFile(
            `Enter the file to save ${label} to`,
            exportFile);
        if (this.target === undefined) {
            return;
        }

        this.options[objectType] = {
            "includedIds": [
                node.id
            ]
        };

        await this.exportConfigWithProgression();
    }
}

/**
 * Entrypoint for full export configuration from the command palette. Tenant is unknown.
 */
export class ExportConfigPalette extends WizardBaseExporter {
    constructor(
        private readonly tenantService: TenantService
    ) { super(); }

    async execute() {
        console.log("> exportConfigPalette.execute");
        this.init();
        const tenantInfo = await chooseTenant(this.tenantService, 'From which tenant do you want to export the config?');
        console.log("exportConfigPalette: tenant = ", tenantInfo);
        if (!tenantInfo) {
            return;
        }

        this.tenantId = tenantInfo?.id || "";
        this.tenantName = tenantInfo?.tenantName || "";

        await this.chooseAndExport();
    }
}

/**
 * Entrypoint for full export configuration from the tree view. Tenant is known.
 */
export class ExportConfigTreeView extends WizardBaseExporter {
    constructor() { super(); }

    async execute(node?: TenantTreeItem) {
        this.init();
        console.log("> ExportConfigTreeView.execute");
        // assessing that item is a IdentityNowResourceTreeItem
        if (node === undefined || !(node instanceof TenantTreeItem)) {
            console.log("WARNING: fullExportConfigFromTreeView: invalid item", node);
            throw new Error("fullExportConfigFromTreeView: invalid item");
        }
        this.tenantId = node.tenantId;
        this.tenantName = node.tenantName;

        await this.chooseAndExport();
    }
}
