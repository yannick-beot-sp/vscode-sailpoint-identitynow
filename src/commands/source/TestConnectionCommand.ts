import * as vscode from 'vscode';

import { StatusResponseBeta, StatusResponseBetaStatusEnum } from 'sailpoint-api-client';
import { SourceTreeItem } from '../../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../../services/IdentityNowClient';

export class TestConnectionCommand {

    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node: SourceTreeItem) {

        console.log("> TestConnectionCommand.execute");
        const client = new IdentityNowClient(
            node.tenantId,
            node.tenantName
        );

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Testing  ${node.label} from ${node.tenantDisplayName}...`,
            cancellable: false
        }, async (task, token) => { return await client.testSourceConnection(node.id!) })
            .then(async (result: StatusResponseBeta) => {
                if (StatusResponseBetaStatusEnum.Success === result.status) {
                    vscode.window.showInformationMessage(
                        `Connection test successfull for ${node.label} from ${node.tenantDisplayName}`
                    );
                } else {
                    const errorMessage = (result.details as any)?.error
                    vscode.window.showErrorMessage(
                        `Connection test failed for ${node.label} from ${node.tenantDisplayName}: ${errorMessage}`
                    );
                }
            });
    }
}






