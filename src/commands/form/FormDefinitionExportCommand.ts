import * as fs from 'fs';
import * as vscode from 'vscode';

import { askChosenItems, askFile, openPreview } from '../../utils/vsCodeHelpers';
import { FormTreeItem, FormsTreeItem } from '../../models/ISCTreeItem';
import { PathProposer } from '../../services/PathProposer';
import { ISCClient } from '../../services/ISCClient';
import { ensureFolderExists } from '../../utils/fileutils';

export class FormDefinitionExportCommand {

    async execute(node: FormsTreeItem | FormTreeItem): Promise<void> {
        console.log("> FormDefinitionExportCommand.execute");
        const client = new ISCClient(node.tenantId, node.tenantName);
        let exportFile = "",
            prompt = "",
            data,
            successfullMessage = ""
        if (node.hasOwnProperty("id")) {
            // FormTreeItem
            exportFile = PathProposer.getFormExportFilename(
                node.tenantName,
                node.tenantDisplayName,
                node.label as string
            )
            prompt = `Enter the file to save ${node.label} to`
            const filters = `name eq "${node.label}"`
            data = await client.exportForms(filters)
            successfullMessage = `Successfully exported ${node.label} from ${node.tenantDisplayName}`
        } else {
            //FormsTreeItem
            exportFile = PathProposer.getFormsExportFilename(
                node.tenantName,
                node.tenantDisplayName
            )
            prompt = `Enter the file to save forms from ${node.tenantDisplayName} to`
            successfullMessage = `Successfully exported forms from ${node.tenantDisplayName}`

            const forms = (await client.exportForms()).map(x => ({
                ...x,
                id: x.object.id,
                name: x.object.name,
                description: x.object.description
            }))
            data = await askChosenItems("Exporting forms", "Forms", forms, x => {
                const { id, name, description, ...rest } = x;
                return rest;
            })
            if (data === undefined) {
                return
            }

        }

        const target = await askFile(
            prompt,
            exportFile);
        if (target === undefined) {
            return;
        }

        // Cleaning "data" by removing usedBy
        data = data.map(item => ({
            ...item,
            object: {
                ...item.object,
                usedBy: []
            }
        }));

        console.log('Writing to ', target);
        ensureFolderExists(target);
        fs.writeFileSync(target, JSON.stringify(data, null, 2), { encoding: "utf8" });

        vscode.window.showInformationMessage(successfullMessage);
        await openPreview(target)
    }
}

