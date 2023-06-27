import * as vscode from 'vscode';
import { ExportOptions } from '../../models/ExportOptions';
import { ObjectTypeItem } from '../../models/ConfigQuickPickItem';
import { ObjectPickItem } from '../../models/ObjectPickItem';
import { OBJECT_TYPE_ITEMS } from '../../models/ObjectTypeQuickPickItem';
import { SPConfigImporter } from './SPConfigImporter';

const ALL: vscode.QuickPickItem = {
    label: "Import everything",
    picked: true
};

const PICK_AND_CHOOSE: vscode.QuickPickItem = {
    label: "Choose what to import"
};

/**
 * Base class for all importer command
 */
export abstract class WizardBasedImporterCommand {

    /**
     * Asks the user if he/she wants to import everything or not
     * @returns true if all must be imported. Undefined if no selection from user
     */
    private async askImportAll(): Promise<boolean | undefined> {
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
    private async askChosenItems(items: Array<ObjectPickItem>): Promise<Array<string> | undefined> {
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
    private async askSelectObjectTypes(objectTypes: Set<string>): Promise<Array<string> | undefined> {
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

    private async startImportConfig(
        tenantId: string,
        tenantName: string,
        tenantDisplayName: string,
        data: string, 
        importOptions: ExportOptions = {}): Promise<void> {

            const importer = new SPConfigImporter(tenantId, tenantName, tenantDisplayName, importOptions, data);
            await importer.importConfig();
    }

    async selectAndImport(
        tenantId: string,
        tenantName: string,
        tenantDisplayName: string,
        data: string): Promise<void> {
        const spConfig = JSON.parse(data);

        //
        // Do we import everything?
        // 
        const importAll = await this.askImportAll();
        if (importAll === undefined) { return; }

        if (importAll) {
            await this.startImportConfig(
                tenantId, 
                tenantName, 
                tenantDisplayName,
                data
            );
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

        await this.startImportConfig(
            tenantId, 
            tenantName, 
            tenantDisplayName,
            data,
            options
        );
    }
}
