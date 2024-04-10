import * as fs from 'fs';
import * as vscode from 'vscode';

import { askFile, openPreview } from '../../utils/vsCodeHelpers';
import { FormTreeItem, FormsTreeItem } from '../../models/ISCTreeItem';
import { PathProposer } from '../../services/PathProposer';
import { ISCClient } from '../../services/ISCClient';
import { ensureFolderExists } from '../../utils/fileutils';

export class FormDefinitionExportCommand {

    async execute(node: FormsTreeItem | FormTreeItem): Promise<void> {
        console.log("> FormDefinitionExportCommand.execute");

        let exportFile = "",
            prompt = "",
            filters: string | undefined = undefined,
            successfullMessage = ""
        if (node.hasOwnProperty("id")) {
            // FormTreeItem
            exportFile = PathProposer.getFormExportFilename(
                node.tenantName,
                node.tenantDisplayName,
                node.label as string
            )
            prompt = `Enter the file to save ${node.label} to`
            filters = `name eq "${node.label}"`
            successfullMessage = `Successfully exported ${node.label} from ${node.tenantDisplayName}`
        } else {
            //FormsTreeItem
            exportFile = PathProposer.getFormsExportFilename(
                node.tenantName,
                node.tenantDisplayName
            )
            prompt = `Enter the file to save forms from ${node.tenantDisplayName} to`
            successfullMessage = `Successfully exported forms from ${node.tenantDisplayName}`

        }

        const target = await askFile(
            prompt,
            exportFile);
        if (target === undefined) {
            return;
        }

        const client = new ISCClient(node.tenantId, node.tenantName);
        const data = await client.exportForms(filters)

        console.log('Writing to ', target);
        ensureFolderExists(target);
        fs.writeFileSync(target, JSON.stringify(data, null, 2), { encoding: "utf8" });

        vscode.window.showInformationMessage(successfullMessage);
        await openPreview(target)
    }
}

