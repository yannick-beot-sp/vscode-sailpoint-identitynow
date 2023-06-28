import * as vscode from 'vscode';
import { ExportOptions } from '../../models/ExportOptions';
import { OBJECT_TYPE_ITEMS } from '../../models/ObjectTypeQuickPickItem';
import { SPConfigImporter } from './SPConfigImporter';
import { askChosenItems, askSelectObjectTypes } from '../../utils/vsCodeHelpers';

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
        // List of ObjectTypeItems based on object types present in the SP Config
        const availableObjectTypeItems = OBJECT_TYPE_ITEMS
            .filter(x => objectTypes.has(x.objectType));
        const requestedObjectTypes = await askSelectObjectTypes("Object type to import", availableObjectTypeItems);
        if (requestedObjectTypes === undefined) { return; }

        const options: ExportOptions = {
            includeTypes: [],
            excludeTypes: [],
            objectOptions: {}
        };

        //
        // Building the list of Ids for each object type
        // 
        for (const requestedObjectType of requestedObjectTypes) {
            const pickItems = spConfig.objects
                .filter((x: any) => x.self.type === requestedObjectType.objectType)
                .map((x: any) => ({
                    name: x.self.name,
                    id: x.self.id,
                    picked: true
                }));
            const includeIds = await askChosenItems(requestedObjectType.label, "What do you want to import?", pickItems);

            if (includeIds === undefined) { continue; }
            options.includeTypes?.push(requestedObjectType.objectType);
            if (pickItems.length !== includeIds.length) {
                // XXX What is the expected behavior of the SP Config import if includedIds is empty?
                Object.defineProperty(options.objectOptions,
                    requestedObjectType.objectType, {
                    value:
                    {
                        includedIds: includeIds,
                        includedNames: []
                    }
                });
            }
        }
        if (options.includeTypes?.length === 0) {
            vscode.window.showInformationMessage("Nothing to import");
        } else {
            await this.startImportConfig(
                tenantId,
                tenantName,
                tenantDisplayName,
                data,
                options
            );
        }
    }
}
