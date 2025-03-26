import * as vscode from 'vscode';

import { EXPORTABLE_OBJECT_TYPE_ITEMS, ExportableObjectTypeQuickPickItem } from '../../models/ObjectTypeQuickPickItem';
import { askChosenItems, askFile, askFolder, askSelectObjectTypes, openPreview } from '../../utils/vsCodeHelpers';
import { PathProposer } from '../../services/PathProposer';
import { ISCClient } from '../../services/ISCClient';
import { SPConfigExporter } from './SPConfigExporter';
import { ExportPayloadBetaIncludeTypesBeta, ObjectExportImportOptionsBeta } from 'sailpoint-api-client';
import { SimpleSPConfigExporter } from '../source/CloneSourceCommand';

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
                title: "Identity Security Cloud",
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
            const exportFolder = PathProposer.getSPConfigMultipeFileFolder(
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
        const objectTypeToExport = await askSelectObjectTypes("Object type to export", EXPORTABLE_OBJECT_TYPE_ITEMS);
        if (objectTypeToExport === undefined) { return; }

        let objectTypes: ExportPayloadBetaIncludeTypesBeta[] = objectTypeToExport.map(x => x.objectType);
        const options: { [key: string]: ObjectExportImportOptionsBeta } = {};

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
            const client = new ISCClient(tenantId, tenantName);
            for (const objectTypeItem of objectTypeToExport) {
                let items: any[] = [];
                switch (objectTypeItem.objectType) {
                    case ExportPayloadBetaIncludeTypesBeta.FormDefinition:
                        items = await client.listForms();
                        break;
                    case ExportPayloadBetaIncludeTypesBeta.GovernanceGroup:
                        items = await client.getGovernanceGroups()
                        break;

                    case ExportPayloadBetaIncludeTypesBeta.IdentityProfile:
                        items = await client.getIdentityProfiles();
                        break;
                    case ExportPayloadBetaIncludeTypesBeta.NotificationTemplate:
                        items = await client.getNotificationTemplates();
                        break;
                    case ExportPayloadBetaIncludeTypesBeta.ConnectorRule:
                        items = await client.getConnectorRules();
                        break;
                    case ExportPayloadBetaIncludeTypesBeta.Rule:
                        // SP Config allows to export cloud rules
                        // Need to leverage SP Config API and not only "connector rules" endpoints
                        const exporter = new SimpleSPConfigExporter(
                            client,
                            tenantDisplayName,
                            {},
                            [ExportPayloadBetaIncludeTypesBeta.Rule]
                        );
                        const data = await exporter.exportConfigWithProgression();
                        items = data.objects.map(x => ({
                            name: x.self.name,
                            description: x.object?.description,
                            id: x.self.id
                        }))
                        break;
                    case ExportPayloadBetaIncludeTypesBeta.Segment:
                        items = await client.getSegments()
                        break;
                    case ExportPayloadBetaIncludeTypesBeta.ServiceDeskIntegration:
                        items = await client.getServiceDesks()
                        break;
                    case ExportPayloadBetaIncludeTypesBeta.Source:
                        items = await client.getSources();
                        break;
                    case ExportPayloadBetaIncludeTypesBeta.Transform:
                        items = await client.getTransforms();
                        break;
                    case ExportPayloadBetaIncludeTypesBeta.Workflow:
                        items = await client.getWorflows();
                        break;
                    case ExportPayloadBetaIncludeTypesBeta.Role:
                        items = await client.getAllRoles();
                        break;
                    case ExportPayloadBetaIncludeTypesBeta.SodPolicy:
                        items = await client.getSoDPolicies();
                        break;
                    default:
                        // By default export everything
                        // No pick and choose
                        options[objectTypeItem.objectType.toString()] = {
                            includedIds: [],
                            includedNames: []
                        };
                        break;
                }
                if (items === undefined || !Array.isArray(items) || items.length === 0) {
                    continue;
                }
                const placeHolder = "What do you want to export?";
                // cf. SAASTRIAGE-2178 & SAASTRIAGE-2076
                let selectedItems: string[] | undefined = undefined;
                let propertyName = "includedIds";
                if (objectTypeItem.objectType === ExportPayloadBetaIncludeTypesBeta.Segment
                    || objectTypeItem.objectType === ExportPayloadBetaIncludeTypesBeta.FormDefinition
                    || objectTypeItem.objectType === ExportPayloadBetaIncludeTypesBeta.ConnectorRule) {
                    // Need to select by name because it does not work by id
                    propertyName = "includedNames";
                    selectedItems = await askChosenItems(objectTypeItem.label, placeHolder, items, x => x.label);
                } else {
                    selectedItems = await askChosenItems(objectTypeItem.label, placeHolder, items);
                }
                if (selectedItems === undefined) {
                    // Leave the wizard
                    return
                }
                if (!Array.isArray(selectedItems) || selectedItems.length === 0) { // No selection
                    // removes the object type from the list so it is not exported
                    const index = objectTypes.indexOf(objectTypeItem.objectType)
                    if (index !== -1) {
                        objectTypes.splice(index, 1)
                    }
                    continue
                }
                if (items.length !== selectedItems.length) {
                    options[objectTypeItem.objectType] = {
                        [propertyName]: selectedItems
                    };
                }

            }
        }

        if (objectTypes.length === 0) {
            // Nothing to export
            // Leave the wizard
            return
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
            await openPreview(target);
        }
    }
}