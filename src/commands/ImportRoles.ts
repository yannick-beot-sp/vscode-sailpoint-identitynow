import * as vscode from 'vscode';
import { IdentityNowClient } from "../services/IdentityNowClient";
import { isEmpty } from 'lodash';
import { GenericCSVReader } from '../services/GenericCSVReader';
import { chooseFile } from '../utils/vsCodeHelpers';
import { RolesTreeItem } from '../models/IdentityNowTreeItem';

interface RolesImportResult {
    success: number
    error: number
}

interface RoleCSVRecord {
    name: string
    description: string 
    enabled: boolean
    requestable: boolean
    owner: string
    commentsRequired: boolean
    denialCommentsRequired: boolean
    approvalSchemes: string
    revokeCommentsRequired: string
    revokeDenialCommentsRequired: string
    revokeApprovalSchemes: string
    accessProfiles: string
}

export class RoleImporterCommand {

    async execute(node?: RolesTreeItem): Promise<void> {
        console.log("> RoleImporterCommand.execute");
        if (node === undefined) {
            console.error("RoleImporterCommand: invalid item", node);
            throw new Error("RoleImporterCommand: invalid item");
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined ) { return; }

        const roleImporter = new RoleImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            node.label as string,
            node.id as string,
            0,
            fileUri
        );
        await roleImporter.importFileWithProgression();
    }
}

export class RoleImporter {
    readonly client: IdentityNowClient;
    constructor(
        private tenantId: string,
        private tenantName: string,
        private tenantDisplayName: string,
        private roleName: string,
        private sourceId: string,
        private sourceCCId: number,
        private fileUri: vscode.Uri
    ) {
        this.client = new IdentityNowClient(this.tenantId, this.tenantName);
    }

    async importFileWithProgression(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing roles to ${this.roleName}...`,
            cancellable: false
        }, async (task, token) =>
            await this.importFile(task, token)
        );
    }

    protected async importFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> RoleImporter.importFile");
        const csvReader = new GenericCSVReader(this.fileUri.fsPath);

        const nbLines = await csvReader.getLines();
        const incr = 100 / nbLines;
        task.report({ increment: 0 });

        const result: RolesImportResult = {
            success: 0,
            error: 0
        };

        await csvReader.processLine(async (data: RoleCSVRecord) => {
            if (token.isCancellationRequested) {
                // skip
                return;
            }
            task.report({ increment: incr, message: data.name });
            if (isEmpty(data.name)) {
                result.error++;
                // console.log('Missing name in file');
                return;
            }

            if (isEmpty(data.enabled)) {
                data.enabled = false;
            }

            if (isEmpty(data.requestable)) {
                data.requestable = false;
            }

            if (isEmpty(data.commentsRequired)) {
                data.commentsRequired = false;
            }

            if (isEmpty(data.denialCommentsRequired)) {
                data.denialCommentsRequired = false;
            }

            if (isEmpty(data.revokeCommentsRequired)) {
                data.commentsRequired = false;
            }

            if (isEmpty(data.revokeDenialCommentsRequired)) {
                data.denialCommentsRequired = false;
            }

            if (isEmpty(data.owner)) {
                result.error++;
                return;
            }

            // Enrich Owner Id
            const owner = await this.client.getIdentity(data.owner);
            const ownerId = owner.id;
            if (isEmpty(ownerId)) {
                result.error++;
                return;
            }

            let outputAccessProfiles: any = [];

            if (!isEmpty(data.accessProfiles)) {
                const accessProfiles = await this.client.getAccessProfiles();
                const accessProfilesArray = data.accessProfiles.split(';');

                if (accessProfilesArray.length > 0) {
                    for (let appInd = 0; appInd < accessProfilesArray.length; appInd++) {
                        const app = accessProfilesArray[appInd];
                        let accessProfileId = '';

                        for (let index = 0; index < accessProfiles.length; index++) {
                            const sapp = accessProfiles[index];
                            if (sapp.name.trim() === app.trim()) {
                                accessProfileId = sapp.id;
                            }
                        }

                        if (accessProfileId.length > 0) {
                            outputAccessProfiles.push({
                                "id": accessProfileId,
                                "type": "ACCESS_PROFILE"
                            });
                        }
                    }
                }
            }

            let approverJson: any[] = [];

            const governanceGroups = await this.client.getGovernanceGroups();

            if (!isEmpty(data.approvalSchemes)) {
                const approversList = data.approvalSchemes.split(';');
                for (let index=0; index < approversList.length; index++) {
                    const approver = approversList[index];
                    console.log("Approver: " + approver);
                    let approverObj: any = {
                        "approverType": approver
                    };

                    if (!(approver === 'APP_OWNER' || approver === 'OWNER' || approver === 'SOURCE_OWNER' || approver === 'MANAGER')) {
                        approverObj.approverType = 'GOVERNANCE_GROUP';

                        const governanceGroupId = this.lookupGovernanceGroupId(governanceGroups, approver);
                        if (isEmpty(governanceGroupId)) {
                            result.error++;
                            console.log('Cannot find governance group');
                            return;
                        }
                        approverObj.approverId = governanceGroupId;
                    }

                    approverJson.push(approverObj);
                }
            }

            let revokeApproverJson: any[] = [];

            if (!isEmpty(data.revokeApprovalSchemes)) {
                const approversList = data.revokeApprovalSchemes.split(';');
                for (let index=0; index < approversList.length; index++) {
                    const approver = approversList[index];
                    console.log("Approver: " + approver);
                    let approverObj: any = {
                        "approverType": approver
                    };

                    if (!(approver === 'APP_OWNER' || approver === 'OWNER' || approver === 'SOURCE_OWNER' || approver === 'MANAGER')) {
                        approverObj.approverType = 'GOVERNANCE_GROUP';

                        const governanceGroupId = this.lookupGovernanceGroupId(governanceGroups, approver);
                        if (isEmpty(governanceGroupId)) {
                            result.error++;
                            console.log('Cannot find governance group');
                            return;
                        }
                        approverObj.approverId = governanceGroupId;
                    }

                    revokeApproverJson.push(approverObj);
                }
            }

            const rolePayload = {
                "name": data.name,
                "description": data.description,
                "enabled": data.enabled,
                "owner": {
                    "id": ownerId,
                    "type": "IDENTITY",
                    "name": data.owner
                },
                "accessRequestConfig": {
                    "commentsRequired": data.commentsRequired,
                    "denialCommentsRequired": data.denialCommentsRequired,
                    "approvalSchemes": approverJson
                },
                "revocationRequestConfig": {
                    "commentsRequired": data.revokeCommentsRequired,
                    "denialCommentsRequired": data.revokeDenialCommentsRequired,
                    "approvalSchemes": revokeApproverJson
                },
                "accessProfiles": outputAccessProfiles
            };

            try {
                await this.client.createResource('/v3/roles', JSON.stringify(rolePayload));
                result.success++;
            } catch (error) {
                result.error++;
                console.error(error);
            }
        });

        const message = `${nbLines} line(s) processed. ${result.success} sucessfully import. ${result.error} error(s).`;

        if (result.error === nbLines) {
            vscode.window.showErrorMessage(message);
        } else if (result.error > 0) {
            vscode.window.showWarningMessage(message);
        } else {
            vscode.window.showInformationMessage(message);
        }
    }

    protected lookupGovernanceGroupId(governanceGroups: any, governanceGroup: string) {
        if (governanceGroups !== undefined && governanceGroups instanceof Array) {
			for (let group of governanceGroups) {
                console.log(`${group.name} === ${governanceGroup}`);
                if (group.name.trim() === governanceGroup.trim()) {
                    return group.id;
                }
            }
        }
        return null;
    }
}