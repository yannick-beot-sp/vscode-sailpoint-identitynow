import * as vscode from 'vscode';

import { ObjectPickItem } from '../../models/ObjectPickItem';
import { OBJECT_TYPE_ITEMS } from '../../models/ObjectTypeQuickPickItem';
import { ObjectTypeItem } from '../../models/ConfigQuickPickItem';
import { askChosenItems, askFile, askFolder, openPreview } from '../../utils/vsCodeHelpers';
import { PathProposer } from '../../services/PathProposer';
import { IdentityNowClient } from '../../services/IdentityNowClient';
import { SPConfigExporter } from './SPConfigExporter';

const ALL: vscode.QuickPickItem = {
    label: "Export everything",
    picked: true
};

const PICK_AND_CHOOSE: vscode.QuickPickItem = {
    label: "Choose what to export"
};


const SINGLE_EXPORT_TYPE = {
    "label": "Single file",
    "description": "Download a single JSON file containing all exported objects (SP-Config)"
};
const MULTIPLE_EXPORT_TYPE =
{
    "label": "Multiple files",
    "description": "Save objects as separate JSON file on the filesystem"
};
const EXPORT_TYPES = [SINGLE_EXPORT_TYPE, MULTIPLE_EXPORT_TYPE];

/**
 * Base Class used by exporter command with full wizard 
 */
export abstract class WizardBasedExporterCommand {

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
     * Prompt the users for options and start the export
     * @returns 
     */
    protected async chooseAndExport(
        tenantId: string,
        tenantName: string,
        tenantDisplayName: string,
    ): Promise<void> {

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
        const exportSingle = exportTypeItem === SINGLE_EXPORT_TYPE;

        //
        // Where to?
        //
        let target: string | undefined;
        if (exportSingle) {
            const exportFile = PathProposer.getSPConfigSingleFileFilename(
                tenantName,
                tenantDisplayName);
            target = await askFile(
                "Enter the file to save the exported objects to",
                exportFile);

        } else {
            let exportFolder = PathProposer.getSPConfigMultipeFileFolder(
                tenantName,
                tenantDisplayName);
            target = await askFolder(
                "Enter folder to save the exported objects",
                exportFolder);
        }
        if (target === undefined) {
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
        const objectTypes = [] as string[];
        const options: any = {};

        //
        // Do we export all objects or just a subset?
        //
        const exportAll = await this.askExportAll();
        if (exportAll === undefined) { return; }

        //
        // If not export all, we need to pick and choose which objets
        //
        if (!exportAll) {
            //
            // Choose objects
            //
            // At this point, tenantId and tenantName already defined
            const client = new IdentityNowClient(tenantId, tenantName);
            for (const objectTypeItem of objectTypeItemsToExport) {
                let items: any[] = [];
                switch (objectTypeItem.objectType) {
                    case "SOURCE":
                        items = await client.getSources();
                        break;
                    case "IDENTITY_PROFILE":
                        items = await client.getIdentityProfiles();
                        break;
                    case "TRANSFORM":
                        items = await client.getTransforms();
                        break;
                    case "RULE":
                        items = await client.getConnectorRules();
                        break;
                    case "TRIGGER_SUBSCRIPTION":
                        options["TRIGGER_SUBSCRIPTION"] = {
                            includedIds: [],
                            includedNames: []
                        };
                        continue;
                    default:
                        break;
                }
                if (items === undefined || !Array.isArray(items) || items.length === 0) {
                    continue;
                }

                const includeIds = await askChosenItems(objectTypeItem.label, "What do you want to export?", items);
                if (includeIds === undefined) { continue; }
                objectTypes.push(objectTypeItem.objectType);
                if (items.length !== includeIds.length) {
                    // XXX What is the expected behavior of the SP Config import if includedIds is empty?
                    options[objectTypeItem.objectType] = {
                        includedIds: includeIds
                    };
                }

            }
        }
        const exporter = new SPConfigExporter(
            tenantId,
            tenantName,
            tenantDisplayName,
            target,
            options,
            objectTypes,
            exportSingle
        );

        await exporter.exportConfigWithProgression();
        if (exportSingle) {
            await openPreview(vscode.Uri.file(target));
        }
    }
}