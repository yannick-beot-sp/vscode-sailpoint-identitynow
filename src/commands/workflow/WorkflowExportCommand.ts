import * as fs from 'fs';
import * as vscode from 'vscode';

import { askFile, openPreview } from '../../utils/vsCodeHelpers';
import { PathProposer } from '../../services/PathProposer';
import { ISCClient } from '../../services/ISCClient';
import { ensureFolderExists } from '../../utils/fileutils';
import { WorkflowTreeItem } from '../../models/ISCTreeItem';
import { cleanUpWorkflow } from './utils';

export class WorkflowExportCommand {

    async execute(node: WorkflowTreeItem): Promise<void> {
        console.log("> WorkflowExportCommand.execute");

        let exportFile = PathProposer.getWorkflowFilename(
            node.tenantName,
            node.tenantDisplayName,
            node.label as string
        ),
            prompt = `Enter the file to save ${node.label} to`,
            successfullMessage = `Successfully exported ${node.label} from ${node.tenantDisplayName}`

        const target = await askFile(
            prompt,
            exportFile);
        if (target === undefined) {
            return;
        }

        const client = new ISCClient(node.tenantId, node.tenantName);
        const data = await client.getWorflow(node.resourceId)

        const cleanedWorkflow = cleanUpWorkflow(data)

        console.log('Writing to ', target);
        ensureFolderExists(target);
        fs.writeFileSync(target, JSON.stringify(cleanedWorkflow, null, 2), { encoding: "utf8" });

        vscode.window.showInformationMessage(successfullMessage);
        await openPreview(target)
    }
}

