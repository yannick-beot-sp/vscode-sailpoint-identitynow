import * as vscode from 'vscode';
import { TenantTreeItem } from '../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { ObjectTypeItem } from '../models/ConfigQuickPickItem';
import { delay } from '../utils';
import * as fs from 'fs';
// import path = require('path');
import { TenantService } from '../services/TenantService';
import { chooseTenant, getFullContent } from '../utils/vsCodeHelpers';
import { ExportOptions } from '../models/ExportOptions';
import { ObjectPickItem } from '../models/ObjectPickItem';
import { OBJECT_TYPE_ITEMS } from '../models/ObjectTypeQuickPickItem';
import { ImportedObject } from '../models/JobStatus';

const ALL: vscode.QuickPickItem = {
    label: "Import everything",
    picked: true
};

const PICK_AND_CHOOSE: vscode.QuickPickItem = {
    label: "Choose what to import"
};


/**
 * Base class for all importer
 */
class BaseImporter {
    tenantName: string | undefined;
    tenantId: string | undefined;
    filePath: string | undefined;
    data = "";
    importOptions: ExportOptions = {};


    init(): void {
        this.data = "";
        this.importOptions = {};
    }

    /**
     * Create the import job and follow-up the result
     */
    async importConfig(): Promise<void> {
        if (!this.tenantId || !this.tenantName) {
            throw new Error("Invalid tenant info");
        }
        if (!this.data || this.data === undefined) {
            throw new Error("Invalid data");
        }

        let message = "";
        const client = new IdentityNowClient(this.tenantId, this.tenantName);
        const data = this.data as string;
        const importOptions = this.importOptions;
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing configuration from ${this.tenantName}...`,
            cancellable: false
        }, async (task, token) => {
            try {
                const jobId = await client.startImportJob(data, importOptions);
                let jobStatus: any;
                do {
                    await delay(1000);
                    jobStatus = await client.getImportJobStatus(jobId);
                    console.log({ jobStatus });
                } while (jobStatus.status === "NOT_STARTED" || jobStatus.status === "IN_PROGRESS");

                if (jobStatus.status !== "COMPLETE") {
                    throw new Error("Could not import config: " + jobStatus.message);
                }

                const importJobresult: any = await client.getImportJobResult(jobId);
                for (const key in importJobresult.results) {
                    if (message.length > 0) {
                        message += ", ";
                    }
                    message += importJobresult.results[key].importedObjects
                        .map((x: ImportedObject) => `${x.name} (${key})`)
                        .join(", ");
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(`Could not import data: ${error.message}`);
                throw error;
            }
        }).then(async () => {
            await vscode.window.showInformationMessage(
                `Successfully imported configuration to ${this.tenantName}: ${message}`);
        });
    }

    /**
     * Asks the user if he/she wants to import everything or not
     * @returns ALL or PICK_AND_CHOOSE
     */
    async askImportAll(): Promise<boolean | undefined> {
        const result = await vscode.window.showQuickPick(
            [ALL, PICK_AND_CHOOSE],
            {
                ignoreFocusOut: true,
                placeHolder: "What do you want to import?",
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
                placeHolder: "What do you want to import?",
                title: "IdentityNow",
                canPickMany: true
            });

        if (result) {
            return result.map(x => x.id);
        }
    };

    /**
     * Maps object types to QuickPickItems with a human-readable label and asks to choose
     * @param objectTypes List of object types to choose from
     * @returns 
     */
    async askSelectObjectTypes(objectTypes: Set<string>): Promise<Array<string> | undefined> {
        const sortedObjectTypeItems = OBJECT_TYPE_ITEMS
            .filter(x => objectTypes.has(x.objectType))
            .sort(((a, b) => (a.label > b.label) ? 1 : -1));

        const objectTypeItemsToImport = await vscode.window.showQuickPick<ObjectTypeItem>(sortedObjectTypeItems, {
            ignoreFocusOut: false,
            title: "Object type to import",
            canPickMany: true
        });

        if (objectTypeItemsToImport !== undefined
            && Array.isArray(objectTypeItemsToImport)
            && objectTypeItemsToImport.length > 0) {

            return objectTypeItemsToImport.map(x => x.objectType);
        }
        console.log("< askSelectObjectTypes: no objectType");
    }

    async selectAndImport(): Promise<void> {
        const spConfig = JSON.parse(this.data);

        //
        // Do we import everything?
        // 
        const importAll = await this.askImportAll();
        if (importAll === undefined) { return; }

        if (importAll) {
            await this.importConfig();
            return;
        }

        //
        // Get the list of (unique) object types present in the data
        //
        const objectTypes = new Set<string>();
        spConfig.objects.forEach((x: any) => objectTypes.add(x.self.type));
        //
        // Ask the user to choose which object types
        // 
        const requestedObjectTypes = await this.askSelectObjectTypes(objectTypes);
        if (requestedObjectTypes === undefined) { return; }

        const options: ExportOptions = {
            includeTypes: requestedObjectTypes,
            excludeTypes: [],
            objectOptions: {}
        };

        //
        // Building the list of Ids for each object type
        // 
        for (const requestedObjectType of requestedObjectTypes) {
            const pickItems = spConfig.objects.filter((x: any) => x.self.type === requestedObjectType)
                .map((x: any) => ({
                    label: x.self.name,
                    id: x.self.id,
                    picked: true
                }));
            const includeIds = await this.askChosenItems(pickItems);
            if (includeIds === undefined) { return; }
            if (pickItems.length !== includeIds.length) {
                // XXX What is the expected behavior of the SP Config import if includedIds is empty?
                Object.defineProperty(options.objectOptions,
                    requestedObjectType, {
                    value:
                    {
                        includedIds: includeIds,
                        includedNames: []
                    }
                });
            }
        }
        this.importOptions = options;
        await this.importConfig();
    }
}

/**
 * Entry point to import file from the command palette. Tenant is unknown. File is known.
 * @param node 
 */
export class PaletteImporter extends BaseImporter {
    constructor(
        private readonly tenantService: TenantService
    ) { super(); }

    /**
     * 1. choose the tenant
     * 2. get content of the current selected file in the editor
     * 3. Start the import steps
     */
    async execute(): Promise<void> {
        console.log("> PaletteImporter.execute");
        this.init();
        const tenantInfo = await chooseTenant(this.tenantService, 'To which tenant do you want to import the config?');
        console.log("PaletteImporter.execute: tenant = ", tenantInfo);
        if (!tenantInfo) {
            return;
        }
        this.tenantId = tenantInfo.id;
        this.tenantName = tenantInfo.tenantName;

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            console.error('No editor');
            throw new Error("No editor");

        }

        this.data = getFullContent(editor);


        await this.selectAndImport();
    }
}

/**
 * Entry point to import file from the explorer. Tenant is unknown. File is known.
 * @param node 
 */
export class MenuImporter extends BaseImporter {
    constructor(
        private readonly tenantService: TenantService
    ) { super(); }

    /**
     * 1. choose the tenant
     * 2. get content of the current selected file in the editor
     * 3. Start the import steps
     */
    async execute(fileUri: vscode.Uri, selectedFiles: vscode.Uri[]): Promise<void> {
        console.log("> MenuImporter.execute");
        this.init();
        const tenantInfo = await chooseTenant(this.tenantService, 'To which tenant do you want to import the config?');
        console.log("MenuImporter.execute: tenant = ", tenantInfo);
        if (!tenantInfo) {
            return;
        }
        this.tenantId = tenantInfo.id;
        this.tenantName = tenantInfo.tenantName;

        this.data = fs.readFileSync(fileUri.fsPath).toString();
        await this.selectAndImport();
    }
}

/**
 * Entry point to import file from the tree view. Tenant is already known
 * @param node 
 */
export class TreeViewImporter extends BaseImporter {
    constructor(
        private readonly tenantService: TenantService
    ) { super(); }

    /**
   * 1. Choose the file
   * 2. get content of the file
   * 3. Start the import steps
   */
    async execute(node?: TenantTreeItem): Promise<void> {
        console.log("> TreeViewImporter.execute");
        this.init();

        // assessing that item is a IdentityNowResourceTreeItem
        if (node === undefined || !(node instanceof TenantTreeItem)) {
            console.log("WARNING: TreeViewImporter.execute: invalid item", node);
            throw new Error("TreeViewImporter.execute: invalid item");
        }
        this.tenantId = node.tenantId;
        this.tenantName = node.tenantName;


        const fileUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Open',
            filters: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'JSON files': ['json'],
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'All files': ['*']
            }
        });

        if (fileUri === undefined || fileUri.length === 0) { return; }
        this.data = fs.readFileSync(fileUri[0].fsPath).toString();
        await this.selectAndImport();
    }
}

